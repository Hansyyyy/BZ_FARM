const colors = {
    layers: '#2d6a4f',
    growers: '#f4b942',
    roosters: '#4a90d9',
};

export default function DonutChart({ distribution = {}, total = 0 }) {
    const segments = [
        { key: 'layers', label: 'Layers', value: distribution.layers || 0, color: colors.layers },
        { key: 'growers', label: 'Growers', value: distribution.growers || 0, color: colors.growers },
        { key: 'roosters', label: 'Roosters', value: distribution.roosters || 0, color: colors.roosters },
    ];

    const sum = segments.reduce((acc, segment) => acc + segment.value, 0) || 1;
    let offset = 0;
    const gradientParts = segments.map((segment) => {
        const pct = (segment.value / sum) * 100;
        const part = `${segment.color} ${offset}% ${offset + pct}%`;
        offset += pct;
        return part;
    });

    return (
        <div className="donut-widget">
            <div className="donut-chart-wrap">
                <div
                    className="donut-chart"
                    style={{ background: `conic-gradient(${gradientParts.join(', ')})` }}
                >
                    <div className="donut-hole">
                        <span className="donut-hole-label">Total</span>
                        <strong>{Number(total).toLocaleString()}</strong>
                    </div>
                </div>
                <ul className="donut-legend">
                    {segments.map((segment) => {
                        const pct = ((segment.value / sum) * 100).toFixed(1);
                        return (
                            <li key={segment.key}>
                                <span className="legend-dot" style={{ background: segment.color }}></span>
                                <span>{segment.label}</span>
                                <strong>{pct}%</strong>
                                <span className="legend-count">{Number(segment.value).toLocaleString()}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
