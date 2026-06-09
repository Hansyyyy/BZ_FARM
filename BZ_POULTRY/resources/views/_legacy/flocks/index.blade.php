@extends('layouts.app')
@section('title', 'Poultry Stock')
@section('page-title', 'Poultry Stock')
@section('page-description', 'Manage your poultry chickens and batches')

@section('content')
<div class="stat-cards">
    <div class="stat-card"><div class="label">Total Chicken</div><div class="value">{{ $totalFlocks }}</div><div class="sub">Active Chickens</div></div>
    <div class="stat-card"><div class="label">Total Poultry</div><div class="value">{{ number_format($totalPoultry) }}</div><div class="sub">Chickens in Stock</div></div>
    <div class="stat-card"><div class="label">Layers</div><div class="value">{{ number_format($layers) }}</div><div class="sub">{{ $totalPoultry > 0 ? round($layers/$totalPoultry*100,1) : 0 }}% of total</div></div>
    <div class="stat-card"><div class="label">Pullets</div><div class="value">{{ number_format($pullets) }}</div><div class="sub">{{ $totalPoultry > 0 ? round($pullets/$totalPoultry*100,1) : 0 }}% of total</div></div>
    <div class="stat-card"><div class="label">Roosters</div><div class="value">{{ number_format($roosters) }}</div><div class="sub">{{ $totalPoultry > 0 ? round($roosters/$totalPoultry*100,1) : 0 }}% of total</div></div>
</div>

<div class="card">
    <div class="table-toolbar">
        <div class="search-box"><i class="bi bi-search"></i><input type="text" placeholder="Search chickens..."></div>
        <div>
            <button class="btn btn-outline" onclick="openExportModal('Chickens','{{ route('flocks.index') }}')"><i class="bi bi-printer"></i> Export</button>
            <button class="btn btn-success" onclick="openModal('addFlockModal')"><i class="bi bi-plus-lg"></i> Add New Chicken</button>
        </div>
    </div>
    <table class="data-table">
        <thead>
            <tr><th>Batch No.</th><th>Type</th><th>Breed</th><th>Quantity</th><th>Age (Weeks)</th><th>Date In</th><th>Mortality</th><th>Mortality Rate</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
            @foreach($flocks as $flock)
            <tr>
                <td><strong>{{ $flock->batch_no }}</strong></td>
                <td>{{ ucfirst($flock->type) }}</td>
                <td>{{ $flock->breed }}</td>
                <td>{{ number_format($flock->quantity) }}</td>
                <td>{{ $flock->age_weeks }}</td>
                <td>{{ $flock->date_in->format('M d, Y') }}</td>
                <td>{{ $flock->mortality }}</td>
                <td>{{ $flock->mortality_rate }}%</td>
                <td><span class="status-badge status-{{ $flock->status }}">{{ ucfirst($flock->status) }}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn edit" title="Edit" data-action="{{ route('flocks.update', $flock) }}" data-batch="{{ $flock->batch_no }}" data-type="{{ $flock->type }}" data-breed="{{ $flock->breed }}" data-quantity="{{ $flock->quantity }}" data-age="{{ $flock->age_weeks }}" data-date_in="{{ $flock->date_in->format('Y-m-d') }}" onclick="handleOpenEdit(this)"><i class="bi bi-pencil"></i></button>
                        <button class="action-btn delete" title="Delete" onclick="confirmDelete('{{ route('flocks.destroy', $flock) }}', 'Delete chicken {{ $flock->batch_no }}?')"><i class="bi bi-trash"></i></button>
                    </div>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    <div class="pagination">{{ $flocks->links() }}</div>
</div>

<div class="grid-2">
    <div class="card">
        <div class="card-header"><h3>Chicken Distribution by Type</h3></div>
        <div class="card-body"><div class="chart-container"><canvas id="distChart"></canvas></div></div>
    </div>
    <div class="card">
        <div class="card-header"><h3>Recent Activities</h3></div>
        <div class="card-body">
            <ul class="activity-list">
                @foreach($recentActivities as $a)
                <li><div class="activity-dot"></div><div>{{ $a->description }}<div class="activity-time">{{ $a->created_at->diffForHumans() }}</div></div></li>
                @endforeach
            </ul>
        </div>
    </div>
</div>

<div class="modal-overlay" id="addFlockModal">
    <div class="modal">
        <div class="modal-header"><h3>Add New Chicken</h3><button onclick="closeModal('addFlockModal')" class="action-btn"><i class="bi bi-x-lg"></i></button></div>
        <form method="POST" action="{{ route('flocks.store') }}">
            @csrf
            <div class="modal-body">
                <div class="form-group"><label>Batch No.</label><input name="batch_no" class="form-control" required></div>
                <div class="form-group"><label>Type</label><select name="type" class="form-control" required><option value="layers">Layers</option><option value="pullets">Pullets</option><option value="roosters">Roosters</option></select></div>
                <div class="form-group"><label>Breed</label><input name="breed" class="form-control" required></div>
                <div class="form-group"><label>Quantity</label><input name="quantity" type="number" class="form-control" required></div>
                <div class="form-group"><label>Age (Weeks)</label><input name="age_weeks" type="number" class="form-control" required></div>
                <div class="form-group"><label>Date In</label><input name="date_in" type="date" class="form-control" required></div>
            </div>
            <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="closeModal('addFlockModal')">Cancel</button><button type="submit" class="btn btn-success">Add Chicken</button></div>
        </form>
    </div>
</div>
@endsection

@push('scripts')
<script>
new Chart(document.getElementById('distChart'), {
    type: 'doughnut',
    data: { labels: ['Layers','Pullets','Roosters'], datasets: [{ data: [{{ $distribution['layers'] }},{{ $distribution['pullets'] }},{{ $distribution['roosters'] }}], backgroundColor: ['#2d6a4f','#52b788','#95d5b2'] }] },
    options: { responsive: true, maintainAspectRatio: false }
});
</script>
<script>
function handleOpenEdit(btn){
    const d = btn.dataset;
    const content = `
        <div class="form-group"><label>Batch No.</label><input name="batch_no" value="${d.batch}" class="form-control" required></div>
        <div class="form-group"><label>Type</label><select name="type" class="form-control" required><option value="layers" ${d.type==='layers' ? 'selected' : ''}>Layers</option><option value="pullets" ${d.type==='pullets' ? 'selected' : ''}>Pullets</option><option value="roosters" ${d.type==='roosters' ? 'selected' : ''}>Roosters</option></select></div>
        <div class="form-group"><label>Breed</label><input name="breed" value="${d.breed}" class="form-control" required></div>
        <div class="form-group"><label>Quantity</label><input name="quantity" type="number" value="${d.quantity}" class="form-control" required></div>
        <div class="form-group"><label>Age (Weeks)</label><input name="age_weeks" type="number" value="${d.age}" class="form-control" required></div>
        <div class="form-group"><label>Date In</label><input name="date_in" type="date" value="${d.date_in}" class="form-control" required></div>
        <input type="hidden" name="_method" value="PUT" />
    `;
    openEditModal(content, btn.dataset.action);
}
</script>
@endpush
