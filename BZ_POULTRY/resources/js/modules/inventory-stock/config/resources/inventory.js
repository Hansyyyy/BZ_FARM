import React from 'react';

const getInventoryIcon = (item) => {
    const category = String(item?.category || '').toLowerCase();

    if (category.includes('feed')) {
        return 'bi-bucket';
    }

    if (category.includes('medicine') || category.includes('vaccine')) {
        return 'bi-capsule';
    }

    if (category.includes('egg')) {
        return 'bi-basket';
    }

    if (category.includes('tool') || category.includes('equipment')) {
        return 'bi-tools';
    }

    return 'bi-box-seam';
};

export default {
    title: 'Inventory',
    endpoint: '/api/inventory',
    summaryFields: [
        { key: 'totalItems', label: 'Total Items' },
        { key: 'totalValue', label: 'Total Value' },
        { key: 'lowStock', label: 'Low Stock' },
        { key: 'stockIn', label: 'Stock In' },
        { key: 'stockOut', label: 'Stock Out' },
    ],
    columns: [
        { key: 'item_code', label: 'Code' },
        {
            key: 'name',
            label: 'Name',
            render: (item) => React.createElement(
                'span',
                { className: 'inventory-item-name' },
                React.createElement('i', { className: `bi ${getInventoryIcon(item)}`, 'aria-hidden': 'true' }),
                React.createElement('span', null, item.name)
            ),
        },
        { key: 'category', label: 'Category' },
        { key: 'stock', label: 'Stock' },
        { key: 'unit', label: 'Unit' },
        { key: 'reorder_level', label: 'Reorder Level' },
        { key: 'location', label: 'Location' },
    ],
    formFields: [
        { key: 'item_code', label: 'Item Code', type: 'text', required: true },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'text', required: true },
        { key: 'stock', label: 'Stock', type: 'number', required: true, min: 0 },
        { key: 'unit', label: 'Unit', type: 'text', required: true },
        { key: 'reorder_level', label: 'Reorder Level', type: 'number', required: true, min: 0 },
        { key: 'location', label: 'Location', type: 'text', placeholder: 'Optional' },
        { key: 'unit_price', label: 'Unit Price', type: 'number', required: true, min: 0, step: '0.01' },
    ],
};

