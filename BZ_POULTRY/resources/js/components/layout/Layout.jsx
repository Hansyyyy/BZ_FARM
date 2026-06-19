import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import LogoutModal from './LogoutModal';

export default function Layout({ children }) {
    const [collapsed, setCollapsed] = useState(localStorage.getItem('sidebarCollapsed') === '1');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showLogout, setShowLogout] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('theme', next);
        document.documentElement.classList.toggle('dark-theme', next === 'dark');
    };


    const toggleSidebar = () => {
        if (window.innerWidth <= 992) {
            setMobileOpen((open) => !open);
            return;
        }

        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem('sidebarCollapsed', next ? '1' : '0');
    };

    return (
        <div className="app-layout">
            <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />

            <button
                type="button"
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
                title="Toggle dark mode"
            >
                <i className={`bi ${theme === 'dark' ? 'bi-moon-stars' : 'bi-sun'}`}></i>
            </button>

            <div className={`main-content ${collapsed ? 'collapsed-margin' : ''}`}>
                <Header onToggleSidebar={toggleSidebar} onLogout={() => setShowLogout(true)} />
                <div className="page-content">{children}</div>
            </div>
            <LogoutModal open={showLogout} onClose={() => setShowLogout(false)} />
        </div>
    );
}

