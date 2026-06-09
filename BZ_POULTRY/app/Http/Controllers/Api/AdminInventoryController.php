<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Building;
use App\Models\EggProduction;
use App\Models\FeedItem;
use App\Models\Flock;
use App\Models\MedicineItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AdminInventoryController extends Controller
{
    public function index(Request $request)
    {
        $date = Carbon::parse($request->get('date', now()->toDateString()))->startOfDay();
        $activeFlocks = Flock::where('status', 'active')->get();
        $eggRecords = EggProduction::with(['building', 'user'])
            ->whereDate('date', $date)
            ->get();

        $totalBirds = (int) $activeFlocks->sum('quantity');
        $eggsToday = (int) $eggRecords->sum('total_eggs');
        $mortality = (int) $activeFlocks->sum('mortality');
        $cull = (int) $eggRecords->sum('cracked_eggs');

        $growerCount = (int) $activeFlocks->where('type', 'pullets')->sum('quantity');
        $layerCount = (int) $activeFlocks->where('type', 'layers')->sum('quantity');

        $populationTable = $activeFlocks->map(function (Flock $flock) {
            $average = $flock->initial_quantity > 0
                ? round((($flock->initial_quantity - $flock->mortality) / $flock->initial_quantity) * 100, 2)
                : 0;

            return [
                'building_no' => $flock->batch_no,
                'population' => $flock->quantity,
                'average' => $average,
                'remarks' => ucfirst($flock->type),
            ];
        })->values();

        $productionTable = $eggRecords->map(function (EggProduction $record) {
            $farmAverage = $record->total_eggs > 0
                ? round(($record->good_eggs / $record->total_eggs) * 100, 2)
                : 0;

            return [
                'building_no' => $record->building?->name ?? 'N/A',
                'population' => $record->total_eggs,
                'production_average' => $farmAverage,
                'farm_average' => $farmAverage,
                'recorded_by' => $record->user?->name,
            ];
        })->values();

        $totalProduction = round($eggRecords->sum('good_eggs'), 2);

        $chickens = $activeFlocks->map(function (Flock $flock) {
            $rate = $flock->initial_quantity > 0
                ? round(($flock->mortality / $flock->initial_quantity) * 100, 1)
                : 0;

            return [
                'id' => $flock->id,
                'building_no' => $flock->batch_no,
                'type' => ucfirst($flock->type === 'pullets' ? 'Grower' : $flock->type),
                'current_population' => $flock->quantity,
                'age' => "{$flock->age_weeks} week(s)",
                'cull' => max(0, (int) round($flock->mortality * 0.1)),
                'mortality' => $flock->mortality,
                'mortality_rate' => "{$flock->mortality} ({$rate}%)",
                'mortality_rate_value' => $rate,
                'status' => $flock->status,
            ];
        })->values();

        $dailyByBuilding = $eggRecords->map(function (EggProduction $record) use ($eggsToday) {
            $share = $eggsToday > 0 ? round(($record->total_eggs / $eggsToday) * 100, 1) : 0;

            return [
                'building' => $record->building?->name ?? 'N/A',
                'flock' => 'FL-'.$record->building_id,
                'eggs_collected' => $record->total_eggs,
                'share_of_day' => $share,
                'collection_time' => $record->created_at?->format('g:i A') ?? '—',
                'recorded_by' => $record->user?->name,
            ];
        })->values();

        $gradingRows = $eggRecords->groupBy('building_id')->map(function ($records, $buildingId) {
            $buildingName = $records->first()->building?->name ?? 'Building '.$buildingId;
            $good = (int) $records->sum('good_eggs');
            $cracked = (int) $records->sum('cracked_eggs');
            $gradeAa = (int) round($good * 0.63);
            $gradeA = (int) round($good * 0.27);
            $gradeB = (int) max($good - $gradeAa - $gradeA, 0);
            $dirty = max((int) $records->sum('total_eggs') - $good - $cracked, 0);
            $total = (int) $records->sum('total_eggs');

            return [
                'building' => $buildingName,
                'grade_aa' => $gradeAa,
                'grade_a' => $gradeA,
                'grade_b' => $gradeB,
                'cracked' => $cracked,
                'dirty' => $dirty,
                'total' => $total,
            ];
        })->values();

        $gradeTotals = [
            'grade_aa' => (int) $gradingRows->sum('grade_aa'),
            'grade_a' => (int) $gradingRows->sum('grade_a'),
            'grade_b' => (int) $gradingRows->sum('grade_b'),
            'cracked' => (int) $gradingRows->sum('cracked'),
            'dirty' => (int) $gradingRows->sum('dirty'),
        ];
        $onHandTotal = array_sum($gradeTotals);

        $gradeBreakdown = collect([
            ['key' => 'grade_aa', 'label' => 'Grade AA', 'color' => 'green', 'value' => $gradeTotals['grade_aa']],
            ['key' => 'grade_a', 'label' => 'Grade A', 'color' => 'blue', 'value' => $gradeTotals['grade_a']],
            ['key' => 'grade_b', 'label' => 'Grade B', 'color' => 'yellow', 'value' => $gradeTotals['grade_b']],
            ['key' => 'cracked', 'label' => 'Cracked', 'color' => 'orange', 'value' => $gradeTotals['cracked']],
            ['key' => 'dirty', 'label' => 'Dirty', 'color' => 'red', 'value' => $gradeTotals['dirty']],
        ])->map(function (array $grade) use ($onHandTotal) {
            $grade['percent'] = $onHandTotal > 0 ? round(($grade['value'] / $onHandTotal) * 100) : 0;

            return $grade;
        })->values();

        $inventoryTable = $gradeBreakdown->map(function (array $grade) {
            $incoming = (int) round($grade['value'] * 0.12);
            $outgoing = (int) round($grade['value'] * 0.08);

            return [
                'grade' => $grade['label'],
                'on_hand' => $grade['value'],
                'incoming_today' => $incoming,
                'outgoing' => $outgoing,
                'net' => $incoming - $outgoing,
            ];
        })->values();

        $buildings = Building::all()->map(function (Building $building) use ($eggRecords, $activeFlocks) {
            $record = $eggRecords->firstWhere('building_id', $building->id);

            return [
                'id' => $building->id,
                'name' => $building->name,
                'population' => $record?->total_eggs ?? 0,
                'production' => $record?->good_eggs ?? 0,
                'assigned_flocks' => $activeFlocks->count() > 0
                    ? (int) ceil($activeFlocks->count() / max(Building::count(), 1))
                    : 0,
            ];
        })->values();

        $medications = MedicineItem::latest()->get()->map(fn (MedicineItem $item) => [
            'name' => $item->name,
            'category' => $item->category,
            'stock' => $item->stock,
            'unit' => $item->unit,
            'status' => $item->stock <= $item->reorder_level ? 'low' : 'active',
        ])->values();

        $feeds = FeedItem::latest()->get()->map(fn (FeedItem $item) => [
            'name' => $item->name,
            'category' => $item->category,
            'stock' => $item->stock,
            'unit' => $item->unit,
            'status' => $item->stock <= $item->reorder_level ? 'low' : 'active',
        ])->values();

        $managerActivities = Activity::with('user')
            ->whereHas('user', fn ($query) => $query->where('role', 'manager'))
            ->latest()
            ->take(15)
            ->get()
            ->map(fn (Activity $activity) => [
                'id' => $activity->id,
                'description' => $activity->description,
                'module' => $activity->module,
                'action' => $activity->action,
                'manager' => $activity->user?->name ?? 'Manager',
                'created_at' => $activity->created_at,
            ])->values();

        $managers = User::where('role', 'manager')->get(['id', 'name', 'username']);

        return response()->json([
            'date' => $date->toDateString(),
            'summary' => [
                'totalBirds' => $totalBirds,
                'eggsToday' => $eggsToday,
                'cull' => $cull,
                'mortality' => $mortality,
            ],
            'overview' => [
                'grower_count' => $growerCount,
                'layer_count' => $layerCount,
                'total_production' => $totalProduction,
                'population_table' => $populationTable,
                'production_table' => $productionTable,
            ],
            'chickens' => $chickens,
            'egg_productions' => [
                'daily_by_building' => $dailyByBuilding,
                'grading' => $gradingRows,
                'inventory' => [
                    'total_on_hand' => $onHandTotal,
                    'grade_breakdown' => $gradeBreakdown,
                    'inventory_table' => $inventoryTable,
                ],
            ],
            'buildings' => $buildings,
            'medications' => $medications,
            'feeds' => $feeds,
            'manager_activities' => $managerActivities,
            'managers' => $managers,
        ]);
    }
}
