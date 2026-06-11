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
            $sellable = max(
                $record->total_eggs - $record->soft_shell_eggs - $record->damaged_eggs - $record->cracked_eggs,
                0
            );
            $farmAverage = $record->total_eggs > 0
                ? round(($sellable / $record->total_eggs) * 100, 2)
                : 0;

            return [
                'building_no' => $record->building?->name ?? 'N/A',
                'population' => $record->total_eggs,
                'production_average' => $farmAverage,
                'farm_average' => $farmAverage,
                'recorded_by' => $record->user?->name,
            ];
        })->values();

        $totalProduction = round($eggRecords->sum('total_eggs'), 2);

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
            $softShell = (int) $records->sum('soft_shell_eggs');
            $damaged = (int) $records->sum('damaged_eggs');
            $cracked = (int) $records->sum('cracked_eggs');
            $total = (int) $records->sum('total_eggs');
            $sellable = max($total - $softShell - $damaged - $cracked, 0);

            return [
                'building' => $buildingName,
                'soft_shell' => $softShell,
                'damaged' => $damaged,
                'cracked' => $cracked,
                'sellable' => $sellable,
                'total' => $total,
            ];
        })->values();

        $gradeTotals = [
            'soft_shell' => (int) $gradingRows->sum('soft_shell'),
            'damaged' => (int) $gradingRows->sum('damaged'),
            'cracked' => (int) $gradingRows->sum('cracked'),
            'sellable' => (int) $gradingRows->sum('sellable'),
        ];
        $onHandTotal = array_sum($gradeTotals);

        $gradeBreakdown = collect([
            ['key' => 'sellable', 'label' => 'Sellable', 'color' => 'green', 'value' => $gradeTotals['sellable']],
            ['key' => 'soft_shell', 'label' => 'Soft Shell', 'color' => 'yellow', 'value' => $gradeTotals['soft_shell']],
            ['key' => 'damaged', 'label' => 'Damaged', 'color' => 'red', 'value' => $gradeTotals['damaged']],
            ['key' => 'cracked', 'label' => 'Cracked', 'color' => 'orange', 'value' => $gradeTotals['cracked']],
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
                'production' => $record?->total_eggs ?? 0,
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
