@extends('layouts.app')
@section('title', 'Inventory')
@section('page-title', 'Inventory')
@section('page-description', 'Manage supplies and equipment')

@section('content')
<div class="stat-cards">
    <div class="stat-card"><div class="label">Total Items</div><div class="value">{{ $totalItems }}</div><div class="sub">All Items</div></div>
    <div class="stat-card"><div class="label">Total Stock Value</div><div class="value">₱{{ number_format($totalValue, 2) }}</div></div>
    <div class="stat-card"><div class="label">Low Stock Items</div><div class="value">{{ $lowStock }}</div><div class="sub">Need Reorder</div></div>
    <div class="stat-card"><div class="label">Items In</div><div class="value">{{ number_format($stockIn) }}</div><div class="sub">This Month</div></div>
    <div class="stat-card"><div class="label">Items Out</div><div class="value">{{ number_format($stockOut) }}</div><div class="sub">This Month</div></div>
</div>

<div class="card">
    <div class="table-toolbar">
        <div class="search-box"><i class="bi bi-search"></i><input type="text" placeholder="Search inventory..."></div>
        <button class="btn btn-success" onclick="openModal('addInvModal')"><i class="bi bi-plus-lg"></i> Add Item</button>
    </div>
    <table class="data-table">
        <thead><tr><th>Item Code</th><th>Item Name</th><th>Category</th><th>Stock</th><th>Unit</th><th>Reorder Level</th><th>Location</th><th>Last Updated</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
            @foreach($items as $item)
            <tr>
                <td><strong>{{ $item->item_code }}</strong></td>
                <td>{{ $item->name }}</td>
                <td>{{ $item->category }}</td>
                <td>{{ number_format($item->stock) }}</td>
                <td>{{ $item->unit }}</td>
                <td>{{ number_format($item->reorder_level) }}</td>
                <td>{{ $item->location ?? 'N/A' }}</td>
                <td>{{ $item->last_updated?->format('M d, Y') ?? 'N/A' }}</td>
                <td><span class="status-badge status-{{ $item->status }}">{{ str_replace('_',' ',ucfirst($item->status)) }}</span></td>
                <td><form action="{{ route('inventory.destroy', $item) }}" method="POST" onsubmit="return confirm('Delete?')">@csrf @method('DELETE')<button class="action-btn delete" type="submit"><i class="bi bi-trash"></i></button></form></td>
            </tr>
            @endforeach
        </tbody>
    </table>
    <div class="pagination">{{ $items->links() }}</div>
</div>

<div class="grid-3">
    <div class="card"><div class="card-header"><h3>Inventory by Category</h3></div><div class="card-body"><div class="chart-container"><canvas id="catChart"></canvas></div></div></div>
    <div class="card"><div class="card-header"><h3>Recent Stock Transactions</h3></div><div class="card-body"><ul class="txn-list">@foreach($recentTransactions as $t)<li><div><span class="txn-type-{{ $t->type }}">Stock {{ ucfirst($t->type) }}</span> · {{ $t->item_name }}</div><div>{{ $t->quantity }}</div></li>@endforeach</ul></div></div>
    <div class="card"><div class="card-header"><h3>Low Stock Alerts</h3></div><div class="card-body"><ul class="alert-list">@foreach($lowStockAlerts as $a)<li><i class="bi bi-exclamation-triangle alert-icon"></i><div><strong>{{ $a->name }}</strong><div style="font-size:12px;color:#6c757d">{{ $a->stock }} {{ $a->unit }} remaining</div></div></li>@endforeach</ul></div></div>
</div>

<div class="grid-2">
    <div class="card"><div class="card-header"><h3>Inventory Movement (This Month)</h3></div><div class="card-body"><div class="chart-container"><canvas id="movementChart"></canvas></div></div></div>
    <div class="card"><div class="card-header"><h3>Inventory Summary</h3></div><div class="card-body"><div class="summary-boxes"><div class="summary-box green"><div class="num">{{ number_format($stockIn) }}</div><div class="lbl">Stock In</div></div><div class="summary-box orange"><div class="num">{{ number_format($stockOut) }}</div><div class="lbl">Stock Out</div></div><div class="summary-box blue"><div class="num">{{ number_format($stockIn - $stockOut) }}</div><div class="lbl">Net Movement</div></div><div class="summary-box purple"><div class="num">₱{{ number_format($totalValue) }}</div><div class="lbl">Total Value</div></div></div></div></div>
</div>

<div class="modal-overlay" id="addInvModal">
    <div class="modal">
        <div class="modal-header"><h3>Add Inventory Item</h3><button onclick="closeModal('addInvModal')" class="action-btn"><i class="bi bi-x-lg"></i></button></div>
        <form method="POST" action="{{ route('inventory.store') }}">@csrf
            <div class="modal-body">
                <div class="form-group"><label>Item Code</label><input name="item_code" class="form-control" required></div>
                <div class="form-group"><label>Name</label><input name="name" class="form-control" required></div>
                <div class="form-group"><label>Category</label><select name="category" class="form-control"><option>Supplies</option><option>Equipment</option><option>Tools</option></select></div>
                <div class="form-group"><label>Stock</label><input name="stock" type="number" step="0.01" class="form-control" required></div>
                <div class="form-group"><label>Unit</label><input name="unit" class="form-control" value="pcs" required></div>
                <div class="form-group"><label>Reorder Level</label><input name="reorder_level" type="number" step="0.01" class="form-control" required></div>
                <div class="form-group"><label>Location</label><input name="location" class="form-control" placeholder="Warehouse 1"></div>
                <div class="form-group"><label>Unit Price</label><input name="unit_price" type="number" step="0.01" class="form-control" required></div>
            </div>
            <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="closeModal('addInvModal')">Cancel</button><button type="submit" class="btn btn-success">Add</button></div>
        </form>
    </div>
</div>
@endsection

@push('scripts')
<script>
new Chart(document.getElementById('catChart'), { type:'doughnut', data:{ labels:{!! json_encode($byCategory->pluck('category')) !!}, datasets:[{ data:{!! json_encode($byCategory->pluck('total')) !!}, backgroundColor:['#2d6a4f','#40916c','#52b788','#95d5b2'] }] }, options:{ responsive:true, maintainAspectRatio:false }});
new Chart(document.getElementById('movementChart'), { type:'bar', data:{ labels:['Stock In','Stock Out'], datasets:[{ data:[{{ $stockIn }},{{ $stockOut }}], backgroundColor:['#2d6a4f','#dc3545'] }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }});
</script>
@endpush
