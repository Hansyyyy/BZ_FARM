import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getPageMeta } from '../../config/pageMeta';
import { useHeaderSearchContext } from '../../context/HeaderSearchContext';
import NotificationBell from './NotificationBell';

export default function Header({ onToggleSidebar, onLogout }) {
    const location = useLocation();
    const meta = getPageMeta(location.pathname);
    const user = window.Laravel?.user || { name: 'Username', role: 'Manager' };
    const [menuOpen, setMenuOpen] = useState(false);
    const { searchConfig } = useHeaderSearchContext() || {};

    const firstName = user.name?.split(' ')[0] || 'User';

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
                    <span className="header-greeting">Welcome back, {firstName} 👋</span>
                    <h1>{meta.title}</h1>
                </div>
            </div>
            <div className="header-right">
                {searchConfig ? (
                    <div className="header-search">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder={searchConfig.placeholder}
                            value={searchConfig.value}
                            onChange={(event) => searchConfig.onChange(event.target.value)}
                            aria-label="Search"
                        />
                    </div>
                ) : null}
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
