<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Dashboard') - BZ Farm</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="{{ asset('css/farm.css') }}">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <style>
    /* Sidebar collapsed (icons only) */
    .sidebar.collapsed { width: 60px; }
    .sidebar.collapsed .sidebar-logo span, .sidebar.collapsed .nav-menu li a span { display: none; }
    .sidebar { transition: width .2s ease; overflow: hidden }
    .modal-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); align-items:center; justify-content:center; z-index:1050; }
    .modal-overlay.show { display:flex; }
    .modal { background:#fff; border-radius:6px; width:720px; max-width:95%; box-shadow:0 10px 30px rgba(0,0,0,.2); }
    .modal-header, .modal-footer { padding:12px 16px; border-bottom:1px solid #eee; }
    .modal-body { padding:16px; }
    .modal-header h3 { margin:0; display:inline-block }
    .modal-header .action-btn { float:right; }
    </style>
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
                <button id="sidebarToggle" class="btn btn-sm btn-outline" title="Collapse sidebar"><i class="bi bi-chevron-left"></i></button>
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
                <button type="button" class="btn btn-sm btn-outline" title="Logout" onclick="openModal('logoutModal')"><i class="bi bi-box-arrow-right"></i></button>
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

<!-- Generic Edit Modal -->
<div class="modal-overlay" id="editModal">
    <div class="modal">
        <div class="modal-header"><h3>Edit</h3><button onclick="closeModal('editModal')" class="action-btn"><i class="bi bi-x-lg"></i></button></div>
        <form method="POST" action="#">
            @csrf
            <div class="modal-body"> <!-- populated dynamically -->
            </div>
            <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="closeModal('editModal')">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>
    </div>
</div>

<!-- Confirm Delete Modal -->
<div class="modal-overlay" id="confirmDeleteModal">
    <div class="modal">
        <div class="modal-header"><h3 class="modal-title">Confirm Delete</h3><button onclick="closeModal('confirmDeleteModal')" class="action-btn"><i class="bi bi-x-lg"></i></button></div>
        <form method="POST" action="#">
            @csrf
            @method('DELETE')
            <div class="modal-body">Are you sure you want to delete this item?</div>
            <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="closeModal('confirmDeleteModal')">Cancel</button><button type="submit" class="btn btn-danger">Delete</button></div>
        </form>
    </div>
</div>

<!-- Export Modal (PDF/CSV) -->
<div class="modal-overlay" id="exportModal">
    <div class="modal">
        <div class="modal-header"><h3>Export <span class="export-module"></span></h3><button onclick="closeModal('exportModal')" class="action-btn"><i class="bi bi-x-lg"></i></button></div>
        <form method="GET" action="#">
            <div class="modal-body">
                <p>Select export format for <strong class="export-module"></strong>:</p>
                <div class="form-group"><label><input type="radio" name="format" value="pdf" checked> PDF</label></div>
                <div class="form-group"><label><input type="radio" name="format" value="csv"> CSV</label></div>
            </div>
            <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="closeModal('exportModal')">Cancel</button><button type="submit" class="btn btn-success">Export</button></div>
        </form>
    </div>
</div>

<!-- Logout Modal -->
<div class="modal-overlay" id="logoutModal">
    <div class="modal">
        <div class="modal-header"><h3>Logout</h3><button onclick="closeModal('logoutModal')" class="action-btn"><i class="bi bi-x-lg"></i></button></div>
        <form method="POST" action="{{ route('logout') }}">
            @csrf
            <div class="modal-body">Are you sure you want to logout?</div>
            <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="closeModal('logoutModal')">Cancel</button><button type="submit" class="btn btn-danger">Logout</button></div>
        </form>
    </div>
</div>

<script>
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
// Confirm delete helper: populate and open
function confirmDelete(formAction, title = 'Are you sure?'){
    const modal = document.getElementById('confirmDeleteModal');
    modal.querySelector('.modal-title').textContent = title;
    modal.querySelector('form').action = formAction;
    openModal('confirmDeleteModal');
}
// Edit modal helper: populate content html and action
function openEditModal(contentHtml, formAction){
    const modal = document.getElementById('editModal');
    modal.querySelector('.modal-body').innerHTML = contentHtml;
    modal.querySelector('form').action = formAction;
    openModal('editModal');
}
// Export modal helper
function openExportModal(moduleName, url){
    const modal = document.getElementById('exportModal');
    modal.querySelectorAll('.export-module').forEach(e => e.textContent = moduleName);
    modal.querySelector('form').action = url;
    openModal('exportModal');
}
// Sidebar collapse toggle persistent in localStorage
const sidebar = document.getElementById('sidebar');
const toggle = document.getElementById('sidebarToggle');
function applySidebarState(){
    if (localStorage.getItem('sidebarCollapsed') === '1') sidebar.classList.add('collapsed'); else sidebar.classList.remove('collapsed');
}
applySidebarState();
toggle?.addEventListener('click', function(){
    const isCollapsed = sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed ? '1' : '0');
    this.querySelector('i')?.classList.toggle('bi-chevron-right', isCollapsed);
    this.querySelector('i')?.classList.toggle('bi-chevron-left', !isCollapsed);
});
document.getElementById('sidebar')?.addEventListener('click', function(e) {
    if (window.innerWidth <= 992) this.classList.toggle('open');
});
</script>
@stack('scripts')
</body>
</html>
