<?php

namespace App\Services;

use App\Models\Building;
use App\Models\EggProduction;
use App\Models\FeedItem;
use App\Models\Flock;
use App\Models\FlockLossRecord;
use App\Models\MedicineItem;
use App\Models\Sale;
use App\Models\StockTransaction;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class DailyReportSnapshotService
{
    public function buildRange(Carbon $startDate, Carbon $endDate): array
    {
        return $this->buildSnapshotData(
            $startDate->copy()->startOfDay(),
            $endDate->copy()->endOfDay()
        );
    }

    public function build(Carbon $date): array
    {
        $day = $date->copy()->startOfDay();

        return $this->buildSnapshotData($day, $day->copy()->endOfDay());
    }

    private function buildSnapshotData(Carbon $periodStart, Carbon $periodEnd): array
    {
        $startKey = $periodStart->toDateString();
        $endKey = $periodEnd->toDateString();
        $isSingleDay = $startKey === $endKey;
        $asOfDate = $periodEnd->copy()->endOfDay();

        $hasLossRecordsTable = Schema::hasTable('flock_loss_records');
        $flocksInPeriod = $this->flocksActiveDuringPeriod($periodStart, $periodEnd);
        $lossRecords = $this->fetchLossRecords($periodStart, $hasLossRecordsTable, $periodEnd);

        $eggRecords = EggProduction::with(['building', 'user', 'flock'])
            ->whereDate('date', '>=', $startKey)
            ->whereDate('date', '<=', $endKey)
            ->get();
        $sales = Sale::with(['customer', 'product'])
            ->whereDate('sale_date', '>=', $startKey)
            ->whereDate('sale_date', '<=', $endKey)
            ->get();
        $transactions = StockTransaction::with('user')
            ->whereBetween('created_at', [$periodStart, $periodEnd])
            ->latest()
            ->get();

        $eggsCollected = (int) $eggRecords->sum('total_eggs');
        $softShell = (int) $eggRecords->sum('soft_shell_eggs');
        $damaged = (int) $eggRecords->sum('damaged_eggs');
        $cracked = (int) $eggRecords->sum('cracked_eggs');
        $sellable = max($eggsCollected - $softShell - $damaged - $cracked, 0);

        $periodMortality = $this->sumLossesInPeriod(null, 'mortality', $periodStart, $periodEnd, $hasLossRecordsTable, $lossRecords);
        $periodCull = $this->sumLossesInPeriod(null, 'cull', $periodStart, $periodEnd, $hasLossRecordsTable, $lossRecords);
        $poultryRows = $this->buildPoultrySection($flocksInPeriod, $periodStart, $periodEnd, $hasLossRecordsTable, $lossRecords);

        $feedTransactions = StockTransaction::with('building')
            ->where('item_type', 'feed')
            ->where('type', 'out')
            ->whereBetween('created_at', [$periodStart, $periodEnd])
            ->get();

        return [
            'period' => [
                'start' => $startKey,
                'end' => $endKey,
                'is_single_day' => $isSingleDay,
            ],
            'summary' => [
                'total_poultry' => (int) collect($poultryRows)->sum('quantity'),
                'eggs_collected' => $eggsCollected,
                'sellable_eggs' => $sellable,
                'defect_eggs' => $softShell + $damaged + $cracked,
                'sales_total' => (float) $sales->sum('amount'),
                'sales_count' => $sales->count(),
                'feed_stock' => (float) FeedItem::sum('stock'),
                'medicine_stock' => (float) MedicineItem::sum('stock'),
                'mortality' => $periodMortality,
                'cull' => $periodCull,
                'transactions_count' => $transactions->count(),
            ],
            'egg_production' => $eggRecords
                ->groupBy(fn (EggProduction $record) => $record->building?->name ?? 'N/A')
                ->map(fn ($records, $buildingName) => [
                    'building' => $buildingName,
                    'total_eggs' => (int) $records->sum('total_eggs'),
                    'soft_shell' => (int) $records->sum('soft_shell_eggs'),
                    'damaged' => (int) $records->sum('damaged_eggs'),
                    'cracked' => (int) $records->sum('cracked_eggs'),
                    'recorded_by' => $records->first()?->user?->name ?? '—',
                ])
                ->values()
                ->all(),
            'poultry' => $poultryRows,
            'sales' => $sales->map(fn (Sale $sale) => [
                'invoice_no' => $sale->invoice_no,
                'customer' => $sale->customer?->name ?? 'Walk-in',
                'product' => $sale->product?->name ?? '—',
                'quantity' => (float) $sale->quantity,
                'amount' => (float) $sale->amount,
                'payment_method' => $sale->payment_method,
            ])->values()->all(),
            'low_stock' => collect()
                ->merge(FeedItem::whereColumn('stock', '<=', 'reorder_level')->get()->map(fn ($item) => [
                    'name' => $item->category,
                    'category' => 'Feed',
                    'stock' => (float) $item->stock,
                    'unit' => $item->unit,
                ]))
                ->merge(MedicineItem::whereColumn('stock', '<=', 'reorder_level')->get()->map(fn ($item) => [
                    'name' => $item->name,
                    'category' => 'Medicine',
                    'stock' => (float) $item->stock,
                    'unit' => $item->unit,
                ]))
                ->values()
                ->all(),
            'transactions' => $transactions->map(fn (StockTransaction $txn) => [
                'type' => $txn->type,
                'item_name' => $txn->item_name,
                'quantity' => (float) $txn->quantity,
                'notes' => $txn->notes,
                'recorded_by' => $txn->user?->name,
            ])->values()->all(),
            'feed_consumption' => $feedTransactions->groupBy(function ($t) {
                return ($t->building?->name ?? 'Unassigned').'|'.($t->item_name ?? 'Unknown');
            })->map(function ($group, $key) {
                [$building, $feed] = explode('|', $key, 2);
                $used = (float) $group->sum('quantity');
                $item = FeedItem::find($group->first()->item_id);
                $remaining = $item?->stock ?? 0;

                return [
                    'building' => $building,
                    'feed_type' => $feed,
                    'used' => $used,
                    'remaining' => (float) $remaining,
                ];
            })->values()->all(),
            'mortality_cull_details' => $this->buildMortalityCullDetails(
                $lossRecords,
                $flocksInPeriod,
                $periodStart,
                $periodEnd,
                $hasLossRecordsTable
            ),
            'building_performance' => Building::all()->map(fn (Building $b) => [
                'building' => $b->name,
                'chickens' => $this->buildingHeadcountOnDate($b->id, $asOfDate, $hasLossRecordsTable),
                'eggs' => (int) EggProduction::whereDate('date', '>=', $startKey)
                    ->whereDate('date', '<=', $endKey)
                    ->where('building_id', $b->id)
                    ->sum('total_eggs'),
                'mortality' => $this->getBuildingLossSum($b->id, 'mortality', $periodStart, $periodEnd, $hasLossRecordsTable),
                'cull' => $this->getBuildingLossSum($b->id, 'cull', $periodStart, $periodEnd, $hasLossRecordsTable),
                'feed_used' => (float) StockTransaction::where('building_id', $b->id)
                    ->where('item_type', 'feed')
                    ->where('type', 'out')
                    ->whereBetween('created_at', [$periodStart, $periodEnd])
                    ->sum('quantity'),
                'status' => $this->buildingPerformanceStatus($b->id, $periodStart, $periodEnd, $hasLossRecordsTable),
            ])->values()->all(),
        ];
    }

    private function buildPoultrySection(
        EloquentCollection $flocks,
        Carbon $periodStart,
        Carbon $periodEnd,
        bool $hasLossRecordsTable,
        Collection $lossRecords
    ): array {
        return $flocks->map(function (Flock $flock) use ($periodStart, $periodEnd, $hasLossRecordsTable, $lossRecords) {
            $mortality = $this->sumLossesInPeriod($flock->id, 'mortality', $periodStart, $periodEnd, $hasLossRecordsTable, $lossRecords);
            $cull = $this->sumLossesInPeriod($flock->id, 'cull', $periodStart, $periodEnd, $hasLossRecordsTable, $lossRecords);

            return [
                'building' => $flock->building_name ?? 'N/A',
                'batch_no' => $flock->batch_no,
                'type' => ucfirst($flock->type),
                'quantity' => $this->estimateHeadcountOnDate($flock, $periodEnd, $hasLossRecordsTable),
                'mortality' => $mortality,
                'cull' => $cull,
                'status' => $flock->status,
            ];
        })->sortBy('building')->values()->all();
    }

    private function buildMortalityCullDetails(
        Collection $lossRecords,
        EloquentCollection $flocks,
        Carbon $periodStart,
        Carbon $periodEnd,
        bool $hasLossRecordsTable
    ): array {
        if ($lossRecords->isNotEmpty()) {
            return $lossRecords
                ->groupBy(fn ($record) => ($record->building?->name ?? 'N/A').'|'.($record->flock?->batch_no ?? '—'))
                ->map(function ($records, $key) {
                    [$building, $batch] = explode('|', $key, 2);

                    return [
                        'building' => $building,
                        'batch' => $batch,
                        'mortality' => (int) $records->where('type', 'mortality')->sum('quantity'),
                        'cull' => (int) $records->where('type', 'cull')->sum('quantity'),
                        'reason' => $records->pluck('reason')->filter()->unique()->implode(', ') ?: '—',
                    ];
                })
                ->values()
                ->all();
        }

        if (! $hasLossRecordsTable) {
            return $flocks->map(fn (Flock $flock) => [
                'building' => $flock->building_name ?? 'N/A',
                'batch' => $flock->batch_no,
                'mortality' => 0,
                'cull' => 0,
                'reason' => 'No daily loss records for this period',
            ])->values()->all();
        }

        return [];
    }

    private function flocksActiveDuringPeriod(Carbon $periodStart, Carbon $periodEnd): EloquentCollection
    {
        $startKey = $periodStart->toDateString();
        $endKey = $periodEnd->toDateString();

        return Flock::query()
            ->where(function ($query) use ($endKey) {
                $query->whereNull('date_in')
                    ->orWhereDate('date_in', '<=', $endKey);
            })
            ->where(function ($query) use ($startKey) {
                $query->whereNull('date_out')
                    ->orWhereDate('date_out', '>=', $startKey);
            })
            ->orderBy('building_name')
            ->orderBy('batch_no')
            ->get();
    }

    private function wasActiveOnDate(Flock $flock, Carbon $date): bool
    {
        $dateKey = $date->toDateString();

        if ($flock->date_in && $flock->date_in->toDateString() > $dateKey) {
            return false;
        }

        if ($flock->date_out && $flock->date_out->toDateString() < $dateKey) {
            return false;
        }

        return true;
    }

    private function estimateHeadcountOnDate(Flock $flock, Carbon $date, bool $hasLossRecordsTable): int
    {
        if (! $this->wasActiveOnDate($flock, $date)) {
            return 0;
        }

        if (! $hasLossRecordsTable) {
            return (int) $flock->quantity;
        }

        try {
            $lossesAfterDate = (int) FlockLossRecord::where('flock_id', $flock->id)
                ->whereDate('record_date', '>', $date->toDateString())
                ->sum('quantity');

            return max(0, (int) $flock->quantity + $lossesAfterDate);
        } catch (QueryException $e) {
            return (int) $flock->quantity;
        }
    }

    private function buildingHeadcountOnDate(int $buildingId, Carbon $date, bool $hasLossRecordsTable): int
    {
        $building = Building::find($buildingId);

        if (! $building) {
            return 0;
        }

        $query = Flock::query();

        if (Schema::hasColumn('flocks', 'building_id')) {
            $query->where('building_id', $buildingId);
        } else {
            $query->where('building_name', $building->name);
        }

        return $query->get()
            ->filter(fn (Flock $flock) => $this->wasActiveOnDate($flock, $date))
            ->sum(fn (Flock $flock) => $this->estimateHeadcountOnDate($flock, $date, $hasLossRecordsTable));
    }

    private function sumLossesInPeriod(
        ?int $flockId,
        string $type,
        Carbon $periodStart,
        Carbon $periodEnd,
        bool $hasLossRecordsTable,
        Collection $lossRecords
    ): int {
        if (! $hasLossRecordsTable) {
            return 0;
        }

        $records = $lossRecords->where('type', $type);

        if ($flockId !== null) {
            $records = $records->where('flock_id', $flockId);
        }

        return (int) $records->sum('quantity');
    }

    private function getBuildingLossSum(
        int $buildingId,
        string $type,
        Carbon $periodStart,
        Carbon $periodEnd,
        bool $hasLossRecordsTable
    ): int {
        if (! $hasLossRecordsTable) {
            return 0;
        }

        try {
            $startKey = $periodStart->toDateString();
            $endKey = $periodEnd->toDateString();

            return (int) FlockLossRecord::where('building_id', $buildingId)
                ->where('type', $type)
                ->whereDate('record_date', '>=', $startKey)
                ->whereDate('record_date', '<=', $endKey)
                ->sum('quantity');
        } catch (QueryException $e) {
            return 0;
        }
    }

    private function buildingPerformanceStatus(
        int $buildingId,
        Carbon $periodStart,
        Carbon $periodEnd,
        bool $hasLossRecordsTable
    ): string {
        $mortality = $this->getBuildingLossSum($buildingId, 'mortality', $periodStart, $periodEnd, $hasLossRecordsTable);

        if ($mortality >= 20) {
            return 'high mortality';
        }

        if ($mortality >= 5) {
            return 'watch';
        }

        return 'ok';
    }

    private function fetchLossRecords(Carbon $startDate, bool $hasLossRecordsTable, ?Carbon $endDate = null)
    {
        if (! $hasLossRecordsTable) {
            return collect();
        }

        try {
            $query = FlockLossRecord::with(['building', 'flock', 'user']);

            if ($endDate) {
                $query->whereDate('record_date', '>=', $startDate->toDateString())
                    ->whereDate('record_date', '<=', $endDate->toDateString());
            } else {
                $query->whereDate('record_date', $startDate);
            }

            return $query->get();
        } catch (QueryException $e) {
            return collect();
        }
    }
}
