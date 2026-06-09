import { useEffect, useState } from 'react';
import Modal from './Modal';
import Loading from './Loading';

export default function ConfirmModal({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    loadingLabel = 'Deleting...',
    confirmClassName = 'btn btn-danger',
    onClose,
    onConfirm,
}) {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            setLoading(false);
        }
    }, [open]);

    const handleClose = () => {
        if (loading) {
            return;
        }

        onClose?.();
    };

    const handleConfirm = async () => {
        setLoading(true);

        try {
            await onConfirm?.();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            title={title}
            onClose={handleClose}
            size="compact"
            actions={loading ? null : (
                <>
                    <button type="button" className="btn btn-outline" onClick={handleClose}>Cancel</button>
                    <button type="button" className={confirmClassName} onClick={handleConfirm}>{confirmLabel}</button>
                </>
            )}
        >
            {loading ? (
                <div className="modal-loading">
                    <Loading label={loadingLabel} />
                </div>
            ) : (
                <p>{message}</p>
            )}
        </Modal>
    );
}
