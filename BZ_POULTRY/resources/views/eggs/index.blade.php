@extends('layouts.app')
@section('title', 'Egg Production')
@section('page-title', 'Egg Production')
@section('page-description', 'Track daily egg output and quality')

@section('content')
<div class="stat-cards">
    <div class="stat-card"><div class="label">Eggs Collected Today</div><div class="value">{{ number_format($eggsToday) }}</div></div>
    <div class="stat-card"><div class="label">Good Eggs Today</div><div class="value">{{ number_format($goodToday) }}</div></div>
    <div class="stat-card"><div class="label">Cracked / Broken</div><div class="value">{{ number_format($crackedToday) }}</div></div>
    <div class="stat-card"><div class="label">This Week</div><div class="value">{{ number_format($weekTotal) }}</div></div>
    <div class="stat-card"><div class="label">This Month</div><div class="value">{{ number_format($monthTotal) }}</div></div>
</div>

<div class="card">
    <div class="table-toolbar">
        <button class="btn btn-success" onclick="openModal('addEggModal')"><i class="bi bi-plus-lg"></i> Add Production Record</button>
    </div>
    <table class="data-table">
        <thead><tr><th>Date</th><th>Building</th><th>Total Eggs</th><th>Good Eggs</th><th>Cracked Eggs</th><th>Cracked %</th><th>Action</th></tr></thead>
        <tbody>
            @foreach($records as $record)
            <tr>
                <td>{{ $record->date->format('M d, Y') }}</td>
                <td>{{ $record->building->name }}</td>
                <td>{{ number_format($record->total_eggs) }}</td>
                <td>{{ number_format($record->good_eggs) }}</td>
                <td>{{ number_format($record->cracked_eggs) }}</td>
                <td>{{ $record->cracked_percent }}%</td>
                <td><form action="{{ route('eggs.destroy', $record) }}" method="POST" onsubmit="return confirm('Delete?')">@csrf @method('DELETE')<button class="action-btn delete" type="submit"><i class="bi bi-trash"></i></button></form></td>
            </tr>
            @endforeach
        </tbody>
    </table>
    <div class="pagination">{{ $records->links() }}</div>
</div>

<div class="grid-2">
    <div class="card"><div class="card-header"><h3>Daily Egg Production Trend</h3></div><div class="card-body"><div class="chart-container"><canvas id="trendChart"></canvas></div></div></div>
    <div class="card"><div class="card-header"><h3>Egg Quality Rate</h3></div><div class="card-body"><div class="chart-container"><canvas id="qualityChart"></canvas></div></div></div>
</div>

<div class="grid-2">
    <div class="card"><div class="card-header"><h3>Production by House</h3></div><div class="card-body"><div class="chart-container"><canvas id="houseChart"></canvas></div></div></div>
    <div class="card">
        <div class="card-header"><h3>Recent Production Activities</h3></div>
        <div class="card-body">
            <ul class="activity-list">
                @foreach($recentActivities as $a)
                <li><div class="activity-dot"></div><div>{{ $a->description }}<div class="activity-time">{{ $a->created_at->diffForHumans() }}</div></div></li>
                @endforeach
            </ul>
        </div>
    </div>
</div>

<div class="modal-overlay" id="addEggModal">
    <div class="modal">
        <div class="modal-header"><h3>Add Production Record</h3><button onclick="closeModal('addEggModal')" class="action-btn"><i class="bi bi-x-lg"></i></button></div>
        <form method="POST" action="{{ route('eggs.store') }}">@csrf
            <div class="modal-body">
                <div class="form-group"><label>Date</label><input name="date" type="date" class="form-control" value="{{ date('Y-m-d') }}" required></div>
                <div class="form-group"><label>Building</label><select name="building_id" class="form-control" required>@foreach($buildings as $b)<option value="{{ $b->id }}">{{ $b->name }}</option>@endforeach</select></div>
                <div class="form-group"><label>Total Eggs</label><input name="total_eggs" type="number" class="form-control" required></div>
                <div class="form-group"><label>Good Eggs</label><input name="good_eggs" type="number" class="form-control" required></div>
                <div class="form-group"><label>Cracked Eggs</label><input name="cracked_eggs" type="number" class="form-control" required></div>
            </div>
            <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="closeModal('addEggModal')">Cancel</button><button type="submit" class="btn btn-success">Add Record</button></div>
        </form>
    </div>
</div>
@endsection

@push('scripts')
<script>
new Chart(document.getElementById('trendChart'), { type:'line', data:{ labels:{!! json_encode($dailyTrend->pluck('date')->map(fn($d)=>\Carbon\Carbon::parse($d)->format('M d'))) !!}, datasets:[{label:'Good',data:{!! json_encode($dailyTrend->pluck('good')) !!},borderColor:'#2d6a4f',fill:true,backgroundColor:'rgba(45,106,79,0.1)',tension:0.4},{label:'Cracked',data:{!! json_encode($dailyTrend->pluck('cracked')) !!},borderColor:'#dc3545',fill:true,backgroundColor:'rgba(220,53,69,0.1)',tension:0.4}] }, options:{responsive:true,maintainAspectRatio:false}});
new Chart(document.getElementById('qualityChart'), { type:'doughnut', data:{ labels:['Good','Cracked'], datasets:[{ data:[{{ $qualityRate['good'] }},{{ $qualityRate['cracked'] }}], backgroundColor:['#2d6a4f','#dc3545'] }] }, options:{responsive:true,maintainAspectRatio:false}});
new Chart(document.getElementById('houseChart'), { type:'bar', data:{ labels:{!! json_encode($byBuilding->pluck('name')) !!}, datasets:[{ data:{!! json_encode($byBuilding->pluck('total')) !!}, backgroundColor:'#2d6a4f' }] }, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}}});
</script>
@endpush
