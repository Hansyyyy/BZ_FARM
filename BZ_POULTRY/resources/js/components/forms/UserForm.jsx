import FormLabel from './FormLabel';

export default function UserForm({ id, user, onChange, onSubmit }) {
    return (
        <form id={id} onSubmit={onSubmit}>
            <p className="form-required-note">
                Fields marked with <span className="form-required-mark">*</span> are required.
            </p>
            <div className="modal-form-grid">
                <div className="form-group">
                    <FormLabel htmlFor="user-name" required>Name</FormLabel>
                    <input id="user-name" className="form-control" value={user.name} onChange={(e) => onChange('name', e.target.value)} required />
                </div>
                <div className="form-group">
                    <FormLabel htmlFor="user-username" required>Username</FormLabel>
                    <input id="user-username" className="form-control" value={user.username} onChange={(e) => onChange('username', e.target.value)} required />
                </div>
                <div className="form-group">
                    <FormLabel htmlFor="user-email" required>Email</FormLabel>
                    <input id="user-email" type="email" className="form-control" value={user.email} onChange={(e) => onChange('email', e.target.value)} required />
                </div>
                <div className="form-group">
                    <FormLabel htmlFor="user-password" required>Password</FormLabel>
                    <input id="user-password" type="password" className="form-control" value={user.password} onChange={(e) => onChange('password', e.target.value)} required minLength={6} />
                </div>
                <div className="form-group">
                    <FormLabel htmlFor="user-role" required>Role</FormLabel>
                    <select id="user-role" className="form-control" value={user.role} onChange={(e) => onChange('role', e.target.value)} required>
                        <option value="" disabled>Select role</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>
        </form>
    );
}
