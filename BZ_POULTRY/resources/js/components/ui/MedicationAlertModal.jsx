import Modal from './Modal';
import { MEDICATION_AGE_WEEKS } from '../../config/medicationAlerts';

export default function MedicationAlertModal({
    open,
    ageWeeks,
    batchNo,
    flocks = [],
    onClose,
    onGoToMedicine,
}) {
    const singleFlock = flocks.length <= 1;
    const displayAge = ageWeeks ?? flocks[0]?.age_weeks;
    const displayBatch = batchNo || flocks[0]?.batch_no || 'this flock';

    return (
        <Modal
            open={open}
            title="Medication Required"
            size="compact"
            onClose={onClose}
            actions={(
                <>
                    <button type="button" className="btn btn-outline" onClick={onClose}>Got it</button>
                    <button type="button" className="btn btn-primary" onClick={onGoToMedicine}>
                        Go to Medicine &amp; Vaccine
                    </button>
                </>
            )}
        >
            <div className="medication-alert-body">
                <div className="medication-alert-icon">
                    <i className="bi bi-capsule"></i>
                </div>
                {singleFlock ? (
                    <p>
                        <strong>{displayBatch}</strong> is <strong>{displayAge} week(s)</strong> old.
                        Chickens at <strong>{MEDICATION_AGE_WEEKS} weeks and above</strong> need medication
                        and vaccination. Please schedule treatment in the Medicine &amp; Vaccine section.
                    </p>
                ) : (
                    <>
                        <p>
                            The following active flocks are <strong>{MEDICATION_AGE_WEEKS} weeks or older</strong>
                            and need medication and vaccination:
                        </p>
                        <ul className="medication-alert-list">
                            {flocks.map((flock) => (
                                <li key={flock.id || flock.batch_no}>
                                    <strong>{flock.batch_no}</strong>
                                    <span>{flock.age_weeks} week(s) · {flock.type}</span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </Modal>
    );
}
