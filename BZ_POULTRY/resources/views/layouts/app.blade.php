<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Dashboard') - BZ Farm</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="{{ asset('css/farm.css') }}">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
</head>
<body>
<div class="app-layout">
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
            <div class="logo-circle"><i class="bi bi-egg-fried"></i></div>
            <span>BZ FARM</span>
        </div>
        <ul class="nav-menu">
            <li><a href="{{ route('dashboard') }}" class="{{ request()->routeIs('dashboard') ? 'active' : '' }}"><i class="bi bi-grid-1x2"></i> Dashboard</a></li>
            <li><a href="{{ route('flocks.index') }}" class="{{ request()->routeIs('flocks.*') ? 'active' : '' }}"><i class="bi bi-egg-fried"></i> Poultry Stock</a></li>
            <li><a href="{{ route('feed.index') }}" class="{{ request()->routeIs('feed.*') ? 'active' : '' }}"><i class="bi bi-basket"></i> Feed Inventory</a></li>
            <li><a href="{{ route('medicine.index') }}" class="{{ request()->routeIs('medicine.*') ? 'active' : '' }}"><i class="bi bi-capsule"></i> Medicine & Vaccine</a></li>
            <li><a href="{{ route('inventory.index') }}" class="{{ request()->routeIs('inventory.*') ? 'active' : '' }}"><i class="bi bi-box-seam"></i> Inventory</a></li>
            <li><a href="{{ route('eggs.index') }}" class="{{ request()->routeIs('eggs.*') ? 'active' : '' }}"><i class="bi bi-graph-up"></i> Egg Production</a></li>
            <li><a href="{{ route('sales.index') }}" class="{{ request()->routeIs('sales.*') ? 'active' : '' }}"><i class="bi bi-cash-stack"></i> Sales Management</a></li>
            <li><a href="{{ route('reports.index') }}" class="{{ request()->routeIs('reports.*') ? 'active' : '' }}"><i class="bi bi-file-earmark-bar-graph"></i> Reports</a></li>
            @if(auth()->user()->isAdmin())
            <li><a href="{{ route('settings.index') }}" class="{{ request()->routeIs('settings.*') ? 'active' : '' }}"><i class="bi bi-gear"></i> Settings</a></li>
            @endif
        </ul>
    </aside>

    <div class="main-content">
        <header class="top-header">
            <div class="header-left">
                <h1>@yield('page-title', 'Dashboard')</h1>
                <p>@yield('page-description', 'Overview of your farm operations')</p>
            </div>
            <div class="header-right">
                <div class="notification-btn"><i class="bi bi-bell"></i></div>
                <div class="user-profile">
                    <div class="user-avatar">{{ strtoupper(substr(auth()->user()->name, 0, 1)) }}</div>
                    <div class="user-info">
                        <div class="name">{{ auth()->user()->name }}</div>
                        <div class="role">{{ auth()->user()->role }}</div>
                    </div>
                </div>
                <form action="{{ route('logout') }}" method="POST" style="margin:0">
                    @csrf
                    <button type="submit" class="btn btn-sm btn-outline" title="Logout"><i class="bi bi-box-arrow-right"></i></button>
                </form>
            </div>
        </header>

        <div class="page-content">
            @if(session('success'))
                <div class="alert-success">{{ session('success') }}</div>
            @endif
            @if($errors->any())
                <div class="alert-error">
                    @foreach($errors->all() as $error)
                        <div>{{ $error }}</div>
                    @endforeach
                </div>
            @endif
            @yield('content')
        </div>
    </div>
</div>

<script>
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
document.getElementById('sidebar')?.addEventListener('click', function(e) {
    if (window.innerWidth <= 992) this.classList.toggle('open');
});
</script>
@stack('scripts')
</body>
</html>
