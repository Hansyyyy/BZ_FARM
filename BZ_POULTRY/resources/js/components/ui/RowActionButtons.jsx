export default function RowActionButtons({ onView, onEdit }) {
    return (
        <div className="row-actions">
            {onView && (
                <button type="button" className="btn btn-outline" onClick={onView}>
                    View
                </button>
            )}
            {onEdit && (
                <button type="button" className="btn btn-primary" onClick={onEdit}>
                    Edit
                </button>
            )}
        </div>
    );
}
