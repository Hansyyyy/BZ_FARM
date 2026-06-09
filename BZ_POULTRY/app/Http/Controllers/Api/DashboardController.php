<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\EggProduction;
use App\Models\FeedItem;
use App\Models\Flock;
use App\Models\InventoryItem;
use App\Models\MedicineItem;
use App\Models\Sale;
use App\Models\StockTransaction;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        $weekStart = Carbon::now()->startOfWeek();

        $totalPoultry = Flock::where('status', 'active')->sum('quantity');
        $eggsToday = EggProduction::whereDate('date', $today)->sum('good_eggs');
        $feedStock = FeedItem::sum('stock');
        $medicineStock = MedicineItem::sum('stock');
        $salesToday = Sale::whereDate('sale_date', $today)->sum('amount');
        $feedLow = FeedItem::whereColumn('stock', '<=', 'reorder_level')->count();
        $medicineLow = MedicineItem::whereColumn('stock', '<=', 'reorder_level')->count();

        $eggSummary = [
            'today' => EggProduction::whereDate('date', $today)->sum('good_eggs'),
            'week' => EggProduction::where('date', '>=', $weekStart)->sum('good_eggs'),
            'month' => EggProduction::whereMonth('date', $today->month)->whereYear('date', $today->year)->sum('good_eggs'),
            'daily_avg' => (int) EggProduction::whereMonth('date', $today->month)->avg('good_eggs'),
        ];

        $lowStockAlerts = collect()
            ->merge(FeedItem::whereColumn('stock', '<=', 'reorder_level')->get()->map(fn ($item) => [
                'name' => $item->name,
                'category' => 'Feed',
                'days_left' => max(1, (int) ($item->stock / 50)),
            ]))
            ->merge(MedicineItem::whereColumn('stock', '<=', 'reorder_level')->get()->map(fn ($item) => [
                'name' => $item->name,
                'category' => 'Medicine',
                'days_left' => max(1, (int) $item->stock),
            ]))
            ->take(5);

        $flockDistribution = [
            'layers' => (int) Flock::where('type', 'layers')->where('status', 'active')->sum('quantity'),
            'pullets' => (int) Flock::where('type', 'pullets')->where('status', 'active')->sum('quantity'),
            'roosters' => (int) Flock::where('type', 'roosters')->where('status', 'active')->sum('quantity'),
        ];

        $weeklyProduction = collect(range(0, 6))->map(function (int $offset) use ($weekStart) {
            $day = $weekStart->copy()->addDays($offset);

            return [
                'prod_date' => $day->toDateString(),
                'label' => $day->format('D'),
                'total' => (int) EggProduction::whereDate('date', $day)->sum('good_eggs'),
            ];
        })->values();

        $eggQuality = [
            'good' => (int) EggProduction::where('date', '>=', $weekStart)->sum('good_eggs'),
            'cracked' => (int) EggProduction::where('date', '>=', $weekStart)->sum('cracked_eggs'),
        ];

        $inventoryBreakdown = [
            'feed' => (float) FeedItem::sum('stock'),
            'medicine' => (float) MedicineItem::sum('stock'),
            'supplies' => (float) InventoryItem::where('category', 'Supplies')->sum('stock'),
            'others' => (float) InventoryItem::where('category', '!=', 'Supplies')->sum('stock'),
        ];

        $recentTransactions = StockTransaction::with('user')->latest()->take(8)->get()->map(fn ($txn) => [
            'id' => $txn->id,
            'type' => $txn->type,
            'quantity' => $txn->quantity,
            'item_name' => $txn->item_name,
            'created_at' => $txn->created_at,
        ]);

        return response()->json([
            'summary' => compact('totalPoultry', 'eggsToday', 'feedStock', 'medicineStock', 'salesToday', 'feedLow', 'medicineLow', 'eggSummary'),
            'weeklyProduction' => $weeklyProduction,
            'flockDistribution' => $flockDistribution,
            'eggQuality' => $eggQuality,
            'inventoryBreakdown' => $inventoryBreakdown,
            'lowStockAlerts' => $lowStockAlerts,
            'recentTransactions' => $recentTransactions,
            'recentActivities' => Activity::with('user')->latest()->take(6)->get(),
        ]);
    }
}
