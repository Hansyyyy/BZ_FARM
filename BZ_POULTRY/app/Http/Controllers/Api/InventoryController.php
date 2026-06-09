<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ActivityLogger;
use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\StockTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index()
    {
        $items = InventoryItem::latest()->paginate(10);
        $monthStart = Carbon::now()->startOfMonth();

        $totalItems = InventoryItem::count();
        $totalValue = InventoryItem::select(DB::raw('SUM(stock * unit_price) as total'))->value('total') ?? 0;
        $lowStock = InventoryItem::whereColumn('stock', '<=', 'reorder_level')->count();
        $stockIn = StockTransaction::where('item_type', 'inventory')
            ->where('type', 'in')->where('created_at', '>=', $monthStart)->sum('quantity');
        $stockOut = StockTransaction::where('item_type', 'inventory')
            ->where('type', 'out')->where('created_at', '>=', $monthStart)->sum('quantity');

        return response()->json([
            'items' => $items->items(),
            'pagination' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
            'summary' => compact('totalItems', 'totalValue', 'lowStock', 'stockIn', 'stockOut'),
            'byCategory' => InventoryItem::select('category', DB::raw('SUM(stock) as total'))->groupBy('category')->get(),
            'recentTransactions' => StockTransaction::where('item_type', 'inventory')->latest()->take(6)->get(),
            'lowStockAlerts' => InventoryItem::whereColumn('stock', '<=', 'reorder_level')->get(),
            'monthlyMovement' => StockTransaction::where('item_type', 'inventory')
                ->where('created_at', '>=', $monthStart)
                ->select('type', DB::raw('SUM(quantity) as total'))
                ->groupBy('type')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'item_code' => 'required|unique:inventory_items',
            'name' => 'required|string',
            'category' => 'required|string',
            'stock' => 'required|numeric|min:0',
            'unit' => 'required|string',
            'reorder_level' => 'required|numeric|min:0',
            'location' => 'nullable|string',
            'unit_price' => 'required|numeric|min:0',
        ]);

        $data['last_updated'] = now();
        $item = InventoryItem::create($data);
        ActivityLogger::log('created', 'Inventory', "Added inventory item {$data['name']}");

        return response()->json(['message' => 'Inventory item added.', 'item' => $item], 201);
    }

    public function destroy(InventoryItem $inventory)
    {
        $name = $inventory->name;
        $inventory->delete();
        ActivityLogger::log('deleted', 'Inventory', "Deleted inventory item {$name}");

        return response()->json(['message' => 'Inventory item deleted.']);
    }
}
