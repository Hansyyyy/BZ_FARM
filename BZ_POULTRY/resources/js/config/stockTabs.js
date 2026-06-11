import { resources } from './resources';

export const stockTabs = [
    {
        id: 'chicken',
        label: 'Chicken',
        resourceKey: 'flocks',
        listTitle: 'Chicken List',
        addLabel: 'Add New Chicken',
        searchPlaceholder: 'search by batch no, breed, or type...',
        showDistribution: true,
        showActivities: true,
        filters: ['type', 'building', 'status'],
    },
    {
        id: 'feeds',
        label: 'Feeds',
        resourceKey: 'feed',
        listTitle: 'Feed List',
        addLabel: 'Add New Feed',
        searchPlaceholder: 'search by category...',
        filters: ['category', 'status'],
    },
    {
        id: 'medicine',
        label: 'Medicine & Vaccine',
        resourceKey: 'medicine',
        listTitle: 'Medicine List',
        addLabel: 'Add New Item',
        searchPlaceholder: 'search by name or category...',
        filters: ['category', 'status'],
    },
    {
        id: 'eggs',
        label: 'Eggs',
        resourceKey: 'eggs',
        listTitle: 'Egg Production List',
        addLabel: 'Add New Record',
        searchPlaceholder: 'search by date or building...',
        filters: ['date'],
    },
    {
        id: 'medications',
        label: 'Medications',
        resourceKey: 'inventory',
        listTitle: 'Medications List',
        addLabel: 'Add New Item',
        searchPlaceholder: 'search by code or name...',
        filters: ['category', 'status'],
    },
];

export function getStockTab(id) {
    return stockTabs.find((tab) => tab.id === id) || stockTabs[0];
}

export function getStockResource(tabId) {
    const tab = getStockTab(tabId);
    return resources[tab.resourceKey];
}
