export default function SummaryCards({ fields, summary = {}, items = null, columns = 5, onCardClick = null }) {
    const cardItems = items || fields.map((field) => {
        const value = summary[field.key] ?? 0;
        let sub = field.sub || '';

        if (field.percentOf && summary[field.percentOf]) {
            const total = Number(summary[field.percentOf]) || 0;
            const pct = total ? ((Number(value) / total) * 100).toFixed(1) : '0.0';
            sub = `${pct}% of Total`;
        }

        return {
            key: field.key,
            label: field.label,
            value: Number(value).toLocaleString(),
            sub,
            tone: field.tone || 'default',
            icon: field.icon,
        };
    });

    return (
        <div className={`summary-cards summary-cols-${columns}`}>
            {cardItems.map((item) => (
                <div
                    className={`summary-card tone-${item.tone || 'default'}${onCardClick ? ' cursor-pointer' : ''}`}
                    key={item.key || item.label}
                    onClick={() => onCardClick && onCardClick(item.key || item.label)}
                    style={onCardClick ? { cursor: 'pointer' } : {}}
                >
                    <div className="summary-card-top">
                        {item.icon && <span className="summary-card-icon"><i className={`bi ${item.icon}`}></i></span>}
                        <div className="summary-card-label">{item.label}</div>
                    </div>
                    <div className="summary-card-value">{item.value}</div>
                    {item.sub && <div className="summary-card-sub">{item.sub}</div>}
                </div>
            ))}
        </div>
    );
}
