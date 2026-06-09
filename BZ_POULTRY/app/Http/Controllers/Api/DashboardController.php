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
use Illuminate\Support\Facades\DB;

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

        return response()->json([
            'summary' => compact('totalPoultry', 'eggsToday', 'feedStock', 'medicineStock', 'salesToday', 'feedLow', 'medicineLow', 'eggSummary'),
            'weeklyProduction' => EggProduction::select(
                DB::raw('DATE(date) as prod_date'),
                DB::raw('SUM(good_eggs) as total')
            )
                ->where('date', '>=', $weekStart)
                ->groupBy('prod_date')
                ->orderBy('prod_date')
                ->get(),
            'inventoryBreakdown' => [
                'feed' => FeedItem::sum('stock'),
                'medicine' => MedicineItem::sum('stock'),
                'supplies' => InventoryItem::where('category', 'Supplies')->sum('stock'),
                'others' => InventoryItem::where('category', '!=', 'Supplies')->sum('stock'),
            ],
            'lowStockAlerts' => $lowStockAlerts,
            'recentTransactions' => StockTransaction::with('user')->latest()->take(8)->get(),
            'recentActivities' => Activity::with('user')->latest()->take(6)->get(),
        ]);
    }
}
