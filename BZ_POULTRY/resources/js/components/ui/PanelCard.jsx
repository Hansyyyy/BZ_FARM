import { Link } from 'react-router-dom';

export default function PanelCard({ title, subtitle, actionLabel, actionTo, onAction, children, className = '', icon }) {
    const action = actionLabel && (actionTo ? (
        <Link to={actionTo} className="panel-link">{actionLabel}</Link>
    ) : onAction ? (
        <button type="button" className="panel-link" onClick={onAction}>{actionLabel}</button>
    ) : null);

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
                    {action}
                </div>
            )}
            <div className="panel-card-body">{children}</div>
        </div>
    );
}
