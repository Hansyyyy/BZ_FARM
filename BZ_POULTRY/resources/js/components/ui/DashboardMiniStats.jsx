export default function DashboardMiniStats({ items = [] }) {
    if (!items.length) {
        return null;
    }

    return (
        <div className="dashboard-mini-stats">
            {items.map((item) => (
                <div className={`dashboard-mini-stat tone-${item.tone || 'default'}`} key={item.key}>
                    <span className="dashboard-mini-stat-icon">
                        <i className={`bi ${item.icon}`}></i>
                    </span>
                    <div className="dashboard-mini-stat-content">
                        <span className="dashboard-mini-stat-label">{item.label}</span>
                        <strong className="dashboard-mini-stat-value">
                            {item.prefix || ''}{Number(item.value ?? 0).toLocaleString()}{item.suffix || ''}
                        </strong>
                        {item.hint && <span className="dashboard-mini-stat-hint">{item.hint}</span>}
                    </div>
                </div>
            ))}
        </div>
    );
}
