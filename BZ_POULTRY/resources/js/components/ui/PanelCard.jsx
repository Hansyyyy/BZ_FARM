import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PanelCard({
    title,
    subtitle,
    actionLabel,
    actionTo,
    onAction,
    children,
    className = '',
    icon,
    collapsible = false,
    defaultCollapsed = false,
}) {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);

    const action = actionLabel && (actionTo ? (
        <Link to={actionTo} className="panel-link">{actionLabel}</Link>
    ) : onAction ? (
        <button type="button" className="panel-link" onClick={onAction}>{actionLabel}</button>
    ) : null);

    const toggleCollapsed = () => setCollapsed((value) => !value);

    const headerActions = (
        <div className="panel-card-actions" onClick={(event) => event.stopPropagation()}>
            {action}
            {collapsible && (
                <button
                    type="button"
                    className="panel-collapse-btn"
                    onClick={toggleCollapsed}
                    aria-expanded={!collapsed}
                    aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
                >
                    <i className={`bi bi-chevron-${collapsed ? 'down' : 'up'}`}></i>
                </button>
            )}
        </div>
    );

    return (
        <div className={`panel-card ${collapsed ? 'panel-card-collapsed' : ''} ${className}`}>
            {(title || actionLabel || collapsible) && (
                <div
                    className={`panel-card-header ${collapsible ? 'panel-card-header-clickable' : ''}`}
                    onClick={collapsible ? toggleCollapsed : undefined}
                    onKeyDown={collapsible ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            toggleCollapsed();
                        }
                    } : undefined}
                    role={collapsible ? 'button' : undefined}
                    tabIndex={collapsible ? 0 : undefined}
                >
                    <div className="panel-card-heading">
                        {icon && <span className="panel-card-icon"><i className={`bi ${icon}`}></i></span>}
                        <div>
                            {title && <h3>{title}</h3>}
                            {subtitle && <p>{subtitle}</p>}
                        </div>
                    </div>
                    {(action || collapsible) && headerActions}
                </div>
            )}
            <div className={['panel-card-body', collapsed ? 'is-collapsed' : ''].filter(Boolean).join(' ')}>
                <div className="panel-card-body-inner">{children}</div>
            </div>


        </div>
    );
}
