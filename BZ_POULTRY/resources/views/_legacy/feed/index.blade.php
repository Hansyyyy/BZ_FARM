@extends('layouts.app')
@section('title', 'Feed Inventory')
@section('page-title', 'Feed Inventory')
@section('page-description', 'Track feed stock and consumption')

@section('content')
<div class="stat-cards">
    <div class="stat-card"><div class="label">Total Feed Items</div><div class="value">{{ $totalItems }}</div><div class="sub">Active Items</div></div>
    <div class="stat-card"><div class="label">Total Stock</div><div class="value">{{ number_format($totalStock) }} kg</div><div class="sub">All Feed in Stock</div></div>
    <div class="stat-card"><div class="label">Low Stock Items</div><div class="value">{{ $lowStock }}</div><div class="sub">Need Reorder</div></div>
    <div class="stat-card"><div class="label">Feed Consumed</div><div class="value">{{ number_format($consumed) }} kg</div><div class="sub">This Month</div></div>
    <div class="stat-card"><div class="label">Feed Cost</div><div class="value">₱{{ number_format($feedCost, 2) }}</div><div class="sub">This Month</div></div>
</div>

<div class="card">
    <div class="table-toolbar">
        <div class="search-box"><i class="bi bi-search"></i><input type="text" placeholder="Search feed..."></div>
        <button class="btn btn-success" onclick="openModal('addFeedModal')"><i class="bi bi-plus-lg"></i> Add New</button>
    </div>
    <table class="data-table">
        <thead><tr><th>Feed Name</th><th>Category</th><th>Stock (kg)</th><th>Reorder Level</th><th>Expiry Date</th><th>Last Stock In</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
            @foreach($feeds as $feed)
            <tr>
                <td><strong>{{ $feed->name }}</strong></td>
                <td>{{ $feed->category }}</td>
                <td>{{ number_format($feed->stock) }}</td>
                <td>{{ number_format($feed->reorder_level) }}</td>
                <td>{{ $feed->expiry_date?->format('M d, Y') ?? 'N/A' }}</td>
                <td>{{ $feed->last_stock_in?->format('M d, Y') ?? 'N/A' }}</td>
                <td><span class="status-badge status-{{ $feed->status }}">{{ str_replace('_',' ',ucfirst($feed->status)) }}</span></td>
                <td>
                    <form action="{{ route('feed.destroy', $feed) }}" method="POST" onsubmit="return confirm('Delete?')">@csrf @method('DELETE')<button class="action-btn delete" type="submit"><i class="bi bi-trash"></i></button></form>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    <div class="pagination">{{ $feeds->links() }}</div>
</div>

<div class="grid-3">
    <div class="card"><div class="card-header"><h3>Feed Stock Levels</h3></div><div class="card-body"><div class="chart-container"><canvas id="stockChart"></canvas></div></div></div>
    <div class="card"><div class="card-header"><h3>Recent Stock Transactions</h3></div><div class="card-body"><ul class="txn-list">@foreach($recentTransactions as $t)<li><div><span class="txn-type-{{ $t->type }}">Stock {{ ucfirst($t->type) }}</span> · {{ $t->item_name }}</div><div>{{ $t->quantity }} kg</div></li>@endforeach</ul></div></div>
    <div class="card"><div class="card-header"><h3>Low Stock Alerts</h3></div><div class="card-body"><ul class="alert-list">@foreach($lowStockAlerts as $a)<li><i class="bi bi-exclamation-triangle alert-icon"></i><div><strong>{{ $a->name }}</strong><div style="font-size:12px;color:#6c757d">{{ $a->stock }} kg remaining</div></div></li>@endforeach</ul></div></div>
</div>

<div class="grid-2">
    <div class="card"><div class="card-header"><h3>Feed Consumption (This Month)</h3></div><div class="card-body"><div class="chart-container"><canvas id="consumptionChart"></canvas></div></div></div>
    <div class="card"><div class="card-header"><h3>Feed Summary (This Month)</h3></div><div class="card-body"><div class="summary-boxes"><div class="summary-box green"><div class="num">{{ number_format($consumed) }}</div><div class="lbl">Total Used (kg)</div></div><div class="summary-box blue"><div class="num">₱{{ number_format($feedCost) }}</div><div class="lbl">Total Cost</div></div><div class="summary-box orange"><div class="num">₱{{ $consumed > 0 ? number_format($feedCost/$consumed,2) : '0' }}</div><div class="lbl">Cost per kg</div></div><div class="summary-box purple"><div class="num">{{ $totalStock > 0 && $consumed > 0 ? round($totalStock/($consumed/30)) : 0 }}</div><div class="lbl">Days Covered</div></div></div></div></div>
</div>

<div class="modal-overlay" id="addFeedModal">
    <div class="modal">
        <div class="modal-header"><h3>Add Feed Item</h3><button onclick="closeModal('addFeedModal')" class="action-btn"><i class="bi bi-x-lg"></i></button></div>
        <form method="POST" action="{{ route('feed.store') }}">@csrf
            <div class="modal-body">
                <div class="form-group"><label>Name</label><input name="name" class="form-control" required></div>
                <div class="form-group"><label>Category</label><select name="category" class="form-control"><option>Layers</option><option>Pellets</option><option>Boosters</option><option>Chick Starter</option></select></div>
                <div class="form-group"><label>Stock (kg)</label><input name="stock" type="number" step="0.01" class="form-control" required></div>
                <div class="form-group"><label>Reorder Level</label><input name="reorder_level" type="number" step="0.01" class="form-control" required></div>
                <div class="form-group"><label>Expiry Date</label><input name="expiry_date" type="date" class="form-control"></div>
                <div class="form-group"><label>Cost per kg</label><input name="cost_per_kg" type="number" step="0.01" class="form-control" required></div>
            </div>
            <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="closeModal('addFeedModal')">Cancel</button><button type="submit" class="btn btn-success">Add</button></div>
        </form>
    </div>
</div>
@endsection

@push('scripts')
<script>
new Chart(document.getElementById('stockChart'), { type:'doughnut', data:{ labels:{!! json_encode($stockLevels->pluck('category')) !!}, datasets:[{ data:{!! json_encode($stockLevels->pluck('total')) !!}, backgroundColor:['#2d6a4f','#40916c','#52b788','#95d5b2'] }] }, options:{ responsive:true, maintainAspectRatio:false }});
new Chart(document.getElementById('consumptionChart'), { type:'line', data:{ labels:{!! json_encode($monthlyConsumption->pluck('day')->map(fn($d)=>\Carbon\Carbon::parse($d)->format('M d'))) !!}, datasets:[{ data:{!! json_encode($monthlyConsumption->pluck('total')) !!}, borderColor:'#2d6a4f', fill:true, backgroundColor:'rgba(45,106,79,0.1)', tension:0.4 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }});
</script>
@endpush
