const SW_PATH = '/sw.js';

export function isNotificationSupported() {
    return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return null;
    }

    try {
        return await navigator.serviceWorker.register(SW_PATH);
    } catch {
        return null;
    }
}

export async function getNotificationPermission() {
    if (!isNotificationSupported()) {
        return 'unsupported';
    }

    return Notification.permission;
}

export async function requestNotificationPermission() {
    if (!isNotificationSupported()) {
        return 'unsupported';
    }

    if (Notification.permission === 'granted') {
        await registerServiceWorker();
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        return 'denied';
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
        await registerServiceWorker();
    }

    return permission;
}

export async function showBrowserNotification({ id, title, message, link }) {
    if (!isNotificationSupported() || Notification.permission !== 'granted') {
        return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const tag = `bz-farm-${id}`;

    await registration.showNotification(title, {
        body: message,
        icon: window.Laravel?.logoUrl || '/images/BZ%20LOGO.png',
        badge: window.Laravel?.logoUrl || '/images/BZ%20LOGO.png',
        tag,
        renotify: true,
        data: { url: link || '/dashboard' },
    });

    return true;
}
