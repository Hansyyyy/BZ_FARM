<?php

namespace App\Http\Controllers;

use App\Helpers\ActivityLogger;
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

        $eggsToday = EggProduction::whereDate('date', $today)->sum('total_eggs');
        $calTotal = EggProduction::whereDate('date', $today)->sum('good_eggs');
        $crackedToday = EggProduction::whereDate('date', $today)->sum('cracked_eggs');
        $weekTotal = EggProduction::where('date', '>=', $weekStart)->sum('good_eggs');
        $monthTotal = EggProduction::where('date', '>=', $monthStart)->sum('good_eggs');

        $sales = Sale::with(['customer', 'product'])->latest('sale_date')->paginate(10);
        $customers = Customer::all();
        $products = Product::all();

        $salesTrend = Sale::where('sale_date', '>=', $monthStart)
            ->select('sale_date', DB::raw('SUM(amount) as total'))
            ->groupBy('sale_date')->orderBy('sale_date')->get();

        $salesByProduct = Sale::where('sale_date', '>=', $monthStart)
            ->join('products', 'sales.product_id', '=', 'products.id')
            ->select('products.name', DB::raw('SUM(sales.quantity) as total'))
            ->groupBy('products.name')->get();

        $salesSummary = [
            'total_sold' => Sale::where('sale_date', '>=', $monthStart)->sum('quantity'),
            'avg_price' => Sale::where('sale_date', '>=', $monthStart)->avg('unit_price') ?? 0,
            'total_transactions' => Sale::where('sale_date', '>=', $monthStart)->count(),
            'new_customers' => Customer::where('created_at', '>=', $monthStart)->count(),
        ];

        $paymentStatus = Sale::where('sale_date', '>=', $monthStart)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')->get();

        $recentSales = Sale::with(['customer', 'product'])->latest('sale_date')->take(5)->get();

        return view('sales.index', compact(
            'eggsToday', 'calTotal', 'crackedToday', 'weekTotal', 'monthTotal',
            'sales', 'customers', 'products', 'salesTrend', 'salesByProduct',
            'salesSummary', 'paymentStatus', 'recentSales'
        ));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'invoice_no' => 'required|unique:sales',
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
        Sale::create($data);
        ActivityLogger::log('created', 'Sales', "New sale {$data['invoice_no']}");

        return back()->with('success', 'Sale recorded successfully.');
    }

    public function destroy(Sale $sale)
    {
        $invoice = $sale->invoice_no;
        $sale->delete();
        ActivityLogger::log('deleted', 'Sales', "Deleted sale {$invoice}");

        return back()->with('success', 'Sale deleted.');
    }
}
