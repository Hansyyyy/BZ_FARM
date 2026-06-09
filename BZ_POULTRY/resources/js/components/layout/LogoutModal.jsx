import Modal from '../ui/Modal';

export default function LogoutModal({ open, onClose }) {
    return (
        <Modal
            open={open}
            title="Logout"
            onClose={onClose}
            size="compact"
            actions={(
                <>
                    <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                    <form method="POST" action="/logout" className="logout-form">
                        <input type="hidden" name="_token" value={window.Laravel.csrfToken} />
                        <button type="submit" className="btn btn-danger">Logout</button>
                    </form>
                </>
            )}
        >
            <p>Are you sure you want to logout?</p>
        </Modal>
    );
}
