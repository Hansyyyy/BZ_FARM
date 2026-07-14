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
        { key: 'expiry_date', label: 'Expiry', render: (item) => item.expiry_date ? String(item.expiry_date).slice(0, 10) : '' },
        { key: 'status', label: 'Status' },
    ],
    formFields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'text', required: true },
        { key: 'type', label: 'Type', type: 'text', placeholder: 'Optional' },
        { key: 'stock', label: 'Stock', type: 'number', required: true, min: 0 },
        { key: 'reorder_level', label: 'Reorder Level', type: 'number', required: true, min: 0 },
        { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
        { key: 'unit_price', label: 'Unit Price', type: 'number', required: true, min: 0, step: '0.01' },
    ],
};

