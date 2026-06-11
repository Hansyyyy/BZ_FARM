import { MEDICATION_AGE_WEEKS } from '../../config/medicationAlerts';

export default function MedicationNoticeBanner({
    flocks = [],
    onGoToMedicine,
    onDismiss,
}) {
    if (!flocks.length) {
        return null;
    }

    const flockLabels = flocks.map((flock) => flock.batch_no).join(', ');

    return (
        <div className="medication-notice-banner" role="status">
            <div className="medication-notice-icon">
                <i className="bi bi-capsule"></i>
            </div>
            <div className="medication-notice-content">
                <strong>Medication due</strong>
                <p>
                    {flocks.length === 1 ? (
                        <>
                            <strong>{flocks[0].batch_no}</strong> is {flocks[0].age_weeks} week(s) old.
                        </>
                    ) : (
                        <>
                            <strong>{flocks.length} active flocks</strong> ({flockLabels}) are
                        </>
                    )}
                    {' '}
                    {flocks.length === 1 ? 'and needs' : 'at'}
                    {' '}
                    <strong>{MEDICATION_AGE_WEEKS} weeks or older</strong>
                    {flocks.length === 1 ? '' : ' and need'}
                    {' '}
                    medication and vaccination.
                </p>
            </div>
            <div className="medication-notice-actions">
                <button type="button" className="btn btn-primary btn-sm" onClick={onGoToMedicine}>
                    Open Medicine &amp; Vaccine
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={onDismiss} aria-label="Dismiss">
                    Dismiss
                </button>
            </div>
        </div>
    );
}
