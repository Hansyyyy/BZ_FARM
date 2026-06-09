export default {
    title: 'Medicine & Vaccine',
    endpoint: '/api/medicine',
    summaryFields: [
        { key: 'totalItems', label: 'Total Items' },
        { key: 'totalValue', label: 'Total Value' },
        { key: 'lowStock', label: 'Low Stock' },
        { key: 'expiringSoon', label: 'Expiring Soon' },
        { key: 'usedThisMonth', label: 'Used This Month' },
    ],
    columns: [
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Category' },
        { key: 'type', label: 'Type' },
        { key: 'stock', label: 'Stock' },
        { key: 'reorder_level', label: 'Reorder Level' },
        { key: 'expiry_date', label: 'Expiry' },
        { key: 'status', label: 'Status' },
    ],
    formFields: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'category', label: 'Category', type: 'text' },
        { key: 'type', label: 'Type', type: 'text' },
        { key: 'stock', label: 'Stock', type: 'number' },
        { key: 'reorder_level', label: 'Reorder Level', type: 'number' },
        { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
        { key: 'unit_price', label: 'Unit Price', type: 'number' },
    ],
};
