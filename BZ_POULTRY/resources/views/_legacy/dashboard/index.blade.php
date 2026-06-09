@extends('layouts.app')
@section('title', 'Dashboard')
@section('page-title', 'Dashboard')
@section('page-description', 'Overview of your farm operations')

@section('content')
<div class="stat-cards">
    <div class="stat-card">
        <div class="label">Total Poultry</div>
        <div class="value">{{ number_format($totalPoultry) }}</div>
    </div>
    <div class="stat-card">
        <div class="label">Eggs Today</div>
        <div class="value">{{ number_format($eggsToday) }} <span style="font-size:14px;font-weight:400">pcs</span></div>
    </div>
    <div class="stat-card">
        <div class="label">Feed in Stock</div>
        <div class="value">{{ number_format($feedStock) }} <span style="font-size:14px;font-weight:400">kg</span></div>
        @if($feedLow > 0)<div class="badge-alert">Low Stock</div>@endif
    </div>
    <div class="stat-card">
        <div class="label">Medicine in Stock</div>
        <div class="value">{{ number_format($medicineStock) }} <span style="font-size:14px;font-weight:400">items</span></div>
        @if($medicineLow > 0)<div class="badge-alert">Low Stock</div>@endif
    </div>
    <div class="stat-card">
        <div class="label">Sales Today</div>
        <div class="value">₱{{ number_format($salesToday, 2) }}</div>
    </div>
</div>

<div class="grid-3">
    <div class="card">
        <div class="card-header"><h3>Egg Production (This Week)</h3></div>
        <div class="card-body"><div class="chart-container"><canvas id="weeklyChart"></canvas></div></div>
    </div>
    <div class="card">
        <div class="card-header"><h3>Inventory Status</h3></div>
        <div class="card-body"><div class="chart-container"><canvas id="inventoryChart"></canvas></div></div>
    </div>
    <div class="card">
        <div class="card-header"><h3>Stock Alerts</h3></div>
        <div class="card-body">
            <ul class="alert-list">
                @forelse($lowStockAlerts as $alert)
                <li>
                    <i class="bi bi-exclamation-triangle alert-icon"></i>
                    <div>
                        <strong>{{ $alert['name'] }}</strong>
                        <div style="font-size:12px;color:#6c757d">{{ $alert['category'] }} · {{ $alert['days_left'] }} Days Left</div>
                    </div>
                </li>
                @empty
                <li style="color:#6c757d">No low stock alerts</li>
                @endforelse
            </ul>
        </div>
    </div>
</div>

<div class="grid-3">
    <div class="card">
        <div class="card-header"><h3>Recent Inventory Transactions</h3></div>
        <div class="card-body" style="padding:0">
            <table class="data-table">
                <thead><tr><th>Date</th><th>Type</th><th>Item</th><th>Qty</th></tr></thead>
                <tbody>
                    @foreach($recentTransactions as $txn)
                    <tr>
                        <td>{{ $txn->created_at->format('M d') }}</td>
                        <td><span class="txn-type-{{ $txn->type }}">{{ ucfirst($txn->type) }}</span></td>
                        <td>{{ $txn->item_name }}</td>
                        <td>{{ $txn->quantity }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
    <div class="card">
        <div class="card-header"><h3>Egg Production Summary</h3></div>
        <div class="card-body">
            <ul class="activity-list">
                <li><div class="activity-dot"></div><div><strong>Today</strong><div class="activity-time">{{ number_format($eggSummary['today']) }} eggs</div></div></li>
                <li><div class="activity-dot"></div><div><strong>This Week</strong><div class="activity-time">{{ number_format($eggSummary['week']) }} eggs</div></div></li>
                <li><div class="activity-dot"></div><div><strong>This Month</strong><div class="activity-time">{{ number_format($eggSummary['month']) }} eggs</div></div></li>
                <li><div class="activity-dot"></div><div><strong>Daily Average</strong><div class="activity-time">{{ number_format($eggSummary['daily_avg']) }} eggs</div></div></li>
            </ul>
        </div>
    </div>
    <div class="card">
        <div class="card-header"><h3>Recent Activities</h3></div>
        <div class="card-body">
            <ul class="activity-list">
                @foreach($recentActivities as $activity)
                <li>
                    <div class="activity-dot"></div>
                    <div>
                        {{ $activity->description }}
                        <div class="activity-time">{{ $activity->created_at->diffForHumans() }}</div>
                    </div>
                </li>
                @endforeach
            </ul>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
new Chart(document.getElementById('weeklyChart'), {
    type: 'line',
    data: {
        labels: {!! json_encode($weeklyProduction->pluck('prod_date')->map(fn($d) => \Carbon\Carbon::parse($d)->format('D'))) !!},
        datasets: [{ label: 'Eggs', data: {!! json_encode($weeklyProduction->pluck('total')) !!}, borderColor: '#2d6a4f', backgroundColor: 'rgba(45,106,79,0.1)', fill: true, tension: 0.4 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
});
new Chart(document.getElementById('inventoryChart'), {
    type: 'doughnut',
    data: {
        labels: ['Feed', 'Medicine', 'Supplies', 'Others'],
        datasets: [{ data: {!! json_encode(array_values($inventoryBreakdown)) !!}, backgroundColor: ['#2d6a4f','#40916c','#52b788','#95d5b2'] }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});
</script>
@endpush
