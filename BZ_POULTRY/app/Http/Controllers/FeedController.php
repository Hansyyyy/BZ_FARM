<?php

namespace App\Http\Controllers;

use App\Helpers\ActivityLogger;
use App\Models\FeedItem;
use App\Models\StockTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FeedController extends Controller
{
    public function index()
    {
        $feeds = FeedItem::latest()->paginate(10);

        $totalItems = FeedItem::count();
        $totalStock = FeedItem::sum('stock');
        $lowStock = FeedItem::whereColumn('stock', '<=', 'reorder_level')->count();
        $monthStart = Carbon::now()->startOfMonth();

        $consumed = StockTransaction::where('item_type', 'feed')
            ->where('type', 'out')
            ->where('created_at', '>=', $monthStart)
            ->sum('quantity');

        $feedCost = FeedItem::select(DB::raw('SUM(stock * cost_per_kg) as total'))->value('total') ?? 0;

        $stockLevels = FeedItem::select('category', DB::raw('SUM(stock) as total'))
            ->groupBy('category')->get();

        $recentTransactions = StockTransaction::where('item_type', 'feed')->latest()->take(6)->get();
        $lowStockAlerts = FeedItem::whereColumn('stock', '<=', 'reorder_level')->get();

        $monthlyConsumption = StockTransaction::where('item_type', 'feed')
            ->where('type', 'out')
            ->where('created_at', '>=', $monthStart)
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('SUM(quantity) as total'))
            ->groupBy('day')->orderBy('day')->get();

        return view('feed.index', compact(
            'feeds', 'totalItems', 'totalStock', 'lowStock', 'consumed',
            'feedCost', 'stockLevels', 'recentTransactions', 'lowStockAlerts', 'monthlyConsumption'
        ));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'category' => 'required|string',
            'stock' => 'required|numeric|min:0',
            'reorder_level' => 'required|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'cost_per_kg' => 'required|numeric|min:0',
        ]);

        $data['last_stock_in'] = now();
        FeedItem::create($data);
        ActivityLogger::log('created', 'Feed Inventory', "Added feed item {$data['name']}");

        return back()->with('success', 'Feed item added.');
    }

    public function destroy(FeedItem $feed)
    {
        $name = $feed->name;
        $feed->delete();
        ActivityLogger::log('deleted', 'Feed Inventory', "Deleted feed item {$name}");

        return back()->with('success', 'Feed item deleted.');
    }
}
