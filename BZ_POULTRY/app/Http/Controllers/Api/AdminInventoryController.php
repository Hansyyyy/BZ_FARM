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
        $buildings = Building::orderedList();
        $buildingsById = $buildings->keyBy('id');
        $buildingsByName = $buildings->keyBy('name');
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

        $populationTable = $activeFlocks
            ->groupBy(fn (Flock $flock) => $this->resolveFlockBuildingName($flock, $buildingsById, $buildingsByName))
            ->map(function ($flocks, $buildingName) {
                $totalInitial = (int) $flocks->sum('initial_quantity');
                $totalRemaining = (int) $flocks->sum(fn (Flock $flock) => $flock->initial_quantity - $flock->mortality);
                $average = $totalInitial > 0
                    ? round(($totalRemaining / $totalInitial) * 100, 2)
                    : 0;

                return [
                    'building_no' => $buildingName,
                    'population' => (int) $flocks->sum('quantity'),
                    'average' => $average,
                    'remarks' => $flocks->pluck('type')->unique()->map(fn ($type) => ucfirst($type))->implode(', '),
                ];
            })
            ->sortBy('building_no')
            ->values();

        $productionTable = $eggRecords
            ->groupBy('building_id')
            ->map(function ($records) {
                $totalEggs = (int) $records->sum('total_eggs');
                $sellable = (int) $records->sum(fn (EggProduction $record) => max(
                    $record->total_eggs - $record->soft_shell_eggs - $record->damaged_eggs - $record->cracked_eggs,
                    0
                ));
                $farmAverage = $totalEggs > 0
                    ? round(($sellable / $totalEggs) * 100, 2)
                    : 0;

                return [
                    'building_no' => $records->first()->building?->name ?? 'N/A',
                    'population' => $totalEggs,
                    'production_average' => $farmAverage,
                    'farm_average' => $farmAverage,
                    'recorded_by' => $records->pluck('user.name')->filter()->unique()->implode(', ') ?: null,
                ];
            })
            ->sortBy('building_no')
            ->values();

        $totalProduction = round($eggRecords->sum('total_eggs'), 2);

        $chickens = $activeFlocks->map(function (Flock $flock) {
            $rate = $flock->initial_quantity > 0
                ? round(($flock->mortality / $flock->initial_quantity) * 100, 1)
                : 0;

            return [
                'id' => $flock->id,
                'building_no' => $this->resolveFlockBuildingName($flock, $buildingsById, $buildingsByName),
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

        $dailyByBuilding = $eggRecords
            ->groupBy('building_id')
            ->map(function ($records) use ($eggsToday) {
                $totalEggs = (int) $records->sum('total_eggs');
                $share = $eggsToday > 0 ? round(($totalEggs / $eggsToday) * 100, 1) : 0;
                $latest = $records->sortByDesc('created_at')->first();

                return [
                    'building' => $records->first()->building?->name ?? 'N/A',
                    'flock' => 'FL-'.$records->first()->building_id,
                    'eggs_collected' => $totalEggs,
                    'share_of_day' => $share,
                    'collection_time' => $latest?->created_at?->format('g:i A') ?? '—',
                    'recorded_by' => $records->pluck('user.name')->filter()->unique()->implode(', ') ?: '—',
                ];
            })
            ->sortBy('building')
            ->values();

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

        $buildingsList = $buildings->map(function (Building $building) use ($eggRecords, $activeFlocks, $buildingsById, $buildingsByName) {
            $records = $eggRecords->where('building_id', $building->id);
            $totalEggs = (int) $records->sum('total_eggs');
            $assignedFlocks = $activeFlocks->filter(
                fn (Flock $flock) => $this->flockBelongsToBuilding($flock, $building, $buildingsById, $buildingsByName)
            )->count();

            return [
                'id' => $building->id,
                'name' => $building->name,
                'population' => $totalEggs,
                'production' => $totalEggs,
                'assigned_flocks' => $assignedFlocks,
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
            'buildings' => $buildingsList,
            'medications' => $medications,
            'feeds' => $feeds,
            'manager_activities' => $managerActivities,
            'managers' => $managers,
        ]);
    }

    private function resolveFlockBuildingName(Flock $flock, $buildingsById, $buildingsByName): string
    {
        if ($buildingsById->has($flock->batch_no)) {
            return $buildingsById->get($flock->batch_no)->name;
        }

        if ($buildingsByName->has($flock->batch_no)) {
            return $flock->batch_no;
        }

        return $flock->batch_no;
    }

    private function flockBelongsToBuilding(Flock $flock, Building $building, $buildingsById, $buildingsByName): bool
    {
        if ((string) $flock->batch_no === (string) $building->id) {
            return true;
        }

        return $flock->batch_no === $building->name;
    }
}
