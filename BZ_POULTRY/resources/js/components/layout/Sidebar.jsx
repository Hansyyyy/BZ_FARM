import { NavLink } from 'react-router-dom';
import { getNavItems } from '../../config/navigation';
import { useFarmSettings } from '../../context/FarmSettingsContext';

export default function Sidebar({ collapsed, mobileOpen, onNavigate }) {
    const user = window.Laravel?.user || { role: 'user' };
    const { farmName } = useFarmSettings();
    const items = getNavItems(user.role);
    const isCollapsed = collapsed && !mobileOpen;
    const className = [
        'sidebar',
        isCollapsed ? 'collapsed' : '',
        mobileOpen ? 'open' : '',
    ].filter(Boolean).join(' ');

    return (
        <aside className={className}>
            <div className="sidebar-logo" title={farmName}>
                <div className="logo-circle">
                    <img src={window.Laravel?.logoUrl || '/images/BZ%20LOGO.png'} alt={`${farmName} logo`} />
                </div>
                <span>{farmName}</span>
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
