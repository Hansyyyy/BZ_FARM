export default function VerticalBarChart({
    data = [],
    valueKey = 'total',
    labelKey = 'label',
    color = '#2d6a4f',
    emptyLabel = 'No data yet',
}) {
    const values = data.map((item) => Number(item[valueKey]) || 0);
    const max = Math.max(...values, 1);
    const hasData = values.some((value) => value > 0);

    if (!hasData) {
        return <div className="chart-empty">{emptyLabel}</div>;
    }

    return (
        <div className="vbar-chart">
            {data.map((item, index) => {
                const value = Number(item[valueKey]) || 0;
                const height = Math.max((value / max) * 100, value > 0 ? 8 : 0);

                return (
                    <div key={`${item[labelKey]}-${index}`} className="vbar-chart-col">
                        <div className="vbar-chart-value">{value.toLocaleString()}</div>
                        <div className="vbar-chart-track">
                            <span
                                className="vbar-chart-fill"
                                style={{ height: `${height}%`, background: color }}
                                title={`${item[labelKey]}: ${value.toLocaleString()}`}
                            />
                        </div>
                        <div className="vbar-chart-label">{item[labelKey]}</div>
                    </div>
                );
            })}
        </div>
    );
}
