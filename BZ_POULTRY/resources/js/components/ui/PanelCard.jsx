export default function PanelCard({ title, subtitle, actionLabel, onAction, children, className = '', icon }) {
    return (
        <div className={`panel-card ${className}`}>
            {(title || actionLabel) && (
                <div className="panel-card-header">
                    <div className="panel-card-heading">
                        {icon && <span className="panel-card-icon"><i className={`bi ${icon}`}></i></span>}
                        <div>
                            {title && <h3>{title}</h3>}
                            {subtitle && <p>{subtitle}</p>}
                        </div>
                    </div>
                    {actionLabel && onAction && (
                        <button type="button" className="panel-link" onClick={onAction}>{actionLabel}</button>
                    )}
                </div>
            )}
            <div className="panel-card-body">{children}</div>
        </div>
    );
}
