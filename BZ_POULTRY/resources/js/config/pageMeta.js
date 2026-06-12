const user = typeof window !== 'undefined' ? window.Laravel?.user : null;
const isAdmin = user?.role === 'admin';

export const pageMeta = {
    '/dashboard': isAdmin
        ? {
            title: 'Inventory Dashboard',
            description: 'Admin overview of manager-submitted farm data',
        }
        : {
            title: 'Dashboard',
            description: 'Overview of your farm operations',
        },
    '/daily-reports': isAdmin
        ? {
            title: 'Daily Reports',
            description: 'Review manager-submitted end-of-day farm reports',
        }
        : {
            title: 'Daily Reports',
            description: 'Review and submit your end-of-day farm report',
        },
    '/inventory-stock': {
        title: 'Inventory Stock',
        description: 'Manage poultry, feed, medicine, eggs, and supplies',
    },
    '/chicken-stock': {
        title: 'Inventory Stock',
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
