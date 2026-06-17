const goodEggBreakdown = [
    { key: 'super_jumbo_eggs', label: 'Super Jumbo' },
    { key: 'jumbo_eggs', label: 'Jumbo' },
    { key: 'extra_large_eggs', label: 'Extra Large' },
    { key: 'large_eggs', label: 'Large' },
    { key: 'medium_eggs', label: 'Medium' },
    { key: 'small_eggs', label: 'Small' },
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
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'building_id', label: 'Building', type: 'select', optionsKey: 'buildings' },
        { key: 'total_eggs', label: 'Total Eggs (pcs)', type: 'number' },
        { key: 'super_jumbo_eggs', label: 'Super Jumbo', type: 'number' },
        { key: 'jumbo_eggs', label: 'Jumbo', type: 'number' },
        { key: 'extra_large_eggs', label: 'Extra Large', type: 'number' },
        { key: 'large_eggs', label: 'Large', type: 'number' },
        { key: 'medium_eggs', label: 'Medium', type: 'number' },
        { key: 'small_eggs', label: 'Small', type: 'number' },
        { key: 'cracked_eggs', label: 'Cracked', type: 'number' },
        { key: 'soft_shell_eggs', label: 'Soft Shell', type: 'number' },
        { key: 'damaged_eggs', label: 'Leak', type: 'number' },
    ],
};
