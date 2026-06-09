export default function FarmSettingsForm({ settings, onChange, onSubmit }) {
    return (
        <form onSubmit={onSubmit}>
            <div className="form-group">
                <label>Farm Name</label>
                <input className="form-control" value={settings.farm_name || ''} onChange={(e) => onChange('farm_name', e.target.value)} required />
            </div>
            <div className="form-group">
                <label>Owner Name</label>
                <input className="form-control" value={settings.owner_name || ''} onChange={(e) => onChange('owner_name', e.target.value)} />
            </div>
            <div className="form-group">
                <label>Phone</label>
                <input className="form-control" value={settings.phone || ''} onChange={(e) => onChange('phone', e.target.value)} />
            </div>
            <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-control" value={settings.email || ''} onChange={(e) => onChange('email', e.target.value)} />
            </div>
            <div className="form-group">
                <label>Address</label>
                <textarea className="form-control" value={settings.address || ''} onChange={(e) => onChange('address', e.target.value)}></textarea>
            </div>
            <button type="submit" className="btn btn-success">Save Settings</button>
        </form>
    );
}
