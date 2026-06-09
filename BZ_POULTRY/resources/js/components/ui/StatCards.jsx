export default function StatCards({ fields, summary }) {
    return (
        <div className="stat-cards">
            {fields.map((field) => (
                <div className="stat-card" key={field.key}>
                    <div className="label">{field.label}</div>
                    <div className="value">{summary?.[field.key] ?? 0}</div>
                </div>
            ))}
        </div>
    );
}
