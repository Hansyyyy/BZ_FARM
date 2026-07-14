<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Sale;
use App\Models\StockTransaction;
use Illuminate\Http\Request;

class HistoryController extends Controller
{
    private const INVENTORY_MODULES = [
        'Poultry Stock',
        'Feed Inventory',
        'Medicine & Vaccine',
        'Inventory',
        'Egg Production',
    ];

    public function index(Request $request)
    {
        $type = $request->query('type', 'inventory');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        if ($type === 'sales') {
            $items = $this->salesHistory($startDate, $endDate);

            return response()->json([
                'type' => 'sales',
                'items' => $items,
                'total' => count($items),
            ]);
        }

        $items = $this->inventoryHistory($startDate, $endDate);

        return response()->json([
            'type' => 'inventory',
            'items' => $items,
            'total' => count($items),
        ]);
    }

    private function inventoryHistory(?string $startDate = null, ?string $endDate = null): array
    {
        $activitiesQuery = Activity::with('user')
            ->whereIn('module', self::INVENTORY_MODULES)
            ->latest();

        if ($startDate) {
            $activitiesQuery->whereDate('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $activitiesQuery->whereDate('created_at', '<=', $endDate);
        }

        $activities = $activitiesQuery
            ->take(150)
            ->get()
            ->map(fn (Activity $activity) => [
                'id' => 'activity-'.$activity->id,
                'timestamp' => $activity->created_at?->toIso8601String(),
                'date' => $activity->created_at?->toDateString(),
                'time' => $activity->created_at?->format('g:i A') ?? '—',
                'module' => $activity->module,
                'action' => ucfirst($activity->action),
                'description' => $activity->description,
                'recorded_by' => $activity->user?->name ?? 'System',
            ]);

        $transactionsQuery = StockTransaction::with('user')->latest();

        if ($startDate) {
            $transactionsQuery->whereDate('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $transactionsQuery->whereDate('created_at', '<=', $endDate);
        }

        $transactions = $transactionsQuery
            ->take(150)
            ->get()
            ->map(fn (StockTransaction $transaction) => [
                'id' => 'txn-'.$transaction->id,
                'timestamp' => $transaction->created_at?->toIso8601String(),
                'date' => $transaction->created_at?->toDateString(),
                'time' => $transaction->created_at?->format('g:i A') ?? '—',
                'module' => ucfirst($transaction->item_type).' Stock',
                'action' => $transaction->type === 'in' ? 'Stock In' : 'Stock Out',
                'description' => trim($transaction->item_name.' · '.number_format((float) $transaction->quantity, 2).' units'.($transaction->notes ? " · {$transaction->notes}" : '')),
                'recorded_by' => $transaction->user?->name ?? 'System',
            ]);

        return $activities
            ->concat($transactions)
            ->sortByDesc('timestamp')
            ->values()
            ->take(150)
            ->map(fn (array $item) => collect($item)->except('timestamp')->all())
            ->all();
    }

    private function salesHistory(?string $startDate = null, ?string $endDate = null): array
    {
        $salesQuery = Sale::with(['customer', 'product', 'user'])
            ->latest('sale_date')
            ->latest('id');

        if ($startDate) {
            $salesQuery->whereDate('sale_date', '>=', $startDate);
        }

        if ($endDate) {
            $salesQuery->whereDate('sale_date', '<=', $endDate);
        }

        return $salesQuery
            ->take(150)
            ->get()
            ->map(fn (Sale $sale) => [
                'id' => $sale->id,
                'sale_date' => $sale->sale_date?->toDateString(),
                'invoice_no' => $sale->invoice_no,
                'customer' => $sale->customer?->name ?? '—',
                'product' => $sale->product?->name ?? '—',
                'quantity' => (int) $sale->quantity,
                'amount' => (float) $sale->amount,
                'payment_method' => ucfirst($sale->payment_method ?? ''),
                'status' => ucfirst($sale->status ?? ''),
                'recorded_by' => $sale->user?->name ?? '—',
            ])
            ->values()
            ->all();
    }
}
