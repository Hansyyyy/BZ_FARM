export const pageMeta = {
    '/dashboard': {
        title: 'Dashboard',
        description: 'Overview of your farm operations',
    },
    '/daily-reports': {
        title: 'Daily Reports',
        description: 'View and generate daily farm reports',
    },
    '/chicken-stock': {
        title: 'Chicken Stock',
        description: 'Manage poultry, feed, medicine, eggs, and supplies',
    },
    '/sales': {
        title: 'Sales Management',
        description: 'Track sales and customer transactions',
    },
    '/settings': {
        title: 'Settings',
        description: 'Farm and user account settings',
    },
};

export function getPageMeta(pathname) {
    if (pageMeta[pathname]) {
        return pageMeta[pathname];
    }

    return {
        title: 'BZ Farm',
        description: 'Farm management system',
    };
}
