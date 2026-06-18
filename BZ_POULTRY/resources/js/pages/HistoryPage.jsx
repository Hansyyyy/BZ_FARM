import { useState } from 'react';
import { exportTableData } from '../utils/exportData';

const historyBatches = [
    {
        id: 'BATCH-001',
        batchDateIn: '2026-01-10',
        batchEndDate: '2026-05-30',
        cullCount: 18,
        mortalities: 12,
        medications: ['Vitamin AD3E (Jan 15 - Jan 22)', 'Doxycycline (Feb 02 - Feb 07)'],
    },
    {
        id: 'BATCH-002',
        batchDateIn: '2026-03-01',
        batchEndDate: '2026-07-18',
        cullCount: 9,
        mortalities: 6,
        medications: ['Newcastle Vaccine (Mar 05)', 'Multivitamin Boost (Mar 20 - Mar 27)'],
    },
];

const exportColumns = [
    { key: 'id', label: 'Batch' },
    { key: 'batchDateIn', label: 'Date In' },
    { key: 'batchEndDate', label: 'End Date' },
    { key: 'cullCount', label: '# of Cull' },
    { key: 'mortalities', label: 'Mortalities' },
    {
        key: 'medications',
        label: 'Medication History',
        render: (row) => (Array.isArray(row.medications) ? row.medications.join(' | ') : ''),
    },
];

export default function HistoryPage() {
    const [exportError, setExportError] = useState('');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedExportFormat, setSelectedExportFormat] = useState('pdf');

    const handleExport = (format) => {
        try {
            setExportError('');
            exportTableData({
                title: 'Batch History',
                columns: exportColumns,
                rows: historyBatches,
                format,
            });
        } catch (error) {
            setExportError(error?.message || 'Unable to export history data.');
        }
    };

    const openExportModal = () => {
        setExportError('');
        setSelectedExportFormat('pdf');
        setIsExportModalOpen(true);
    };

    const closeExportModal = () => {
        setIsExportModalOpen(false);
    };

    const handleConfirmExport = () => {
        handleExport(selectedExportFormat);
        setIsExportModalOpen(false);
    };

    return (
        <section className="card history-table-card">
            <div className="card-body">
                <div className="history-table-header">
                    <div>
                        <h2 className="history-title">Batch History</h2>
                        <p className="history-subtitle mb-0">
                            Track each batch date-in, end date, cull count, mortalities, and medication timeline.
                        </p>
                    </div>
                    <div className="history-table-actions">
                        <span className="history-batch-count">{historyBatches.length} batches</span>
                        <button type="button" className="btn btn-primary btn-sm" onClick={openExportModal}>
                            Export
                        </button>
                    </div>
                </div>
                {exportError ? <div className="alert-error">{exportError}</div> : null}

                <div className="table-responsive">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Batch</th>
                                <th>Date In</th>
                                <th>End Date</th>
                                <th># of Cull</th>
                                <th>Mortalities</th>
                                <th>Medication History</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyBatches.map((batch) => (
                                <tr key={batch.id}>
                                    <td>
                                        <div className="history-batch-id">{batch.id}</div>
                                    </td>
                                    <td>{batch.batchDateIn}</td>
                                    <td>{batch.batchEndDate}</td>
                                    <td>
                                        <span className="history-pill history-pill-warning">{batch.cullCount}</span>
                                    </td>
                                    <td>
                                        <span className="history-pill history-pill-danger">{batch.mortalities}</span>
                                    </td>
                                    <td>
                                        {batch.medications.length ? (
                                            <div className="history-med-list">
                                                {batch.medications.map((med) => (
                                                    <span className="history-med-tag" key={`${batch.id}-${med}`}>
                                                        {med}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted">No medication records</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isExportModalOpen ? (
                <div className="modal-overlay show" role="dialog" aria-modal="true" aria-labelledby="history-export-title">
                    <div className="modal history-export-modal">
                        <div className="history-export-header">
                            <h3 id="history-export-title" className="history-export-title">Export Batch History</h3>
                            <button type="button" className="history-export-close" onClick={closeExportModal} aria-label="Close export modal">
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <p className="history-export-subtitle">Choose how you want to export your batch history.</p>

                        <div className="history-export-grid">
                            <button
                                type="button"
                                className={`history-export-option ${selectedExportFormat === 'pdf' ? 'active' : ''}`}
                                onClick={() => setSelectedExportFormat('pdf')}
                            >
                                <i className="bi bi-file-earmark-pdf history-export-icon"></i>
                                <span className="history-export-option-title">PDF</span>
                                <span className="history-export-option-desc">Save as PDF document</span>
                            </button>

                            <button
                                type="button"
                                className={`history-export-option ${selectedExportFormat === 'csv' ? 'active' : ''}`}
                                onClick={() => setSelectedExportFormat('csv')}
                            >
                                <i className="bi bi-file-earmark-spreadsheet history-export-icon"></i>
                                <span className="history-export-option-title">CSV</span>
                                <span className="history-export-option-desc">Download spreadsheet file</span>
                            </button>

                            <button
                                type="button"
                                className={`history-export-option ${selectedExportFormat === 'print' ? 'active' : ''}`}
                                onClick={() => setSelectedExportFormat('print')}
                            >
                                <i className="bi bi-printer history-export-icon"></i>
                                <span className="history-export-option-title">Print</span>
                                <span className="history-export-option-desc">Send table to printer</span>
                            </button>
                        </div>

                        <div className="history-export-footer">
                            <button type="button" className="btn btn-outline" onClick={closeExportModal}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-primary history-export-confirm-btn" onClick={handleConfirmExport}>
                                <i className="bi bi-file-earmark-arrow-down"></i>
                                {selectedExportFormat === 'print'
                                    ? 'Print Table'
                                    : selectedExportFormat === 'csv'
                                        ? 'Export CSV'
                                        : 'Export PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}
