import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
    getNotificationPermission,
    isNotificationSupported,
    registerServiceWorker,
    requestNotificationPermission,
    showBrowserNotification,
} from '../utils/browserNotifications';

const POLL_INTERVAL_MS = 30000;
const SEEN_KEY = 'bzFarmSeenNotifications';

function loadSeenIds() {
    try {
        return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'));
    } catch {
        return new Set();
    }
}

function saveSeenIds(ids) {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
}

export default function useNotifications() {
    const [items, setItems] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [permission, setPermission] = useState('default');
    const [supported, setSupported] = useState(false);
    const seenIdsRef = useRef(loadSeenIds());

    const pushNewAlerts = useCallback(async (notifications) => {
        const unseen = notifications.filter(
            (item) => !item.read_at && !seenIdsRef.current.has(item.id),
        );

        for (const item of unseen) {
            await showBrowserNotification(item);
            seenIdsRef.current.add(item.id);
        }

        if (unseen.length) {
            saveSeenIds(seenIdsRef.current);
        }
    }, []);

    const fetchNotifications = useCallback(async (silent = false) => {
        if (!silent) {
            setLoading(true);
        }

        try {
            const response = await axios.get('/api/notifications');
            const nextItems = response.data.items || [];

            setItems(nextItems);
            setUnreadCount(response.data.unread_count || 0);
            await pushNewAlerts(nextItems);
        } catch {
            if (!silent) {
                setItems([]);
                setUnreadCount(0);
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [pushNewAlerts]);

    const enableBrowserNotifications = useCallback(async () => {
        const nextPermission = await requestNotificationPermission();
        setPermission(nextPermission);
        return nextPermission;
    }, []);

    const markRead = useCallback(async (notificationId) => {
        await axios.post(`/api/notifications/${notificationId}/read`);
        setItems((current) => current.map((item) => (
            item.id === notificationId ? { ...item, read_at: new Date().toISOString() } : item
        )));
        setUnreadCount((count) => Math.max(0, count - 1));
    }, []);

    const markAllRead = useCallback(async () => {
        await axios.post('/api/notifications/read-all');
        const now = new Date().toISOString();
        setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at || now })));
        setUnreadCount(0);
    }, []);

    useEffect(() => {
        let active = true;

        const init = async () => {
            setSupported(isNotificationSupported());
            setPermission(await getNotificationPermission());
            await registerServiceWorker();

            if (active) {
                await fetchNotifications();
            }
        };

        init();

        const intervalId = window.setInterval(() => {
            fetchNotifications(true);
        }, POLL_INTERVAL_MS);

        const onFocus = () => fetchNotifications(true);
        window.addEventListener('focus', onFocus);

        return () => {
            active = false;
            window.clearInterval(intervalId);
            window.removeEventListener('focus', onFocus);
        };
    }, [fetchNotifications]);

    return {
        items,
        unreadCount,
        loading,
        permission,
        supported,
        refresh: fetchNotifications,
        enableBrowserNotifications,
        markRead,
        markAllRead,
    };
}
