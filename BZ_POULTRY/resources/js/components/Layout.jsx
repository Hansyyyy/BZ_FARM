import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
    { path: '/poultry-stock', label: 'Poultry Stock', icon: 'bi-egg-fried' },
    { path: '/feed-inventory', label: 'Feed Inventory', icon: 'bi-basket' },
    { path: '/medicine-vaccine', label: 'Medicine & Vaccine', icon: 'bi-capsule' },
    { path: '/inventory', label: 'Inventory', icon: 'bi-box-seam' },
    { path: '/egg-production', label: 'Egg Production', icon: 'bi-graph-up' },
    { path: '/sales', label: 'Sales Management', icon: 'bi-cash-stack' },
    { path: '/reports', label: 'Reports', icon: 'bi-file-earmark-bar-graph' },
    { path: '/settings', label: 'Settings', icon: 'bi-gear' },
];

export default function Layout({ children }) {
    const [collapsed, setCollapsed] = useState(localStorage.getItem('sidebarCollapsed') === '1');
    const [showLogout, setShowLogout] = useState(false);
    const user = window.Laravel?.user || { name: 'User', role: 'User' };

    const sidebarClass = useMemo(() => (collapsed ? 'sidebar collapsed' : 'sidebar'), [collapsed]);

    const toggleSidebar = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem('sidebarCollapsed', next ? '1' : '0');
    };

    return (
        <div className="app-layout">
            <aside className={sidebarClass}>
                <div className="sidebar-logo" title="BZ Farm">
                    <div className="logo-circle"><i className="bi bi-egg-fried"></i></div>
                    <span>BZ FARM</span>
                </div>
                <ul className="nav-menu">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink to={item.path} className={({ isActive }) => isActive ? 'active' : ''}>
                                <i className={`bi ${item.icon}`}></i>
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </aside>
            <div className={`main-content ${collapsed ? 'collapsed-margin' : ''}`}>
                <header className="top-header">
                    <div className="header-left">
                        <button id="sidebarToggle" className="btn btn-sm btn-outline" title="Collapse sidebar" onClick={toggleSidebar}>
                            <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
                        </button>
                        <div>
                            <h1>Farm Management</h1>
                            <p>Manage your operations from one dashboard</p>
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="notification-btn"><i className="bi bi-bell"></i></div>
                        <div className="user-profile">
                            <div className="user-avatar">{user.name?.charAt(0).toUpperCase()}</div>
                            <div className="user-info">
                                <div className="name">{user.name}</div>
                                <div className="role">{user.role}</div>
                            </div>
                        </div>
                        <button type="button" className="btn btn-sm btn-outline" title="Logout" onClick={() => setShowLogout(true)}>
                            <i className="bi bi-box-arrow-right"></i>
                        </button>
                    </div>
                </header>
                <div className="page-content">
                    {children}
                </div>
            </div>
            {showLogout && (
                <div className="modal-overlay show" onClick={(event) => event.target === event.currentTarget && setShowLogout(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Logout</h3>
                            <button className="action-btn" onClick={() => setShowLogout(false)}><i className="bi bi-x-lg"></i></button>
                        </div>
                        <div className="modal-body">Are you sure you want to logout?</div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline" onClick={() => setShowLogout(false)}>Cancel</button>
                            <form method="POST" action="/logout" style={{ margin: 0 }}>
                                <input type="hidden" name="_token" value={window.Laravel.csrfToken} />
                                <button type="submit" className="btn btn-danger">Logout</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
