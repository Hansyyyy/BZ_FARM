@extends('layouts.app')
@section('title', 'Medicine & Vaccine')
@section('page-title', 'Medicine & Vaccine')
@section('page-description', 'Track medical supplies and usage')

@section('content')
<div class="stat-cards">
    <div class="stat-card"><div class="label">Total Items</div><div class="value">{{ $totalItems }}</div><div class="sub">All Inventory Items</div></div>
    <div class="stat-card"><div class="label">Total Stock Value</div><div class="value">₱{{ number_format($totalValue, 2) }}</div><div class="sub">Current Stock Value</div></div>
    <div class="stat-card"><div class="label">Low Stock Items</div><div class="value">{{ $lowStock }}</div><div class="sub">Need Reorder</div></div>
    <div class="stat-card"><div class="label">Expiring Soon</div><div class="value">{{ $expiringSoon }}</div><div class="sub">Within 30 Days</div></div>
    <div class="stat-card"><div class="label">Items Used</div><div class="value">{{ number_format($usedThisMonth) }}</div><div class="sub">This Month</div></div>
</div>

<div class="card">
    <div class="table-toolbar">
        <div class="search-box"><i class="bi bi-search"></i><input type="text" placeholder="Search items..."></div>
        <button class="btn btn-success" onclick="openModal('addMedModal')"><i class="bi bi-plus-lg"></i> Add New</button>
    </div>
    <table class="data-table">
        <thead><tr><th>Item Name</th><th>Category</th><th>Type</th><th>Stock</th><th>Reorder Level</th><th>Expiry Date</th><th>Last Stock In</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
            @foreach($items as $item)
            <tr>
                <td><strong>{{ $item->name }}</strong></td>
                <td>{{ $item->category }}</td>
                <td>{{ $item->type ?? 'N/A' }}</td>
                <td>{{ number_format($item->stock) }} {{ $item->unit }}</td>
                <td>{{ number_format($item->reorder_level) }}</td>
                <td>{{ $item->expiry_date?->format('M d, Y') ?? 'N/A' }}</td>
                <td>{{ $item->last_stock_in?->format('M d, Y') ?? 'N/A' }}</td>
                <td><span class="status-badge status-{{ $item->status }}">{{ str_replace('_',' ',ucfirst($item->status)) }}</span></td>
                <td><form action="{{ route('medicine.destroy', $item) }}" method="POST" onsubmit="return confirm('Delete?')">@csrf @method('DELETE')<button class="action-btn delete" type="submit"><i class="bi bi-trash"></i></button></form></td>
            </tr>
            @endforeach
        </tbody>
    </table>
    <div class="pagination">{{ $items->links() }}</div>
</div>

<div class="grid-3">
    <div class="card"><div class="card-header"><h3>Recent Stock Transactions</h3></div><div class="card-body"><ul class="txn-list">@foreach($recentTransactions as $t)<li><div><span class="txn-type-{{ $t->type }}">Stock {{ ucfirst($t->type) }}</span> · {{ $t->item_name }}</div><div>{{ $t->quantity }}</div></li>@endforeach</ul></div></div>
    <div class="card"><div class="card-header"><h3>Expiring Soon (30 Days)</h3></div><div class="card-body"><ul class="alert-list">@foreach($expiringItems as $e)<li><i class="bi bi-exclamation-circle" style="color:#fd7e14"></i><div><strong>{{ $e->name }}</strong><div style="font-size:12px;color:#6c757d">Expires {{ $e->expiry_date->format('M d, Y') }}</div></div></li>@endforeach</ul></div></div>
    <div class="card"><div class="card-header"><h3>Low Stock Alerts</h3></div><div class="card-body"><ul class="alert-list">@foreach($lowStockAlerts as $a)<li><i class="bi bi-exclamation-triangle alert-icon"></i><div><strong>{{ $a->name }}</strong><div style="font-size:12px;color:#6c757d">{{ $a->stock }} remaining</div></div></li>@endforeach</ul></div></div>
</div>

<div class="grid-2">
    <div class="card"><div class="card-header"><h3>Medicine & Vaccine Usage (This Month)</h3></div><div class="card-body"><div class="chart-container"><canvas id="usageChart"></canvas></div></div></div>
    <div class="card" style="display:flex;align-items:center;justify-content:center;background:#2d6a4f;color:white">
        <div style="text-align:center;padding:40px">
            <div style="font-size:48px;font-weight:700">{{ number_format($usedThisMonth) }}</div>
            <div style="font-size:16px;margin-top:8px">Total Items Used This Month</div>
        </div>
    </div>
</div>

<div class="modal-overlay" id="addMedModal">
    <div class="modal">
        <div class="modal-header"><h3>Add Medicine Item</h3><button onclick="closeModal('addMedModal')" class="action-btn"><i class="bi bi-x-lg"></i></button></div>
        <form method="POST" action="{{ route('medicine.store') }}">@csrf
            <div class="modal-body">
                <div class="form-group"><label>Name</label><input name="name" class="form-control" required></div>
                <div class="form-group"><label>Category</label><select name="category" class="form-control"><option>Medicine</option><option>Vaccine</option></select></div>
                <div class="form-group"><label>Type</label><input name="type" class="form-control" placeholder="Vitamin, Supplement, etc."></div>
                <div class="form-group"><label>Stock</label><input name="stock" type="number" step="0.01" class="form-control" required></div>
                <div class="form-group"><label>Reorder Level</label><input name="reorder_level" type="number" step="0.01" class="form-control" required></div>
                <div class="form-group"><label>Expiry Date</label><input name="expiry_date" type="date" class="form-control"></div>
                <div class="form-group"><label>Unit Price</label><input name="unit_price" type="number" step="0.01" class="form-control" required></div>
            </div>
            <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="closeModal('addMedModal')">Cancel</button><button type="submit" class="btn btn-success">Add</button></div>
        </form>
    </div>
</div>
@endsection

@push('scripts')
<script>
new Chart(document.getElementById('usageChart'), { type:'bar', data:{ labels:{!! json_encode($monthlyUsage->pluck('day')->map(fn($d)=>\Carbon\Carbon::parse($d)->format('M d'))) !!}, datasets:[{ data:{!! json_encode($monthlyUsage->pluck('total')) !!}, backgroundColor:'#2d6a4f' }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }});
</script>
@endpush
