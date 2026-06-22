import { useEffect, useState } from 'react';
import Modal from './Modal';

const preparedByOptions = [
    'Jonel Carpio',
    'Ms. ChinChin',
    'Ms. Jailyn',
];

const formats = [
    {
        value: 'pdf',
        label: 'PDF',
        hint: 'Save as PDF document',
        icon: 'bi-file-earmark-pdf',
        actionLabel: 'Export PDF',
    },
    {
        value: 'csv',
        label: 'CSV',
        hint: 'Download spreadsheet file',
        icon: 'bi-file-earmark-spreadsheet',
        actionLabel: 'Download CSV',
    },
    {
        value: 'print',
        label: 'Print',
        hint: 'Send table to printer',
        icon: 'bi-printer',
        actionLabel: 'Print',
    },
];

export default function ExportModal({ open, title, description, onClose, onExport }) {
    const [format, setFormat] = useState('pdf');
    const [preparedBy, setPreparedBy] = useState(preparedByOptions[0]);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (open) {
            setFormat('pdf');
            setPreparedBy(preparedByOptions[0]);
            setExporting(false);
            setError(null);
        }
    }, [open]);

    const selectedFormat = formats.find((option) => option.value === format) || formats[0];

    const handleExport = async () => {
        setExporting(true);
        setError(null);

        try {
            await onExport?.(format, preparedBy);
            onClose();
        } catch (err) {
            setError(err.message || 'Export failed.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <Modal
            open={open}
            title={title}
            onClose={onClose}
            size="landscape"
            actions={(
                <>
                    <button type="button" className="btn btn-outline" onClick={onClose} disabled={exporting}>Cancel</button>
                    <button type="button" className="btn btn-success" onClick={handleExport} disabled={exporting}>
                        <i className={`bi ${selectedFormat.icon}`}></i>
                        {exporting ? 'Processing...' : selectedFormat.actionLabel}
                    </button>
                </>
            )}
        >
            <p className="export-modal-desc">{description}</p>
            {error && <div className="alert-error">{error}</div>}

            <div className="form-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="prepared-by-select" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                    Prepared by
                </label>
                <select
                    id="prepared-by-select"
                    className="form-control"
                    value={preparedBy}
                    onChange={(event) => setPreparedBy(event.target.value)}
                    disabled={exporting}
                >
                    {preparedByOptions.map((name) => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
            </div>

            <div className="export-format-grid export-format-grid-3">
                {formats.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        className={`export-format-card ${format === option.value ? 'selected' : ''}`}
                        onClick={() => setFormat(option.value)}
                    >
                        <i className={`bi ${option.icon}`}></i>
                        <span className="export-format-name">{option.label}</span>
                        <span className="export-format-hint">{option.hint}</span>
                    </button>
                ))}
            </div>
        </Modal>
    );
}
