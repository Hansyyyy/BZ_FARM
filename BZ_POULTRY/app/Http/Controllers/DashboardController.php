<?php

namespace App\Http\Controllers;

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
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
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

        $weeklyProduction = EggProduction::select(
            DB::raw('DATE(date) as prod_date'),
            DB::raw('SUM(good_eggs) as total')
        )
            ->where('date', '>=', $weekStart)
            ->groupBy('prod_date')
            ->orderBy('prod_date')
            ->get();

        $inventoryBreakdown = [
            'feed' => FeedItem::sum('stock'),
            'medicine' => MedicineItem::sum('stock'),
            'supplies' => InventoryItem::where('category', 'Supplies')->sum('stock'),
            'others' => InventoryItem::where('category', '!=', 'Supplies')->sum('stock'),
        ];

        $lowStockAlerts = collect()
            ->merge(FeedItem::whereColumn('stock', '<=', 'reorder_level')->get()->map(fn ($i) => [
                'name' => $i->name, 'category' => 'Feed', 'days_left' => max(1, (int) ($i->stock / 50)),
            ]))
            ->merge(MedicineItem::whereColumn('stock', '<=', 'reorder_level')->get()->map(fn ($i) => [
                'name' => $i->name, 'category' => 'Medicine', 'days_left' => max(1, (int) $i->stock),
            ]))
            ->take(5);

        $recentTransactions = StockTransaction::with('user')->latest()->take(8)->get();
        $eggSummary = [
            'today' => EggProduction::whereDate('date', $today)->sum('good_eggs'),
            'week' => EggProduction::where('date', '>=', $weekStart)->sum('good_eggs'),
            'month' => EggProduction::whereMonth('date', $today->month)->whereYear('date', $today->year)->sum('good_eggs'),
            'daily_avg' => (int) EggProduction::whereMonth('date', $today->month)->avg('good_eggs'),
        ];
        $recentActivities = Activity::with('user')->latest()->take(6)->get();

        if ($request->wantsJson()) {
            return response()->json([
                'summary' => compact('totalPoultry', 'eggsToday', 'feedStock', 'medicineStock', 'salesToday', 'feedLow', 'medicineLow', 'eggSummary'),
                'weeklyProduction' => $weeklyProduction,
                'inventoryBreakdown' => $inventoryBreakdown,
                'lowStockAlerts' => $lowStockAlerts,
                'recentTransactions' => $recentTransactions,
                'recentActivities' => $recentActivities,
            ]);
        }

        return view('dashboard.index', compact(
            'totalPoultry', 'eggsToday', 'feedStock', 'medicineStock', 'salesToday',
            'feedLow', 'medicineLow', 'weeklyProduction', 'inventoryBreakdown',
            'lowStockAlerts', 'recentTransactions', 'eggSummary', 'recentActivities'
        ));
    }
}
