export default function UserForm({ id, user, onChange, onSubmit }) {
    return (
        <form id={id} onSubmit={onSubmit}>
            <div className="modal-form-grid">
                <div className="form-group">
                    <label>Name</label>
                    <input className="form-control" value={user.name} onChange={(e) => onChange('name', e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Username</label>
                    <input className="form-control" value={user.username} onChange={(e) => onChange('username', e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input type="email" className="form-control" value={user.email} onChange={(e) => onChange('email', e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input type="password" className="form-control" value={user.password} onChange={(e) => onChange('password', e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Role</label>
                    <select className="form-control" value={user.role} onChange={(e) => onChange('role', e.target.value)}>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>
        </form>
    );
}
