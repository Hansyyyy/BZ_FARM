export default function LineChart({
    data = [],
    valueKey = 'value',
    labelKey = 'label',
    color = '#2d6a4f',
    emptyLabel = 'No data yet',
    height = 200,
}) {
    const values = data.map((item) => Number(item[valueKey]) || 0);
    const max = Math.max(...values, 1);
    const hasData = values.some((value) => value > 0);

    if (!hasData) {
        return <div className="chart-empty">{emptyLabel}</div>;
    }

    const points = data.map((item, index) => {
        const value = Number(item[valueKey]) || 0;
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((value / max) * 100);
        return `${x},${y}`;
    }).join(' ');

    const areaPoints = `0,100 ${points} 100,100`;

    return (
        <div className="line-chart" style={{ height: `${height}px` }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="line-chart-svg">
                <defs>
                    <linearGradient id={`line-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon
                    points={areaPoints}
                    fill={`url(#line-gradient-${color})`}
                    className="line-chart-area"
                />
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    className="line-chart-line"
                />
                {data.map((item, index) => {
                    const value = Number(item[valueKey]) || 0;
                    const x = (index / (data.length - 1)) * 100;
                    const y = 100 - ((value / max) * 100);
                    return (
                        <circle
                            key={`${item[labelKey]}-${index}`}
                            cx={x}
                            cy={y}
                            r="2"
                            fill={color}
                            className="line-chart-point"
                        />
                    );
                })}
            </svg>
            <div className="line-chart-labels">
                {data.map((item, index) => (
                    <div key={`${item[labelKey]}-${index}`} className="line-chart-label">
                        {item[labelKey]}
                    </div>
                ))}
            </div>
        </div>
    );
}
