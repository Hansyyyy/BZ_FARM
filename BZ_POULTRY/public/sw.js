self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/dashboard';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            const existing = clients.find((client) => client.url.includes(self.location.origin));

            if (existing) {
                existing.focus();
                existing.navigate(targetUrl);
                return;
            }

            return self.clients.openWindow(targetUrl);
        }),
    );
});

self.addEventListener('push', (event) => {
    if (!event.data) {
        return;
    }

    let payload = {};

    try {
        payload = event.data.json();
    } catch {
        payload = { title: 'BZ Farm', message: event.data.text() };
    }

    event.waitUntil(
        self.registration.showNotification(payload.title || 'BZ Farm', {
            body: payload.message || '',
            icon: payload.icon || '/images/BZ%20LOGO.png',
            badge: payload.icon || '/images/BZ%20LOGO.png',
            data: { url: payload.link || '/dashboard' },
            tag: payload.tag || 'bz-farm-notification',
        }),
    );
});
