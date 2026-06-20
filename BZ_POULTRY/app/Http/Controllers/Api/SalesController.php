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
use Illuminate\Validation\ValidationException;

class SalesController extends Controller
{
    private const EGG_TYPE_LABELS = [
        'piwi' => 'Piwi',
        'small' => 'Small',
        'medium' => 'Medium',
        'large' => 'Large',
        'extra_large' => 'Extra Large',
        'jumbo' => 'Jumbo',
        'super_jumbo' => 'Super Jumbo',
    ];

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
            'items' => collect($sales->items())->map(fn (Sale $sale) => $this->formatSale($sale))->values(),
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
            'recentSales' => Sale::with(['customer', 'product'])->latest('sale_date')->take(5)->get()
                ->map(fn (Sale $sale) => $this->formatSale($sale)),
        ]);
    }

    public function store(Request $request)
    {
        $request->merge([
            'egg_lines' => $this->normalizeEggLinesInput($request->input('egg_lines')),
        ]);

        $data = $request->validate([
            'invoice_no' => ['required', 'string', 'unique:sales,invoice_no', 'regex:/^(SI#|DR#).+/'],
            'customer_id' => 'required|exists:customers,id',
            'product_id' => 'nullable|exists:products,id',
            'sale_category' => 'required|in:egg,chicken',
            'egg_type' => 'nullable|string|max:255',
            'egg_lines' => 'nullable|array|min:1',
            'egg_lines.*.egg_type' => 'required_with:egg_lines|string|max:255',
            'egg_lines.*.product_id' => 'required_with:egg_lines|exists:products,id',
            'egg_lines.*.quantity' => 'required_with:egg_lines|integer|min:1',
            'egg_lines.*.unit_price' => 'required_with:egg_lines|numeric|min:0',
            'chicken_type' => 'nullable|string|max:255|required_if:sale_category,chicken',
            'quantity' => 'nullable|integer|min:0',
            'quantity_heads' => 'nullable|integer|min:1|required_if:sale_category,chicken',
            'quantity_trays' => 'nullable|integer|min:0',
            'quantity_pieces' => 'nullable|integer|min:0',
            'pricing_unit' => 'nullable|in:per_head,per_tray,per_piece|required_if:sale_category,egg|required_if:sale_category,chicken',
            'unit_price' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:cash,credit',
            'status' => 'required|in:paid,unpaid',
            'sale_date' => 'required|date',
        ]);

        $data = $this->normalizeSalePayload($data);

        $data['user_id'] = auth()->id();
        $sale = Sale::create($data);
        ActivityLogger::log('created', 'Sales', "New sale {$data['invoice_no']}");

        return response()->json([
            'message' => 'Sale recorded successfully.',
            'item' => $this->formatSale($sale->load(['customer', 'product'])),
        ], 201);
    }

    public function update(Request $request, Sale $sale)
    {
        $request->merge([
            'egg_lines' => $this->normalizeEggLinesInput($request->input('egg_lines')),
        ]);

        $data = $request->validate([
            'invoice_no' => ['required', 'string', 'unique:sales,invoice_no,'.$sale->id, 'regex:/^(SI#|DR#).+/'],
            'customer_id' => 'required|exists:customers,id',
            'product_id' => 'nullable|exists:products,id',
            'sale_category' => 'required|in:egg,chicken',
            'egg_type' => 'nullable|string|max:255',
            'egg_lines' => 'nullable|array|min:1',
            'egg_lines.*.egg_type' => 'required_with:egg_lines|string|max:255',
            'egg_lines.*.product_id' => 'required_with:egg_lines|exists:products,id',
            'egg_lines.*.quantity' => 'required_with:egg_lines|integer|min:1',
            'egg_lines.*.unit_price' => 'required_with:egg_lines|numeric|min:0',
            'chicken_type' => 'nullable|string|max:255|required_if:sale_category,chicken',
            'quantity' => 'nullable|integer|min:0',
            'quantity_heads' => 'nullable|integer|min:1|required_if:sale_category,chicken',
            'quantity_trays' => 'nullable|integer|min:0',
            'quantity_pieces' => 'nullable|integer|min:0',
            'pricing_unit' => 'nullable|in:per_head,per_tray,per_piece|required_if:sale_category,egg|required_if:sale_category,chicken',
            'unit_price' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:cash,credit',
            'status' => 'required|in:paid,unpaid',
            'sale_date' => 'required|date',
        ]);

        $data = $this->normalizeSalePayload($data);
        $sale->update($data);
        ActivityLogger::log('updated', 'Sales', "Updated sale {$data['invoice_no']}");

        return response()->json([
            'message' => 'Sale updated successfully.',
            'item' => $this->formatSale($sale->load(['customer', 'product'])),
        ]);
    }

    public function destroy(Sale $sale)
    {
        $invoice = $sale->invoice_no;
        $sale->delete();
        ActivityLogger::log('deleted', 'Sales', "Deleted sale {$invoice}");

        return response()->json(['message' => 'Sale deleted.']);
    }

    private function normalizeEggLinesInput(mixed $eggLines): ?array
    {
        if ($eggLines === null || $eggLines === '') {
            return null;
        }

        if (is_string($eggLines)) {
            $decoded = json_decode($eggLines, true);

            return is_array($decoded) ? $decoded : null;
        }

        return is_array($eggLines) ? $eggLines : null;
    }

    private function normalizeSalePayload(array $data): array
    {
        if (($data['sale_category'] ?? null) === 'chicken') {
            $data['quantity'] = (int) ($data['quantity_heads'] ?? 0);
            $data['pricing_unit'] = 'per_head';
            $data['egg_type'] = null;
            $data['egg_lines'] = null;
            $data['quantity_trays'] = null;
            $data['quantity_pieces'] = null;
            $data['amount'] = $data['quantity'] * (float) ($data['unit_price'] ?? 0);

            return $data;
        }

        $pricingUnit = $data['pricing_unit'] ?? 'per_tray';
        $eggLines = collect($data['egg_lines'] ?? [])->map(function (array $line) {
            return [
                'egg_type' => $line['egg_type'],
                'egg_type_label' => self::EGG_TYPE_LABELS[$line['egg_type']] ?? ucfirst(str_replace('_', ' ', $line['egg_type'])),
                'product_id' => (int) $line['product_id'],
                'quantity' => (int) $line['quantity'],
                'unit_price' => (float) $line['unit_price'],
                'line_total' => (int) $line['quantity'] * (float) $line['unit_price'],
            ];
        })->values()->all();

        if (empty($eggLines)) {
            throw ValidationException::withMessages([
                'egg_lines' => ['Add at least one egg type.'],
            ]);
        }

        $duplicateTypes = collect($eggLines)
            ->pluck('egg_type')
            ->duplicates()
            ->values();

        if ($duplicateTypes->isNotEmpty()) {
            throw ValidationException::withMessages([
                'egg_lines' => ['Each egg type can only be selected once per sale.'],
            ]);
        }

        $totalAmount = collect($eggLines)->sum('line_total');
        $totalQuantity = collect($eggLines)->sum('quantity');
        $firstLine = $eggLines[0];

        $data['egg_lines'] = $eggLines;
        $data['egg_type'] = $firstLine['egg_type'];
        $data['product_id'] = $firstLine['product_id'];
        $data['unit_price'] = $firstLine['unit_price'];
        $data['quantity'] = $totalQuantity;
        $data['amount'] = $totalAmount;
        $data['chicken_type'] = null;
        $data['quantity_heads'] = null;

        if ($pricingUnit === 'per_piece') {
            $data['quantity_pieces'] = $totalQuantity;
            $data['quantity_trays'] = null;
            $data['pricing_unit'] = 'per_piece';
        } else {
            $data['quantity_trays'] = $totalQuantity;
            $data['quantity_pieces'] = null;
            $data['pricing_unit'] = 'per_tray';
        }

        return $data;
    }

    private function formatSale(Sale $sale): array
    {
        $payload = $sale->toArray();
        $payload['product_summary'] = $this->buildProductSummary($sale);

        return $payload;
    }

    private function buildProductSummary(Sale $sale): string
    {
        if ($sale->sale_category === 'egg' && is_array($sale->egg_lines) && count($sale->egg_lines) > 0) {
            return collect($sale->egg_lines)
                ->map(fn (array $line) => $line['egg_type_label'] ?? ucfirst(str_replace('_', ' ', $line['egg_type'] ?? '')))
                ->filter()
                ->join(', ');
        }

        return $sale->product?->name ?? '—';
    }
}
