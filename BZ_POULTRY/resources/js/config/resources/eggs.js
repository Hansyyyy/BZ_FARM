export default {
    title: 'Egg Production',
    endpoint: '/api/eggs',
    summaryFields: [
        { key: 'eggsToday', label: 'Eggs Today' },
        { key: 'softShellToday', label: 'Soft Shell Eggs' },
        { key: 'damagedToday', label: 'Damaged Eggs' },
        { key: 'crackedToday', label: 'Cracked Eggs' },
        { key: 'weekTotal', label: 'This Week' },
        { key: 'monthTotal', label: 'This Month' },
    ],
    columns: [
        { key: 'date', label: 'Date' },
        { key: 'building_id', label: 'Building', render: (item) => item.building?.name ?? '' },
        { key: 'total_eggs', label: 'Total Eggs' },
        { key: 'soft_shell_eggs', label: 'Soft Shell Eggs' },
        { key: 'damaged_eggs', label: 'Damaged Eggs' },
        { key: 'cracked_eggs', label: 'Cracked Eggs' },
    ],
    formFields: [
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'building_id', label: 'Building', type: 'select', optionsKey: 'buildings' },
        { key: 'total_eggs', label: 'Total Eggs', type: 'number' },
        { key: 'soft_shell_eggs', label: 'Soft Shell Eggs', type: 'number' },
        { key: 'damaged_eggs', label: 'Damaged Eggs', type: 'number' },
        { key: 'cracked_eggs', label: 'Cracked Eggs', type: 'number' },
    ],
};
