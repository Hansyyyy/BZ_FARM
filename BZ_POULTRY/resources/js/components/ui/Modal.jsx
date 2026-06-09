export default function Modal({ open, title, onClose, children, actions, size = 'default' }) {
    if (!open) {
        return null;
    }

    const modalClass = [
        'modal',
        size === 'landscape' ? 'modal-landscape' : '',
        size === 'compact' ? 'modal-compact' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className="modal-overlay show" onClick={(event) => event.target === event.currentTarget && onClose()}>
            <div className={modalClass}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button type="button" className="action-btn" onClick={onClose} aria-label="Close">
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div className="modal-body">{children}</div>
                {actions && <div className="modal-footer">{actions}</div>}
            </div>
        </div>
    );
}
