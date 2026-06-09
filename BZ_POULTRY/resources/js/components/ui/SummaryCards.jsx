export default function SummaryCards({ fields, summary = {} }) {
    return (
        <div className="summary-cards">
            {fields.map((field) => {
                const value = summary[field.key] ?? 0;
                let sub = field.sub || '';

                if (field.percentOf && summary[field.percentOf]) {
                    const total = Number(summary[field.percentOf]) || 0;
                    const pct = total ? ((Number(value) / total) * 100).toFixed(1) : '0.0';
                    sub = `${pct}% of Total`;
                }

                return (
                    <div className="summary-card" key={field.key}>
                        <div className="summary-card-label">{field.label}</div>
                        <div className="summary-card-value">{Number(value).toLocaleString()}</div>
                        {sub && <div className="summary-card-sub">{sub}</div>}
                    </div>
                );
            })}
        </div>
    );
}
