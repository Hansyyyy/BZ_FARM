import { useEffect, useState } from 'react';
import axios from 'axios';

export default function SettingsPage() {
    const [settings, setSettings] = useState({});
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', username: '', email: '', password: '', role: 'manager' });

    useEffect(() => {
        axios.get('/api/settings').then((response) => {
            setSettings(response.data.settings || {});
            setUsers(response.data.users || []);
        }).catch((err) => setError(err.message)).finally(() => setLoading(false));
    }, []);

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
            const response = await axios.get('/api/settings');
            setUsers(response.data.users || []);
            setMessage('User added successfully.');
        } catch (err) {
            setError(err.message);
        }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm('Delete this user?')) return;
        try {
            await axios.delete(`/api/settings/users/${userId}`);
            setUsers(users.filter((u) => u.id !== userId));
            setMessage('User deleted successfully.');
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <p>Loading settings...</p>;
    if (error) return <div className="alert-error">{error}</div>;

    return (
        <>
            <div className="card">
                <div className="card-header"><h3>Farm Settings</h3></div>
                <div className="card-body">
                    {message && <div className="alert-success">{message}</div>}
                    <form onSubmit={update}>
                        <div className="form-group"><label>Farm Name</label><input className="form-control" value={settings.farm_name || ''} onChange={(e) => setSettings({ ...settings, farm_name: e.target.value })} required /></div>
                        <div className="form-group"><label>Owner Name</label><input className="form-control" value={settings.owner_name || ''} onChange={(e) => setSettings({ ...settings, owner_name: e.target.value })} /></div>
                        <div className="form-group"><label>Phone</label><input className="form-control" value={settings.phone || ''} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} /></div>
                        <div className="form-group"><label>Email</label><input type="email" className="form-control" value={settings.email || ''} onChange={(e) => setSettings({ ...settings, email: e.target.value })} /></div>
                        <div className="form-group"><label>Address</label><textarea className="form-control" value={settings.address || ''} onChange={(e) => setSettings({ ...settings, address: e.target.value })}></textarea></div>
                        <button type="submit" className="btn btn-success">Save Settings</button>
                    </form>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <h3 style={{ margin: 0 }}>Users</h3>
                        <button className="btn btn-success btn-sm" onClick={() => setShowAddUser(true)}><i className="bi bi-plus-lg"></i> Add User</button>
                    </div>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
                            <tbody>
                                {users.length ? users.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.name}</td>
                                        <td>{user.username}</td>
                                        <td>{user.email}</td>
                                        <td><span className={`status-badge status-${user.role}`}>{user.role}</span></td>
                                        <td><button className="action-btn delete" onClick={() => deleteUser(user.id)}><i className="bi bi-trash"></i></button></td>
                                    </tr>
                                )) : <tr><td colSpan="5">No users found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showAddUser && (
                <div className="modal-overlay show" onClick={(e) => e.target === e.currentTarget && setShowAddUser(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Add User</h3>
                            <button className="action-btn" onClick={() => setShowAddUser(false)}><i className="bi bi-x-lg"></i></button>
                        </div>
                        <form onSubmit={addUser}>
                            <div className="modal-body">
                                <div className="form-group"><label>Name</label><input className="form-control" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required /></div>
                                <div className="form-group"><label>Username</label><input className="form-control" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required /></div>
                                <div className="form-group"><label>Email</label><input type="email" className="form-control" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required /></div>
                                <div className="form-group"><label>Password</label><input type="password" className="form-control" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required /></div>
                                <div className="form-group"><label>Role</label><select className="form-control" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}><option value="manager">Manager</option><option value="admin">Admin</option></select></div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowAddUser(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success">Add User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
