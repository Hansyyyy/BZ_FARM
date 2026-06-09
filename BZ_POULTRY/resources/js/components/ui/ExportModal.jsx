import { useEffect, useState } from 'react';
import Modal from './Modal';

const formats = [
    {
        value: 'pdf',
        label: 'PDF',
        hint: 'Print-ready document',
        icon: 'bi-file-earmark-pdf',
    },
    {
        value: 'csv',
        label: 'CSV',
        hint: 'Spreadsheet data file',
        icon: 'bi-file-earmark-spreadsheet',
    },
];

export default function ExportModal({ open, title, description, onClose, onExport }) {
    const [format, setFormat] = useState('pdf');

    useEffect(() => {
        if (open) {
            setFormat('pdf');
        }
    }, [open]);

    const handleExport = () => {
        onExport?.(format);
        onClose();
    };

    return (
        <Modal
            open={open}
            title={title}
            onClose={onClose}
            size="landscape"
            actions={(
                <>
                    <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                    <button type="button" className="btn btn-success" onClick={handleExport}>
                        <i className="bi bi-download"></i> Export {format.toUpperCase()}
                    </button>
                </>
            )}
        >
            <p className="export-modal-desc">{description}</p>
            <div className="export-format-grid">
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
