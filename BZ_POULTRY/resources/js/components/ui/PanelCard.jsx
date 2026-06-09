export default function PanelCard({ title, actionLabel, onAction, children, className = '' }) {
    return (
        <div className={`panel-card ${className}`}>
            {(title || actionLabel) && (
                <div className="panel-card-header">
                    {title && <h3>{title}</h3>}
                    {actionLabel && (
                        <button type="button" className="panel-link" onClick={onAction}>{actionLabel}</button>
                    )}
                </div>
            )}
            <div className="panel-card-body">{children}</div>
        </div>
    );
}
