import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../../hooks/useNotifications';

function formatTime(value) {
    if (!value) return '';
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function typeIcon(type) {
    switch (type) {
        case 'low_stock':
            return 'bi-exclamation-triangle-fill';
        case 'manager_activity':
            return 'bi-person-check-fill';
        default:
            return 'bi-info-circle-fill';
    }
}

export default function NotificationBell() {
    const navigate = useNavigate();
    const panelRef = useRef(null);
    const [open, setOpen] = useState(false);
    const {
        items,
        unreadCount,
        loading,
        permission,
        supported,
        enableBrowserNotifications,
        markRead,
        markAllRead,
    } = useNotifications();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOpen = () => {
        setOpen((current) => !current);
    };

    const handleItemClick = async (item) => {
        if (!item.read_at) {
            await markRead(item.id);
        }

        setOpen(false);

        if (item.link) {
            navigate(item.link);
        }
    };

    const showEnableBanner = supported && permission !== 'granted';

    return (
        <div className="notification-wrap" ref={panelRef}>
            <button
                type="button"
                className="notification-btn"
                title="Notifications"
                aria-label="Notifications"
                onClick={handleOpen}
            >
                <i className="bi bi-bell"></i>
                {unreadCount > 0 && (
                    <span className="notification-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {open && (
                <div className="notification-panel">
                    <div className="notification-panel-header">
                        <div>
                            <strong>Notifications</strong>
                            <span>{unreadCount} unread</span>
                        </div>
                        {unreadCount > 0 && (
                            <button type="button" className="notification-mark-all" onClick={markAllRead}>
                                Mark all read
                            </button>
                        )}
                    </div>

                    {showEnableBanner && (
                        <div className="notification-enable">
                            <p>Enable alerts on this device for PC and mobile notifications.</p>
                            <button
                                type="button"
                                onClick={enableBrowserNotifications}
                                disabled={permission === 'denied'}
                            >
                                {permission === 'denied' ? 'Blocked in browser settings' : 'Enable notifications'}
                            </button>
                        </div>
                    )}

                    <div className="notification-list">
                        {loading && <div className="notification-empty">Loading notifications...</div>}
                        {!loading && items.length === 0 && (
                            <div className="notification-empty">No notifications yet.</div>
                        )}
                        {!loading && items.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`notification-item ${item.read_at ? 'read' : 'unread'}`}
                                onClick={() => handleItemClick(item)}
                            >
                                <span className={`notification-item-icon icon-${item.type}`}>
                                    <i className={`bi ${typeIcon(item.type)}`}></i>
                                </span>
                                <span className="notification-item-body">
                                    <strong>{item.title}</strong>
                                    <span>{item.message}</span>
                                    <time>{formatTime(item.created_at)}</time>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
