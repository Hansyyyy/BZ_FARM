<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ActivityLogger;
use App\Http\Controllers\Controller;
use App\Models\FeedItem;
use App\Models\StockTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class FeedController extends Controller
{
    private const CATEGORIES = ['Booster', 'Starter', 'Grower', 'Prelay', 'Layer 1', 'Layer 2'];

    public function index()
    {
        $feeds = FeedItem::latest()->paginate(10);
        $monthStart = Carbon::now()->startOfMonth();

        $totalItems = FeedItem::count();
        $totalStock = FeedItem::sum('stock');
        $lowStock = FeedItem::whereColumn('stock', '<=', 'reorder_level')->count();
        $consumed = StockTransaction::where('item_type', 'feed')
            ->where('type', 'out')
            ->where('created_at', '>=', $monthStart)
            ->sum('quantity');
        $feedCost = FeedItem::select(DB::raw('SUM(stock * cost_per_kg) as total'))->value('total') ?? 0;

        return response()->json([
            'items' => $feeds->items(),
            'pagination' => [
                'current_page' => $feeds->currentPage(),
                'last_page' => $feeds->lastPage(),
                'per_page' => $feeds->perPage(),
                'total' => $feeds->total(),
            ],
            'summary' => compact('totalItems', 'totalStock', 'lowStock', 'consumed', 'feedCost'),
            'stockLevels' => FeedItem::select('category', DB::raw('SUM(stock) as total'))->groupBy('category')->get(),
            'recentTransactions' => StockTransaction::where('item_type', 'feed')->latest()->take(6)->get(),
            'lowStockAlerts' => FeedItem::whereColumn('stock', '<=', 'reorder_level')->get(),
            'monthlyConsumption' => StockTransaction::where('item_type', 'feed')
                ->where('type', 'out')
                ->where('created_at', '>=', $monthStart)
                ->select(DB::raw('DATE(created_at) as day'), DB::raw('SUM(quantity) as total'))
                ->groupBy('day')->orderBy('day')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'category' => ['nullable', 'string', Rule::in(self::CATEGORIES)],
            'stock' => 'required|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'reorder_level' => 'required|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'last_stock_in' => 'nullable|date',
            'cost_per_kg' => 'required|numeric|min:0',
        ]);

        if (empty($data['category']) && in_array($data['name'], self::CATEGORIES, true)) {
            $data['category'] = $data['name'];
        }

        $request->merge($data);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'category' => ['required', 'string', Rule::in(self::CATEGORIES)],
            'stock' => 'required|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'reorder_level' => 'required|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'last_stock_in' => 'nullable|date',
            'cost_per_kg' => 'required|numeric|min:0',
        ]);

        $data['last_stock_in'] = $data['last_stock_in'] ?? now();
        $feedItem = FeedItem::create($data);
        ActivityLogger::log('created', 'Feed Inventory', "Added feed item {$data['name']}");

        return response()->json(['message' => 'Feed item added.', 'item' => $feedItem], 201);
    }

    public function update(Request $request, FeedItem $feed)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'category' => ['nullable', 'string', Rule::in(self::CATEGORIES)],
            'stock' => 'required|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'reorder_level' => 'required|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'last_stock_in' => 'nullable|date',
            'cost_per_kg' => 'required|numeric|min:0',
        ]);

        if (empty($data['category']) && in_array($data['name'], self::CATEGORIES, true)) {
            $data['category'] = $data['name'];
        }

        $request->merge($data);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'category' => ['required', 'string', Rule::in(self::CATEGORIES)],
            'stock' => 'required|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'reorder_level' => 'required|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'last_stock_in' => 'nullable|date',
            'cost_per_kg' => 'required|numeric|min:0',
        ]);

        $feed->update($data);
        ActivityLogger::log('updated', 'Feed Inventory', "Updated feed item {$data['name']}");

        return response()->json(['message' => 'Feed item updated.', 'item' => $feed]);
    }

    public function destroy(FeedItem $feed)
    {
        $category = $feed->category;
        $feed->delete();
        ActivityLogger::log('deleted', 'Feed Inventory', "Deleted feed item {$category}");

        return response()->json(['message' => 'Feed item deleted.']);
    }
}
