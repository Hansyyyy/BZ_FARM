<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ActivityLogger;
use App\Http\Controllers\Controller;
use App\Models\MedicineItem;
use App\Models\StockTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MedicineController extends Controller
{
    public function index()
    {
        $items = MedicineItem::latest()->paginate(10);
        $monthStart = Carbon::now()->startOfMonth();

        $totalItems = MedicineItem::count();
        $totalValue = MedicineItem::select(DB::raw('SUM(stock * unit_price) as total'))->value('total') ?? 0;
        $lowStock = MedicineItem::whereColumn('stock', '<=', 'reorder_level')->count();
        $expiringSoon = MedicineItem::where('expiry_date', '<=', Carbon::now()->addDays(30))
            ->where('expiry_date', '>=', Carbon::today())->count();
        $usedThisMonth = StockTransaction::where('item_type', 'medicine')
            ->where('type', 'out')
            ->where('created_at', '>=', $monthStart)
            ->sum('quantity');

        return response()->json([
            'items' => $items->items(),
            'pagination' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
            'summary' => compact('totalItems', 'totalValue', 'lowStock', 'expiringSoon', 'usedThisMonth'),
            'recentTransactions' => StockTransaction::where('item_type', 'medicine')->latest()->take(6)->get(),
            'expiringItems' => MedicineItem::where('expiry_date', '<=', Carbon::now()->addDays(30))
                ->where('expiry_date', '>=', Carbon::today())->get(),
            'lowStockAlerts' => MedicineItem::whereColumn('stock', '<=', 'reorder_level')->get(),
            'monthlyUsage' => StockTransaction::where('item_type', 'medicine')
                ->where('type', 'out')
                ->where('created_at', '>=', $monthStart)
                ->select(DB::raw('DATE(created_at) as day'), DB::raw('SUM(quantity) as total'))
                ->groupBy('day')->orderBy('day')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'category' => 'required|string',
            'type' => 'nullable|string',
            'stock' => 'required|numeric|min:0',
            'reorder_level' => 'required|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'unit_price' => 'required|numeric|min:0',
        ]);

        $data['last_stock_in'] = now();
        $item = MedicineItem::create($data);
        ActivityLogger::log('created', 'Medicine & Vaccine', "Added medicine item {$data['name']}");

        return response()->json(['message' => 'Medicine item added.', 'item' => $item], 201);
    }

    public function destroy(MedicineItem $medicine)
    {
        $name = $medicine->name;
        $medicine->delete();
        ActivityLogger::log('deleted', 'Medicine & Vaccine', "Deleted medicine item {$name}");

        return response()->json(['message' => 'Medicine item deleted.']);
    }
}
