export default {
    title: 'Chicken Stock',
    endpoint: '/api/flocks',
    summaryFields: [
        { key: 'totalFlocks', label: 'Total Chickens', sub: 'Active Chickens' },
        { key: 'totalPoultry', label: 'Total Poultry', sub: 'Birds in Stock' },
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
        { key: 'date_out', label: 'Date Out', render: (item) => item.date_out ? String(item.date_out).slice(0, 10) : '—' },
        { key: 'cull', label: 'Cull', render: (item) => item.cull ?? 0 },
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
        {
            key: 'closed_reason',
            label: 'Close Reason',
            render: (item) => {
                if (!item.closed_reason) return '—';
                return String(item.closed_reason).replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
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
            required: true,
        },
        { key: 'batch_no', label: 'Batch Number', type: 'text', required: true },
        { key: 'type', label: 'Type', type: 'select', options: ['Layers', 'Growers'], required: true },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
        { key: 'age_days', label: 'Age (Days)', type: 'number', min: 0 },
    ],
    editFormFields: [
        { key: 'batch_no', label: 'Batch No', type: 'text', readOnly: true },
        { key: 'building_name', label: 'Building', type: 'text', readOnly: true },
        { key: 'type', label: 'Type', type: 'select', options: ['Layers', 'Growers'], required: true },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, min: 0 },
        { key: 'age_weeks', label: 'Age (Weeks)', type: 'number', required: true, min: 0 },
        { key: 'mortality', label: 'Mortality', type: 'number', min: 0 },
    ],
    closeReasonOptions: [
        { value: 'cycle_end', label: 'Cycle ended' },
        { value: 'depleted', label: 'Flock depleted' },
        { value: 'sold', label: 'Sold / dispatched' },
        { value: 'replaced', label: 'Replaced by new batch' },
        { value: 'transferred', label: 'Transferred out' },
        { value: 'other', label: 'Other' },
    ],
};
