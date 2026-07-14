import FormLabel from './FormLabel';

export default function FarmSettingsForm({ settings, onChange, onSubmit }) {
    return (
        <form onSubmit={onSubmit}>
            <div className="form-group">
                <FormLabel htmlFor="farm-name" required>Farm Name</FormLabel>
                <input id="farm-name" className="form-control" value={settings.farm_name || ''} onChange={(e) => onChange('farm_name', e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-success">Save Settings</button>
        </form>
    );
}
