export const managerNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
    { path: '/daily-reports', label: 'Daily Reports', icon: 'bi-calendar-day' },
    { path: '/chicken-stock', label: 'Chicken Stock', icon: 'bi-egg-fried' },
    { path: '/sales', label: 'Sales Management', icon: 'bi-cash-stack' },
];

export const adminNavItems = [
    { path: '/dashboard', label: 'Inventory Dashboard', icon: 'bi-grid-1x2' },
    { path: '/daily-reports', label: 'Daily Reports', icon: 'bi-calendar-day' },
    { path: '/settings', label: 'Settings', icon: 'bi-gear', adminOnly: true },
];

export function getNavItems(role = 'manager') {
    if (role === 'admin') {
        return adminNavItems;
    }

    return managerNavItems;
}
