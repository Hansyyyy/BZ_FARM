export default {
    title: 'Chicken Stock',
    endpoint: '/api/flocks',
    summaryFields: [
        { key: 'totalFlocks', label: 'Total Flocks', sub: 'Active Flocks' },
        { key: 'totalPoultry', label: 'Total Poultry', sub: 'Bird in Stock' },
        { key: 'layers', label: 'Layers', percentOf: 'totalPoultry' },
        { key: 'pullets', label: 'Pullets', percentOf: 'totalPoultry' },
        { key: 'roosters', label: 'Roosters', percentOf: 'totalPoultry' },
    ],
    columns: [
        { key: 'batch_no', label: 'Building No.' },
        { key: 'type', label: 'Type', render: (item) => String(item.type || '').replace(/^\w/, (c) => c.toUpperCase()) },
        { key: 'quantity', label: 'Quantity' },
        { key: 'age_days', label: 'Age(Days)', render: (item) => (item.age_weeks || 0) * 7 },
        { key: 'date_in', label: 'Date In', render: (item) => item.date_in ? String(item.date_in).slice(0, 10) : '' },
        { key: 'cull', label: 'Cull', render: () => 0 },
        { key: 'mortality', label: 'Mortality', render: (item) => item.mortality ?? 0 },
        {
            key: 'mortality_rate',
            label: 'Mortality Rate',
            render: (item) => {
                const initial = item.initial_quantity || item.quantity || 0;
                const rate = initial ? ((item.mortality || 0) / initial) * 100 : 0;
                return `${rate.toFixed(1)}%`;
            },
        },
        { key: 'status', label: 'Status', badge: true },
    ],
    formFields: [
        { key: 'batch_no', label: 'Building / Batch No.', type: 'text' },
        { key: 'type', label: 'Type', type: 'select', options: ['layers', 'pullets', 'roosters'] },
        { key: 'breed', label: 'Breed', type: 'text' },
        { key: 'quantity', label: 'Quantity', type: 'number' },
        { key: 'age_weeks', label: 'Age (Weeks)', type: 'number' },
        { key: 'date_in', label: 'Date In', type: 'date' },
    ],
};
