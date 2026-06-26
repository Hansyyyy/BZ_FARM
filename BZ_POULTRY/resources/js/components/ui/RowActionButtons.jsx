export default function RowActionButtons({ onView, onEdit, onClose, closeLabel = 'Close Batch' }) {
    return (
        <div className="row-actions">
            {onView && (
                <button type="button" className="btn btn-outline btn-row-action" onClick={onView}>
                    View
                </button>
            )}
            {onEdit && (
                <button type="button" className="btn btn-primary btn-row-action" onClick={onEdit}>
                    Edit
                </button>
            )}
            {onClose && (
                <button type="button" className="btn btn-outline btn-row-action btn-row-action--warn" onClick={onClose}>
                    {closeLabel}
                </button>
            )}
        </div>
    );
}
