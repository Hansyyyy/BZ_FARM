<?php

namespace App\Services;

use App\Models\EggProduction;
use App\Models\FeedItem;
use App\Models\Flock;
use App\Models\MedicineItem;
use App\Models\Sale;
use App\Models\StockTransaction;
use Carbon\Carbon;

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
        ];
    }
}
