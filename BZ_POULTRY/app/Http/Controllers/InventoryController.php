<?php

namespace App\Http\Controllers;

use App\Helpers\ActivityLogger;
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

        $totalItems = InventoryItem::count();
        $totalValue = InventoryItem::select(DB::raw('SUM(stock * unit_price) as total'))->value('total') ?? 0;
        $lowStock = InventoryItem::whereColumn('stock', '<=', 'reorder_level')->count();
        $monthStart = Carbon::now()->startOfMonth();

        $stockIn = StockTransaction::where('item_type', 'inventory')
            ->where('type', 'in')->where('created_at', '>=', $monthStart)->sum('quantity');
        $stockOut = StockTransaction::where('item_type', 'inventory')
            ->where('type', 'out')->where('created_at', '>=', $monthStart)->sum('quantity');

        $byCategory = InventoryItem::select('category', DB::raw('SUM(stock) as total'))
            ->groupBy('category')->get();

        $recentTransactions = StockTransaction::where('item_type', 'inventory')->latest()->take(6)->get();
        $lowStockAlerts = InventoryItem::whereColumn('stock', '<=', 'reorder_level')->get();

        $monthlyMovement = StockTransaction::where('item_type', 'inventory')
            ->where('created_at', '>=', $monthStart)
            ->select('type', DB::raw('SUM(quantity) as total'))
            ->groupBy('type')->get();

        return view('inventory.index', compact(
            'items', 'totalItems', 'totalValue', 'lowStock', 'stockIn', 'stockOut',
            'byCategory', 'recentTransactions', 'lowStockAlerts', 'monthlyMovement'
        ));
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
        InventoryItem::create($data);
        ActivityLogger::log('created', 'Inventory', "Added inventory item {$data['name']}");

        return back()->with('success', 'Inventory item added.');
    }

    public function destroy(InventoryItem $inventory)
    {
        $name = $inventory->name;
        $inventory->delete();
        ActivityLogger::log('deleted', 'Inventory', "Deleted inventory item {$name}");

        return back()->with('success', 'Inventory item deleted.');
    }
}
