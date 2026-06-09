@extends('layouts.app')
@section('title', 'Sales Management')
@section('page-title', 'Sales Management')
@section('page-description', 'Manage sales transactions and customers')

@section('content')
<div class="stat-cards">
    <div class="stat-card"><div class="label">Eggs Collected Today</div><div class="value">{{ number_format($eggsToday) }} pcs</div></div>
    <div class="stat-card"><div class="label">Cal Total</div><div class="value">{{ number_format($calTotal) }} pcs</div></div>
    <div class="stat-card"><div class="label">Cracked Eggs</div><div class="value">{{ number_format($crackedToday) }} pcs</div></div>
    <div class="stat-card"><div class="label">This Week</div><div class="value">{{ number_format($weekTotal) }} pcs</div></div>
    <div class="stat-card"><div class="label">This Month</div><div class="value">{{ number_format($monthTotal) }} pcs</div></div>
</div>

<div class="grid-2-1">
    <div class="card">
        <div class="table-toolbar">
            <div class="search-box"><i class="bi bi-search"></i><input type="text" placeholder="Search sales..."></div>
            <button class="btn btn-success" onclick="openModal('addSaleModal')"><i class="bi bi-plus-lg"></i> New Sale</button>
        </div>
        <table class="data-table">
            <thead><tr><th>Date</th><th>Invoice No.</th><th>Customer</th><th>Product</th><th>Qty</th><th>Amount</th><th>Payment</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
                @foreach($sales as $sale)
                <tr>
                    <td>{{ $sale->sale_date->format('M d, Y') }}</td>
                    <td><strong>{{ $sale->invoice_no }}</strong></td>
                    <td>{{ $sale->customer->name }}</td>
                    <td>{{ $sale->product->name }}</td>
                    <td>{{ $sale->quantity }}</td>
                    <td>₱{{ number_format($sale->amount, 2) }}</td>
                    <td>{{ ucfirst($sale->payment_method) }}</td>
                    <td><span class="status-badge status-{{ $sale->status }}">{{ ucfirst($sale->status) }}</span></td>
                    <td><form action="{{ route('sales.destroy', $sale) }}" method="POST" onsubmit="return confirm('Delete?')">@csrf @method('DELETE')<button class="action-btn delete" type="submit"><i class="bi bi-trash"></i></button></form></td>
                </tr>
                @endforeach
            </tbody>
        </table>
        <div class="pagination">{{ $sales->links() }}</div>
    </div>
    <div class="card">
        <div class="card-header"><h3>Quick Actions</h3></div>
        <div class="card-body">
            <ul class="quick-actions">
                <li><a href="#" onclick="openModal('addSaleModal');return false">New Sales Transaction</a><p>Record a new sale</p></li>
                <li><a href="{{ route('reports.index') }}">Sales Report</a><p>View sales analytics</p></li>
                <li><a href="#">Manage Customers</a><p>Add or edit customers</p></li>
            </ul>
        </div>
    </div>
</div>

<div class="grid-3">
    <div class="card"><div class="card-header"><h3>Sales Trend (This Month)</h3></div><div class="card-body"><div class="chart-container-sm"><canvas id="salesTrendChart"></canvas></div></div></div>
    <div class="card"><div class="card-header"><h3>Sales by Product</h3></div><div class="card-body"><div class="chart-container-sm"><canvas id="productChart"></canvas></div></div></div>
    <div class="card"><div class="card-header"><h3>Payment Status</h3></div><div class="card-body"><div class="chart-container-sm"><canvas id="paymentChart"></canvas></div></div></div>
</div>

<div class="grid-2">
    <div class="card">
        <div class="card-header"><h3>Sales Summary (This Month)</h3></div>
        <div class="card-body">
            <ul class="activity-list">
                <li><div class="activity-dot"></div><div><strong>Total Eggs Sold</strong><div class="activity-time">{{ number_format($salesSummary['total_sold']) }} trays</div></div></li>
                <li><div class="activity-dot"></div><div><strong>Avg Selling Price</strong><div class="activity-time">₱{{ number_format($salesSummary['avg_price'], 2) }} / tray</div></div></li>
                <li><div class="activity-dot"></div><div><strong>Total Transactions</strong><div class="activity-time">{{ $salesSummary['total_transactions'] }}</div></div></li>
                <li><div class="activity-dot"></div><div><strong>New Customers</strong><div class="activity-time">{{ $salesSummary['new_customers'] }}</div></div></li>
            </ul>
        </div>
    </div>
    <div class="card">
        <div class="card-header"><h3>Recent Sales</h3></div>
        <div class="card-body">
            <ul class="txn-list">
                @foreach($recentSales as $s)
                <li>
                    <div><strong>{{ $s->invoice_no }}</strong> · {{ $s->customer->name }}<div style="font-size:12px;color:#6c757d">{{ $s->sale_date->format('M d, Y') }}</div></div>
                    <div>₱{{ number_format($s->amount, 2) }} <span class="status-badge status-{{ $s->status }}" style="font-size:10px">{{ ucfirst($s->status) }}</span></div>
                </li>
                @endforeach
            </ul>
        </div>
    </div>
</div>

<div class="modal-overlay" id="addSaleModal">
    <div class="modal">
        <div class="modal-header"><h3>New Sale</h3><button onclick="closeModal('addSaleModal')" class="action-btn"><i class="bi bi-x-lg"></i></button></div>
        <form method="POST" action="{{ route('sales.store') }}">@csrf
            <div class="modal-body">
                <div class="form-group"><label>Invoice No.</label><input name="invoice_no" class="form-control" required></div>
                <div class="form-group"><label>Customer</label><select name="customer_id" class="form-control" required>@foreach($customers as $c)<option value="{{ $c->id }}">{{ $c->name }}</option>@endforeach</select></div>
                <div class="form-group"><label>Product</label><select name="product_id" class="form-control" required>@foreach($products as $p)<option value="{{ $p->id }}">{{ $p->name }} - ₱{{ $p->unit_price }}</option>@endforeach</select></div>
                <div class="form-group"><label>Quantity</label><input name="quantity" type="number" class="form-control" required></div>
                <div class="form-group"><label>Unit Price</label><input name="unit_price" type="number" step="0.01" class="form-control" required></div>
                <div class="form-group"><label>Payment Method</label><select name="payment_method" class="form-control"><option value="cash">Cash</option><option value="credit">Credit</option></select></div>
                <div class="form-group"><label>Status</label><select name="status" class="form-control"><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select></div>
                <div class="form-group"><label>Sale Date</label><input name="sale_date" type="date" class="form-control" value="{{ date('Y-m-d') }}" required></div>
            </div>
            <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="closeModal('addSaleModal')">Cancel</button><button type="submit" class="btn btn-success">Record Sale</button></div>
        </form>
    </div>
</div>
@endsection

@push('scripts')
<script>
new Chart(document.getElementById('salesTrendChart'), { type:'line', data:{ labels:{!! json_encode($salesTrend->pluck('sale_date')->map(fn($d)=>\Carbon\Carbon::parse($d)->format('M d'))) !!}, datasets:[{ data:{!! json_encode($salesTrend->pluck('total')) !!}, borderColor:'#2d6a4f', fill:true, backgroundColor:'rgba(45,106,79,0.1)', tension:0.4 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }});
new Chart(document.getElementById('productChart'), { type:'doughnut', data:{ labels:{!! json_encode($salesByProduct->pluck('name')) !!}, datasets:[{ data:{!! json_encode($salesByProduct->pluck('total')) !!}, backgroundColor:['#2d6a4f','#40916c','#52b788'] }] }, options:{ responsive:true, maintainAspectRatio:false }});
new Chart(document.getElementById('paymentChart'), { type:'doughnut', data:{ labels:{!! json_encode($paymentStatus->pluck('status')->map(fn($s)=>ucfirst($s))) !!}, datasets:[{ data:{!! json_encode($paymentStatus->pluck('count')) !!}, backgroundColor:['#2d6a4f','#fd7e14'] }] }, options:{ responsive:true, maintainAspectRatio:false }});
</script>
@endpush
