import { NavLink } from 'react-router-dom';
import { navItems } from '../../config/navigation';

export default function Sidebar({ collapsed, mobileOpen, onNavigate }) {
    const user = window.Laravel?.user || { role: 'user' };
    const isAdmin = user.role === 'admin';
    const items = navItems.filter((item) => !item.adminOnly || isAdmin);
    const className = [
        'sidebar',
        collapsed ? 'collapsed' : '',
        mobileOpen ? 'open' : '',
    ].filter(Boolean).join(' ');

    return (
        <aside className={className}>
            <div className="sidebar-logo" title="BZ Farm">
                <div className="logo-circle"></div>
                <span>BZ FARM</span>
            </div>
            <ul className="nav-menu">
                {items.map((item) => (
                    <li key={item.path}>
                        <NavLink
                            to={item.path}
                            className={({ isActive }) => (isActive ? 'active' : '')}
                            onClick={onNavigate}
                        >
                            <i className={`bi ${item.icon}`}></i>
                            <span>{item.label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
