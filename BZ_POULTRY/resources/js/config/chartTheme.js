export const chartColors = {
    primary: '#1f7d47',
    secondary: '#40916c',
    tertiary: '#52b788',
    quaternary: '#95d5b2',
    layers: '#1f7d47',
    pullets: '#f4b942',
    roosters: '#4a90d9',
    softShell: '#f59e0b',
    damaged: '#d93f45',
    cracked: '#9333ea',
    gradeAa: '#2d9d5f',
    gradeA: '#2563eb',
    gradeB: '#f59e0b',
    dirty: '#d93f45',
    bar: '#1f7d47',
};

export const inventoryLabels = {
    feed: 'Feed',
    medicine: 'Medicine',
    supplies: 'Supplies',
    others: 'Others',
};

const inventoryColorMap = {
    feed: chartColors.primary,
    medicine: chartColors.secondary,
    supplies: chartColors.tertiary,
    others: chartColors.quaternary,
};

export function buildInventorySegments(breakdown = {}) {
    return Object.entries(breakdown).map(([key, value]) => ({
        key,
        label: inventoryLabels[key] || key,
        value: Number(value) || 0,
        color: inventoryColorMap[key] || chartColors.primary,
    }));
}

export function buildFlockSegments(distribution = {}) {
    return [
        { key: 'layers', label: 'Layers', value: distribution.layers || 0, color: chartColors.layers },
        { key: 'pullets', label: 'Pullets', value: distribution.pullets || 0, color: chartColors.pullets },
        { key: 'roosters', label: 'Roosters', value: distribution.roosters || 0, color: chartColors.roosters },
    ];
}

export function buildEggQualitySegments(eggQuality = {}) {
    return [
        { key: 'soft_shell', label: 'Soft Shell', value: eggQuality.soft_shell || 0, color: chartColors.softShell },
        { key: 'damaged', label: 'Damaged', value: eggQuality.damaged || 0, color: chartColors.damaged },
        { key: 'cracked', label: 'Cracked', value: eggQuality.cracked || 0, color: chartColors.cracked },
    ];
}

export function buildEggSummaryBars(eggSummary = {}) {
    return [
        { label: 'Today', value: eggSummary.today, suffix: 'eggs', color: chartColors.primary },
        { label: 'This Week', value: eggSummary.week, suffix: 'eggs', color: chartColors.secondary },
        { label: 'This Month', value: eggSummary.month, suffix: 'eggs', color: chartColors.tertiary },
        { label: 'Daily Average', value: eggSummary.daily_avg, suffix: 'eggs', color: chartColors.quaternary },
    ];
}

export function buildGradeSegments(breakdown = []) {
    const colorMap = {
        sellable: chartColors.gradeAa,
        soft_shell: chartColors.softShell,
        damaged: chartColors.damaged,
        cracked: chartColors.cracked,
        grade_aa: chartColors.gradeAa,
        grade_a: chartColors.gradeA,
        grade_b: chartColors.gradeB,
        dirty: chartColors.damaged,
    };

    return breakdown.map((grade) => ({
        key: grade.key,
        label: grade.label,
        value: grade.value || 0,
        color: colorMap[grade.key] || chartColors.primary,
    }));
}
