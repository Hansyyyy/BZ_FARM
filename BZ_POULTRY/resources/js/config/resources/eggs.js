export default {
    title: 'Egg Production',
    endpoint: '/api/eggs',
    summaryFields: [
        { key: 'eggsToday', label: 'Eggs Today' },
        { key: 'goodToday', label: 'Good Eggs' },
        { key: 'crackedToday', label: 'Cracked Eggs' },
        { key: 'weekTotal', label: 'This Week' },
        { key: 'monthTotal', label: 'This Month' },
    ],
    columns: [
        { key: 'date', label: 'Date' },
        { key: 'building_name', label: 'Building' },
        { key: 'total_eggs', label: 'Total Eggs' },
        { key: 'good_eggs', label: 'Good Eggs' },
        { key: 'cracked_eggs', label: 'Cracked Eggs' },
    ],
    formFields: [
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'building_id', label: 'Building', type: 'text' },
        { key: 'total_eggs', label: 'Total Eggs', type: 'number' },
        { key: 'good_eggs', label: 'Good Eggs', type: 'number' },
        { key: 'cracked_eggs', label: 'Cracked Eggs', type: 'number' },
    ],
};
