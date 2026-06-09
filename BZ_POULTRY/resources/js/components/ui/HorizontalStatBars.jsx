export default function HorizontalStatBars({ items = [] }) {
    const max = Math.max(...items.map((item) => Number(item.value) || 0), 1);

    return (
        <ul className="stat-bars">
            {items.map((item) => {
                const value = Number(item.value) || 0;
                const width = max > 0 ? (value / max) * 100 : 0;

                return (
                    <li key={item.label} className="stat-bar-row">
                        <div className="stat-bar-head">
                            <span>{item.label}</span>
                            <strong>{value.toLocaleString()}{item.suffix ? ` ${item.suffix}` : ''}</strong>
                        </div>
                        <div className="stat-bar-track">
                            <span
                                className="stat-bar-fill"
                                style={{ width: `${width}%`, background: item.color || 'var(--primary)' }}
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
