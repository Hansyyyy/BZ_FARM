export default function RowActionButtons({ onView, onEdit }) {
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
        </div>
    );
}
