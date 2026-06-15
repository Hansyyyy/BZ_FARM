<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ActivityLogger;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\EggProduction;
use App\Models\Product;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        $weekStart = Carbon::now()->startOfWeek();
        $monthStart = Carbon::now()->startOfMonth();

        Sale::where('sale_date', '<', Carbon::now()->subDays(30))->delete();

        $eggsToday = EggProduction::whereDate('date', $today)->sum('total_eggs');
        $calTotal = EggProduction::whereDate('date', $today)->sum('total_eggs');
        $crackedToday = EggProduction::whereDate('date', $today)->sum('cracked_eggs');
        $weekTotal = EggProduction::where('date', '>=', $weekStart)->sum('total_eggs');
        $monthTotal = EggProduction::where('date', '>=', $monthStart)->sum('total_eggs');

        $sales = Sale::with(['customer', 'product'])->latest('sale_date')->paginate(10);

        $salesSummary = [
            'total_sold' => Sale::where('sale_date', '>=', $monthStart)->sum('quantity'),
            'avg_price' => Sale::where('sale_date', '>=', $monthStart)->avg('unit_price') ?? 0,
            'total_transactions' => Sale::where('sale_date', '>=', $monthStart)->count(),
            'new_customers' => Customer::where('created_at', '>=', $monthStart)->count(),
        ];

        return response()->json([
            'items' => $sales->items(),
            'pagination' => [
                'current_page' => $sales->currentPage(),
                'last_page' => $sales->lastPage(),
                'per_page' => $sales->perPage(),
                'total' => $sales->total(),
            ],
            'summary' => compact('eggsToday', 'calTotal', 'crackedToday', 'weekTotal', 'monthTotal', 'salesSummary'),
            'customers' => Customer::all(),
            'products' => Product::all(),
            'salesTrend' => Sale::where('sale_date', '>=', $monthStart)
                ->select('sale_date', DB::raw('SUM(amount) as total'))
                ->groupBy('sale_date')->orderBy('sale_date')->get(),
            'salesByProduct' => Sale::where('sale_date', '>=', $monthStart)
                ->join('products', 'sales.product_id', '=', 'products.id')
                ->select('products.name', DB::raw('SUM(sales.quantity) as total'))
                ->groupBy('products.name')->get(),
            'paymentStatus' => Sale::where('sale_date', '>=', $monthStart)
                ->select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')->get(),
            'recentSales' => Sale::with(['customer', 'product'])->latest('sale_date')->take(5)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'invoice_no' => ['required', 'string', 'unique:sales', 'regex:/^(SI#|DR#).+/'],
            'customer_id' => 'required|exists:customers,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,credit',
            'status' => 'required|in:paid,unpaid',
            'sale_date' => 'required|date',
        ]);

        $data['amount'] = $data['quantity'] * $data['unit_price'];
        $data['user_id'] = auth()->id();
        $sale = Sale::create($data);
        ActivityLogger::log('created', 'Sales', "New sale {$data['invoice_no']}");

        return response()->json(['message' => 'Sale recorded successfully.', 'item' => $sale], 201);
    }

    public function update(Request $request, Sale $sale)
    {
        $data = $request->validate([
            'invoice_no' => ['required', 'string', 'unique:sales,invoice_no,'.$sale->id, 'regex:/^(SI#|DR#).+/'],
            'customer_id' => 'required|exists:customers,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,credit',
            'status' => 'required|in:paid,unpaid',
            'sale_date' => 'required|date',
        ]);

        $data['amount'] = $data['quantity'] * $data['unit_price'];
        $sale->update($data);
        ActivityLogger::log('updated', 'Sales', "Updated sale {$data['invoice_no']}");

        return response()->json(['message' => 'Sale updated successfully.', 'item' => $sale]);
    }

    public function destroy(Sale $sale)
    {
        $invoice = $sale->invoice_no;
        $sale->delete();
        ActivityLogger::log('deleted', 'Sales', "Deleted sale {$invoice}");

        return response()->json(['message' => 'Sale deleted.']);
    }
}
