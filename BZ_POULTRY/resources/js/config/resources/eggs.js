const goodEggBreakdown = [
    { key: 'super_jumbo_eggs', label: 'Super Jumbo' },
    { key: 'jumbo_eggs', label: 'Jumbo' },
    { key: 'extra_large_eggs', label: 'Extra Large' },
    { key: 'large_eggs', label: 'Large' },
    { key: 'medium_eggs', label: 'Medium' },
    { key: 'small_eggs', label: 'Small' },
    { key: 'piwi_eggs', label: 'Piwi' },
];

const defectiveEggBreakdown = [
    { key: 'cracked_eggs', label: 'Cracked' },
    { key: 'soft_shell_eggs', label: 'Soft Shell' },
    { key: 'damaged_eggs', label: 'Leak' },
];

export default {
    title: 'Egg Production',
    endpoint: '/api/eggs',
    expandable: true,
    goodEggBreakdown,
    defectiveEggBreakdown,
    summaryFields: [
        { key: 'eggsToday', label: 'Eggs Today' },
        { key: 'weekTotal', label: 'This Week' },
        { key: 'monthTotal', label: 'This Month' },
    ],
    columns: [
        { key: 'date', label: 'Date' },
        { key: 'building_id', label: 'Building', render: (item) => item.building?.name ?? '' },
        { key: 'total_eggs', label: 'Total Eggs (pcs)' },
        { key: 'good_eggs', label: 'Good Eggs (pcs)', render: (item) => {
            return goodEggBreakdown.reduce((sum, b) => sum + (Number(item[b.key]) || 0), 0);
        }},
        { key: 'defective_eggs', label: 'Defective Eggs', render: (item) => {
            return defectiveEggBreakdown.reduce((sum, b) => sum + (Number(item[b.key]) || 0), 0);
        }},
        { key: 'building_status', label: 'Status', badge: true },
    ],
    formFields: [
        { key: 'date', label: 'Date', type: 'date', required: true },
        { key: 'building_id', label: 'Building', type: 'select', optionsKey: 'buildings', required: true },
        { key: 'total_eggs', label: 'Total Eggs (pcs)', type: 'number', required: true, min: 1 },
        { key: 'super_jumbo_eggs', label: 'Super Jumbo', type: 'number', min: 0 },
        { key: 'jumbo_eggs', label: 'Jumbo', type: 'number', min: 0 },
        { key: 'extra_large_eggs', label: 'Extra Large', type: 'number', min: 0 },
        { key: 'large_eggs', label: 'Large', type: 'number', min: 0 },
        { key: 'medium_eggs', label: 'Medium', type: 'number', min: 0 },
        { key: 'small_eggs', label: 'Small', type: 'number', min: 0 },
        { key: 'piwi_eggs', label: 'Piwi', type: 'number', min: 0 },
        { key: 'cracked_eggs', label: 'Cracked', type: 'number', min: 0 },
        { key: 'soft_shell_eggs', label: 'Soft Shell', type: 'number', min: 0 },
        { key: 'damaged_eggs', label: 'Leak', type: 'number', min: 0 },
    ],
};
