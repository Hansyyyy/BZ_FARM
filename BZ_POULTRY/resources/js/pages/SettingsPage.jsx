import { useEffect, useState } from 'react';
import axios from 'axios';
import useFetch from '../hooks/useFetch';
import PageState from '../components/ui/PageState';
import PanelCard from '../components/ui/PanelCard';
import Modal from '../components/ui/Modal';
import FarmSettingsForm from '../components/forms/FarmSettingsForm';
import UserForm from '../components/forms/UserForm';

export default function SettingsPage() {
    const { data, loading, error, reload, setError } = useFetch('/api/settings');
    const [settings, setSettings] = useState({});
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState(null);
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', username: '', email: '', password: '', role: 'manager' });

    useEffect(() => {
        if (data) {
            setSettings(data.settings || {});
            setUsers(data.users || []);
        }
    }, [data]);

    const updateSettingsField = (key, value) => setSettings((previous) => ({ ...previous, [key]: value }));
    const updateUserField = (key, value) => setNewUser((previous) => ({ ...previous, [key]: value }));

    const update = async (event) => {
        event.preventDefault();
        try {
            await axios.post('/api/settings', settings);
            setMessage('Settings updated successfully.');
        } catch (err) {
            setError(err.message);
        }
    };

    const addUser = async (event) => {
        event.preventDefault();
        try {
            await axios.post('/api/settings/users', newUser);
            setShowAddUser(false);
            setNewUser({ name: '', username: '', email: '', password: '', role: 'manager' });
            const response = await reload();
            setSettings(response.settings || {});
            setUsers(response.users || []);
            setMessage('User added successfully.');
        } catch (err) {
            setError(err.message);
        }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm('Delete this user?')) return;
        try {
            await axios.delete(`/api/settings/users/${userId}`);
            setUsers((previous) => previous.filter((user) => user.id !== userId));
            setMessage('User deleted successfully.');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <PageState loading={loading} error={error} loadingLabel="Loading settings...">
            <PanelCard title="Farm Settings">
                {message && <div className="alert-success">{message}</div>}
                <FarmSettingsForm settings={settings} onChange={updateSettingsField} onSubmit={update} />
            </PanelCard>

            <div className="data-panel">
                <div className="data-panel-toolbar">
                    <div className="data-panel-title" style={{ margin: 0 }}>Users</div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowAddUser(true)}>
                        <i className="bi bi-plus-lg"></i> Add User
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="data-table mockup-table">
                        <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
                        <tbody>
                            {users.length ? users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.name}</td>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td><span className={`status-pill status-${user.role}`}>{user.role}</span></td>
                                    <td>
                                        <button type="button" className="action-btn delete" onClick={() => deleteUser(user.id)}>
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="5">No users found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal open={showAddUser} title="Add User" size="landscape" onClose={() => setShowAddUser(false)} actions={(
                <>
                    <button type="button" className="btn btn-outline" onClick={() => setShowAddUser(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" form="add-user-form">Add User</button>
                </>
            )}>
                <UserForm id="add-user-form" user={newUser} onChange={updateUserField} onSubmit={addUser} />
            </Modal>
        </PageState>
    );
}
