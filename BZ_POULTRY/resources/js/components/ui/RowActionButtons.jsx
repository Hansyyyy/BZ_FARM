export default function RowActionButtons({ onView, onEdit }) {
    return (
        <div className="row-actions">
            {onView && (
                <button type="button" className="row-action-btn row-action-view" onClick={onView}>
                    View
                </button>
            )}
            {onEdit && (
                <button type="button" className="row-action-btn row-action-edit" onClick={onEdit}>
                    Edit
                </button>
            )}
        </div>
    );
}
