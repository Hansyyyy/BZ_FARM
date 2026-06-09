export default function SegmentDonut({
    segments = [],
    total,
    centerLabel = 'Total',
    size = 180,
}) {
    const safeSegments = segments.filter((segment) => segment.value > 0);
    const sum = safeSegments.reduce((acc, segment) => acc + segment.value, 0) || 1;
    const displayTotal = total ?? sum;

    let offset = 0;
    const gradientParts = (safeSegments.length ? safeSegments : [{ color: '#e8ece9', value: 1 }]).map((segment) => {
        const pct = (segment.value / sum) * 100;
        const part = `${segment.color} ${offset}% ${offset + pct}%`;
        offset += pct;
        return part;
    });

    const holeSize = Math.round(size * 0.61);

    return (
        <div className="donut-widget">
            <div className="donut-chart-wrap">
                <div
                    className="donut-chart"
                    style={{
                        width: size,
                        height: size,
                        background: `conic-gradient(${gradientParts.join(', ')})`,
                    }}
                >
                    <div className="donut-hole" style={{ width: holeSize, height: holeSize }}>
                        <span className="donut-hole-label">{centerLabel}</span>
                        <strong>{Number(displayTotal).toLocaleString()}</strong>
                    </div>
                </div>
                <ul className="donut-legend">
                    {segments.map((segment) => {
                        const pct = sum > 0 ? ((segment.value / sum) * 100).toFixed(1) : '0.0';

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
