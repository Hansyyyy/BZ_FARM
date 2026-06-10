import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getPageMeta } from '../../config/pageMeta';
import { useFarmSettings } from '../../context/FarmSettingsContext';
import NotificationBell from './NotificationBell';

export default function Header({ onToggleSidebar, onLogout }) {
    const location = useLocation();
    const meta = getPageMeta(location.pathname);
    const { farmName } = useFarmSettings();
    const user = window.Laravel?.user || { name: 'Username', role: 'Manager' };
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="top-header">
            <div className="header-left">
                <button
                    id="sidebarToggle"
                    type="button"
                    className="hamburger-btn"
                    title="Toggle menu"
                    onClick={onToggleSidebar}
                >
                    <i className="bi bi-list"></i>
                </button>
                <div className="header-title-block">
                    <span className="header-farm-name">{farmName}</span>
                    <h1>{meta.title}</h1>
                    <p>{meta.description}</p>
                </div>
            </div>
            <div className="header-right">
                <NotificationBell />
                <div className={`user-dropdown ${menuOpen ? 'open' : ''}`}>
                    <button type="button" className="user-profile" onClick={() => setMenuOpen(!menuOpen)}>
                        <div className="user-avatar"><i className="bi bi-person"></i></div>
                        <div className="user-info">
                            <div className="name">{user.name}</div>
                            <div className="role">{user.role}</div>
                        </div>
                        <i className="bi bi-chevron-down user-chevron"></i>
                    </button>
                    {menuOpen && (
                        <div className="user-dropdown-menu">
                            <button type="button" onClick={onLogout}>Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
