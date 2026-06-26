<?php

namespace App\Services;

use App\Models\EggProduction;
use App\Models\FeedItem;
use App\Models\Flock;
use App\Models\FlockLossRecord;
use App\Models\Building;
use App\Models\MedicineItem;
use App\Models\Sale;
use App\Models\StockTransaction;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Schema;

class DailyReportSnapshotService
{
    public function build(Carbon $date): array
    {
        $activeFlocks = Flock::where('status', 'active')->get();
        $eggRecords = EggProduction::with(['building', 'user'])
            ->whereDate('date', $date)
            ->get();
        $sales = Sale::with(['customer', 'product'])
            ->whereDate('sale_date', $date)
            ->get();
        $transactions = StockTransaction::with('user')
            ->whereDate('created_at', $date)
            ->latest()
            ->get();

        $eggsCollected = (int) $eggRecords->sum('total_eggs');
        $softShell = (int) $eggRecords->sum('soft_shell_eggs');
        $damaged = (int) $eggRecords->sum('damaged_eggs');
        $cracked = (int) $eggRecords->sum('cracked_eggs');
        $sellable = max($eggsCollected - $softShell - $damaged - $cracked, 0);

        // Feed transactions for the date (outgoing i.e. used)
        $feedTransactions = StockTransaction::with('building')
            ->where('item_type', 'feed')
            ->where('type', 'out')
            ->whereDate('created_at', $date)
            ->get();

        // Loss records (mortality/cull) for the date if available.
        $hasLossRecordsTable = Schema::hasTable('flock_loss_records');
        $lossRecords = $this->fetchLossRecords($date, $hasLossRecordsTable);

        return [
            'summary' => [
                'total_poultry' => (int) $activeFlocks->sum('quantity'),
                'eggs_collected' => $eggsCollected,
                'sellable_eggs' => $sellable,
                'defect_eggs' => $softShell + $damaged + $cracked,
                'sales_total' => (float) $sales->sum('amount'),
                'sales_count' => $sales->count(),
                'feed_stock' => (float) FeedItem::sum('stock'),
                'medicine_stock' => (float) MedicineItem::sum('stock'),
                'mortality' => (int) $activeFlocks->sum('mortality'),
                'transactions_count' => $transactions->count(),
            ],
            'egg_production' => $eggRecords->map(fn (EggProduction $record) => [
                'building' => $record->building?->name ?? 'N/A',
                'total_eggs' => (int) $record->total_eggs,
                'soft_shell' => (int) $record->soft_shell_eggs,
                'damaged' => (int) $record->damaged_eggs,
                'cracked' => (int) $record->cracked_eggs,
                'recorded_by' => $record->user?->name,
            ])->values()->all(),
            'poultry' => $activeFlocks->map(fn (Flock $flock) => [
                'batch_no' => $flock->batch_no,
                'type' => ucfirst($flock->type),
                'quantity' => (int) $flock->quantity,
                'mortality' => (int) $flock->mortality,
                'cull' => (int) ($flock->cull ?? 0),
                'status' => $flock->status,
            ])->values()->all(),
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
            // Feed consumption grouped by building and feed type
            'feed_consumption' => $feedTransactions->groupBy(function ($t) {
                return ($t->building?->name ?? 'Unassigned') . '|' . ($t->item_name ?? 'Unknown');
            })->map(function ($group, $key) {
                [$building, $feed] = explode('|', $key);
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
            // Mortality & cull details
            'mortality_cull_details' => (count($lossRecords) > 0)
                ? $lossRecords->map(fn ($r) => [
                    'building' => $r->building?->name ?? 'N/A',
                    'batch' => $r->flock?->batch_no ?? '—',
                    'mortality' => $r->type === 'mortality' ? (int) $r->quantity : 0,
                    'cull' => $r->type === 'cull' ? (int) $r->quantity : 0,
                    'reason' => $r->reason,
                ])->values()->all()
                : $activeFlocks->map(fn (Flock $f) => [
                    'building' => $f->building_name ?? 'N/A',
                    'batch' => $f->batch_no,
                    'mortality' => (int) $f->mortality,
                    'cull' => (int) ($f->cull ?? 0),
                    'reason' => null,
                ])->values()->all(),
            // Building performance comparison
            'building_performance' => Building::all()->map(fn (Building $b) => [
                'building' => $b->name,
                'chickens' => (int) Flock::where('building_id', $b->id)->sum('quantity'),
                'eggs' => (int) EggProduction::whereDate('date', $date)->where('building_id', $b->id)->sum('total_eggs'),
                'mortality' => $this->getBuildingMortality($b->id, $date, $hasLossRecordsTable),
                'feed_used' => (float) StockTransaction::where('building_id', $b->id)->where('item_type', 'feed')->where('type', 'out')->whereDate('created_at', $date)->sum('quantity'),
                'status' => 'ok',
            ])->values()->all(),
        ];
    }

    private function fetchLossRecords(Carbon $date, bool $hasLossRecordsTable)
    {
        if (! $hasLossRecordsTable) {
            return collect();
        }

        try {
            return FlockLossRecord::with(['building', 'flock', 'user'])
                ->whereDate('record_date', $date)
                ->get();
        } catch (QueryException $e) {
            return collect();
        }
    }

    private function getBuildingMortality(int $buildingId, Carbon $date, bool $hasLossRecordsTable): int
    {
        if (! $hasLossRecordsTable) {
            return 0;
        }

        try {
            return (int) FlockLossRecord::where('building_id', $buildingId)
                ->where('type', 'mortality')
                ->whereDate('record_date', $date)
                ->sum('quantity');
        } catch (QueryException $e) {
            return 0;
        }
    }
}
