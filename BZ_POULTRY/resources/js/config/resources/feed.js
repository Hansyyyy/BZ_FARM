const feedCategories = ['Booster', 'Starter', 'Grower', 'Prelay', 'Layer 1', 'Layer 2'];

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
        { key: 'name', label: 'Feed Types' },
        { key: 'category', label: 'Category' },
        { key: 'stock', label: 'Stock (kg)' },
        { key: 'unit', label: 'Unit' },
        { key: 'reorder_level', label: 'Reorder Level (kg)' },
        { key: 'expiry_date', label: 'Expiry Date' },
        { key: 'last_stock_in', label: 'Last Stock in' },
        { key: 'status', label: 'Status', badge: true },
    ],
    formFields: [
        { key: 'name', label: 'Feed Type', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'select', options: feedCategories, required: true },
        { key: 'stock', label: 'Stock (kg)', type: 'number', required: true, min: 0 },
        { key: 'unit', label: 'Unit', type: 'text', placeholder: 'Optional (defaults to kg)' },
        { key: 'reorder_level', label: 'Reorder Level (kg)', type: 'number', required: true, min: 0 },
        { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
        { key: 'last_stock_in', label: 'Last Stock in', type: 'date' },
        { key: 'cost_per_kg', label: 'Cost per kg', type: 'number', required: true, min: 0, step: '0.01' },
    ],
};
