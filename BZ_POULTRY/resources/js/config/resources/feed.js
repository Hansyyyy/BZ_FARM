const feedCategories = ['Starter feeds', 'Grower feeds', 'Layer feeds'];

export default {
    title: 'Feed Inventory',
    endpoint: '/api/feed',
    summaryFields: [
        { key: 'totalItems', label: 'Total Items' },
        { key: 'totalStock', label: 'Total Stock (kg)' },
        { key: 'lowStock', label: 'Low Stock Items' },
        { key: 'consumed', label: 'Consumed (kg)' },
        { key: 'feedCost', label: 'Feed Cost' },
    ],
    columns: [
        { key: 'category', label: 'Category' },
        { key: 'stock', label: 'Stock' },
        { key: 'reorder_level', label: 'Reorder Level' },
        { key: 'expiry_date', label: 'Expiry' },
        { key: 'status', label: 'Status' },
    ],
    formFields: [
        { key: 'category', label: 'Category', type: 'select', options: feedCategories },
        { key: 'stock', label: 'Stock', type: 'number' },
        { key: 'reorder_level', label: 'Reorder Level', type: 'number' },
        { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
        { key: 'cost_per_kg', label: 'Cost per kg', type: 'number' },
    ],
};
