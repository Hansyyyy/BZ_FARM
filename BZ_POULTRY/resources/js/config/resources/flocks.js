export default {
    title: 'Chicken Stock',
    endpoint: '/api/flocks',
    summaryFields: [
        { key: 'totalFlocks', label: 'Total Chickens', sub: 'Active Chickens' },
        { key: 'totalPoultry', label: 'Total Poultry', sub: 'Birds in Stock' },
        { key: 'layers', label: 'Layers', percentOf: 'totalPoultry' },
        { key: 'pullets', label: 'Pullets', percentOf: 'totalPoultry' },
        { key: 'roosters', label: 'Roosters', percentOf: 'totalPoultry' },
    ],
    columns: [
        { key: 'building_name', label: 'Building', render: (item) => item.building_name || '' },
        { key: 'batch_no', label: 'Batch No' },
        { key: 'type', label: 'Type', render: (item) => String(item.type || '').replace(/^\w/, (c) => c.toUpperCase()) },
        { key: 'initial_quantity', label: 'Initial Quantity' },
        { key: 'quantity', label: 'Quantity' },
        {
            key: 'age',
            label: 'Age',
            render: (item) => {
                if (!item.date_in) return '';
                const now = new Date();
                const dateIn = new Date(item.date_in);
                const diffTime = Math.abs(now - dateIn);
                const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                if (totalDays < 7) return `${totalDays} day/s`;
                const weeks = Math.floor(totalDays / 7);
                const days = totalDays % 7;
                if (days === 0) return `${weeks} week/s`;
                return `${weeks} week/s and ${days} day/s`;
            },
        },
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
        {
            key: 'building_name',
            label: 'Building',
            type: 'select',
            optionsKey: 'buildings',
            optionValue: 'id',
            optionLabel: 'name',
        },
        { key: 'batch_no', label: 'Batch Number', type: 'text' },
        { key: 'type', label: 'Type', type: 'select', options: ['Layers', 'Growers'], readOnly: false },
        { key: 'quantity', label: 'Quantity', type: 'number' },
        { key: 'age_days', label: 'Age (Days)', type: 'number' },
    ],
    editFormFields: [
        { key: 'batch_no', label: 'Building', type: 'text', readOnly: true },
        { key: 'type', label: 'Type', type: 'select', options: ['Layers', 'Growers'] },
        { key: 'quantity', label: 'Quantity', type: 'number' },
        { key: 'age_weeks', label: 'Age (Weeks)', type: 'number' },
        { key: 'mortality', label: 'Mortality', type: 'number' },
        { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    ],
};
