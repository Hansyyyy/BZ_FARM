import FormLabel from './FormLabel';

export default function FarmSettingsForm({ settings, onChange, onSubmit }) {
    return (
        <form onSubmit={onSubmit}>
            <p className="form-required-note">
                Fields marked with <span className="form-required-mark">*</span> are required.
            </p>
            <div className="form-group">
                <FormLabel htmlFor="farm-name" required>Farm Name</FormLabel>
                <input id="farm-name" className="form-control" value={settings.farm_name || ''} onChange={(e) => onChange('farm_name', e.target.value)} required />
            </div>
            <div className="form-group">
                <FormLabel htmlFor="owner-name">Owner Name</FormLabel>
                <input id="owner-name" className="form-control" value={settings.owner_name || ''} onChange={(e) => onChange('owner_name', e.target.value)} />
            </div>
            <div className="form-group">
                <FormLabel htmlFor="farm-phone">Phone</FormLabel>
                <input id="farm-phone" className="form-control" value={settings.phone || ''} onChange={(e) => onChange('phone', e.target.value)} />
            </div>
            <div className="form-group">
                <FormLabel htmlFor="farm-email">Email</FormLabel>
                <input id="farm-email" type="email" className="form-control" value={settings.email || ''} onChange={(e) => onChange('email', e.target.value)} />
            </div>
            <div className="form-group">
                <FormLabel htmlFor="farm-address">Address</FormLabel>
                <textarea id="farm-address" className="form-control" value={settings.address || ''} onChange={(e) => onChange('address', e.target.value)} rows={3} />
            </div>
            <button type="submit" className="btn btn-success">Save Settings</button>
        </form>
    );
}
