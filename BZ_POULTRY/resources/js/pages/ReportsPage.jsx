import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import useFetch from '../hooks/useFetch';
import { usePageSearch } from '../context/HeaderSearchContext';
import PageState from '../components/ui/PageState';
import SummaryCards from '../components/ui/SummaryCards';
import PanelCard from '../components/ui/PanelCard';
import Modal from '../components/ui/Modal';
import AnimatedDatePicker from '../components/ui/AnimatedDatePicker';

const isAdmin = window.Laravel?.user?.role === 'admin';

function formatNumber(value) {
    return Number(value || 0).toLocaleString();
}

function formatCurrency(value) {
    return `₱${Number(value || 0).toLocaleString()}`;
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatDateTime(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString();
}

function buildSummaryCards(summary = {}) {
    return [
        { key: 'poultry', label: 'Total Poultry', value: formatNumber(summary.total_poultry), sub: 'Active birds', icon: 'bi-egg-fried' },
        { key: 'eggs', label: 'Eggs Collected', value: formatNumber(summary.eggs_collected), sub: 'For selected date', icon: 'bi-basket' },
        { key: 'sales', label: 'Sales Total', value: formatCurrency(summary.sales_total), sub: `${formatNumber(summary.sales_count)} transactions`, icon: 'bi-cash-stack', tone: 'success' },
        { key: 'defects', label: 'Defect Eggs', value: formatNumber(summary.defect_eggs), sub: 'Soft shell, damaged, cracked', icon: 'bi-exclamation-circle', tone: 'orange' },
    ];
}

function StatusBadge({ status }) {
    const className = status === 'reviewed' ? 'daily-report-status reviewed' : 'daily-report-status submitted';
    const label = status === 'reviewed' ? 'Reviewed' : 'Submitted';

    return <span className={className}>{label}</span>;
}

function SnapshotSections({ snapshot, notes, readOnly = false }) {
    if (!snapshot) {
        return <p className="empty-state">No snapshot data available.</p>;
    }

    return (
        <div className="daily-report-sections">
            {notes && (
                <PanelCard title="Manager Notes" className="daily-report-notes-card">
                    <p className="daily-report-notes-text">{notes}</p>
                </PanelCard>
            )}

            <PanelCard title="Egg Production" subtitle="Collections for this date">
                <div className="table-wrap">
                    <table className="data-table mockup-table">
                        <thead>
                            <tr>
                                <th>Building</th>
                                <th>Total</th>
                                <th>Soft Shell</th>
                                <th>Damaged</th>
                                <th>Cracked</th>
                                <th>Recorded By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {snapshot.egg_production?.length ? snapshot.egg_production.map((row, index) => (
                                <tr key={`${row.building}-${index}`}>
                                    <td>{row.building}</td>
                                    <td>{formatNumber(row.total_eggs)}</td>
                                    <td>{formatNumber(row.soft_shell)}</td>
                                    <td>{formatNumber(row.damaged)}</td>
                                    <td>{formatNumber(row.cracked)}</td>
                                    <td>{row.recorded_by || '—'}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6" className="empty-state">No egg production recorded for this date.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </PanelCard>

            <div className="daily-report-split">
                <PanelCard title="Poultry" subtitle="Active flock snapshot">
                    <div className="table-wrap">
                        <table className="data-table mockup-table">
                            <thead>
                                <tr><th>Batch</th><th>Type</th><th>Qty</th><th>Mortality</th></tr>
                            </thead>
                            <tbody>
                                {snapshot.poultry?.length ? snapshot.poultry.map((row) => (
                                    <tr key={row.batch_no}>
                                        <td>{row.batch_no}</td>
                                        <td>{row.type}</td>
                                        <td>{formatNumber(row.quantity)}</td>
                                        <td>{formatNumber(row.mortality)}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="empty-state">No poultry records.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </PanelCard>

                <PanelCard title="Sales" subtitle="Transactions for this date">
                    <div className="table-wrap">
                        <table className="data-table mockup-table">
                            <thead>
                                <tr><th>Invoice</th><th>Customer</th><th>Amount</th></tr>
                            </thead>
                            <tbody>
                                {snapshot.sales?.length ? snapshot.sales.map((row) => (
                                    <tr key={row.invoice_no}>
                                        <td>{row.invoice_no}</td>
                                        <td>{row.customer}</td>
                                        <td>{formatCurrency(row.amount)}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="3" className="empty-state">No sales recorded for this date.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </PanelCard>
            </div>

            <div className="daily-report-split">
                <PanelCard title="Low Stock Alerts">
                    <ul className="recent-activities">
                        {snapshot.low_stock?.length ? snapshot.low_stock.map((item, index) => (
                            <li key={`${item.name}-${index}`}>
                                <span className="activity-icon activity-icon-red"></span>
                                <div className="activity-content">
                                    <strong>{item.name}</strong>
                                    <p>{item.category} · {formatNumber(item.stock)} {item.unit} left</p>
                                </div>
                            </li>
                        )) : <li className="empty-state">No low stock items.</li>}
                    </ul>
                </PanelCard>

                <PanelCard title="Inventory Transactions">
                    <div className="table-wrap">
                        <table className="data-table mockup-table">
                            <thead>
                                <tr><th>Type</th><th>Item</th><th>Qty</th></tr>
                            </thead>
                            <tbody>
                                {snapshot.transactions?.length ? snapshot.transactions.map((row, index) => (
                                    <tr key={`${row.item_name}-${index}`}>
                                        <td><span className={`txn-type-${row.type}`}>{row.type === 'in' ? 'In' : 'Out'}</span></td>
                                        <td>{row.item_name}</td>
                                        <td>{formatNumber(row.quantity)}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="3" className="empty-state">No transactions for this date.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </PanelCard>
            </div>

            {!readOnly && !notes && (
                <p className="daily-report-hint">Review the data above, add any notes below, then submit the daily report.</p>
            )}
        </div>
    );
}

export default function ReportsPage() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [viewReport, setViewReport] = useState(null);
    const [actionError, setActionError] = useState(null);

    const { data: listData, loading, error, reload, setError } = useFetch('/api/daily-reports');
    const {
        data: snapshotData,
        loading: snapshotLoading,
        error: snapshotError,
        reload: reloadSnapshot,
    } = useFetch(`/api/daily-reports/snapshot?date=${selectedDate}`);

    const existingReport = snapshotData?.report;
    const snapshot = existingReport?.snapshot || snapshotData?.snapshot;
    const isSubmitted = Boolean(existingReport);
    const canSubmit = !isAdmin && !isSubmitted;

    useEffect(() => {
        setNotes(existingReport?.notes || '');
    }, [existingReport?.id, existingReport?.notes, selectedDate]);

    const handleSearchChange = useCallback((value) => {
        setSearch(value);
    }, []);

    usePageSearch('Search daily reports...', search, handleSearchChange);

    const filteredReports = listData?.reports?.filter((report) => {
        if (!search.trim()) return true;
        const query = search.toLowerCase();
        return (
            report.report_date.includes(query)
            || String(report.submitted_by || '').toLowerCase().includes(query)
            || String(report.status || '').toLowerCase().includes(query)
        );
    }) || [];

    const submitReport = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setActionError(null);

        try {
            await axios.post('/api/daily-reports', {
                report_date: selectedDate,
                notes: notes.trim() || null,
            });
            await Promise.all([reload(), reloadSnapshot()]);
        } catch (err) {
            setActionError(err.response?.data?.message || 'Unable to submit daily report.');
        } finally {
            setSubmitting(false);
        }
    };

    const reviewReport = async (reportId) => {
        setActionError(null);

        try {
            const response = await axios.put(`/api/daily-reports/${reportId}/review`);
            await reload();
            setViewReport(response.data.report);
        } catch (err) {
            setActionError(err.response?.data?.message || 'Unable to review report.');
        }
    };

    const openReport = async (report) => {
        setActionError(null);

        try {
            const response = await axios.get(`/api/daily-reports/snapshot?date=${report.report_date}`);
            setViewReport(response.data.report);
        } catch (err) {
            setActionError(err.response?.data?.message || 'Unable to load report details.');
        }
    };

    const closeReportModal = () => {
        setViewReport(null);
        setActionError(null);
    };

    const combinedError = error || snapshotError || actionError;
    const pageLoading = loading || snapshotLoading;

    return (
        <PageState loading={pageLoading} error={combinedError} loadingLabel="Loading daily reports...">
            {!isAdmin && (
                <div className={`daily-report-banner ${isSubmitted ? 'is-submitted' : 'is-pending'}`}>
                    <div>
                        <span className="daily-report-banner-kicker">Daily Report Status</span>
                        <h3>{formatDisplayDate(selectedDate)}</h3>
                        <p>
                            {isSubmitted
                                ? `Submitted by ${existingReport.submitted_by} on ${formatDateTime(existingReport.submitted_at)}`
                                : 'This date has not been submitted yet. Review the snapshot below and submit before end of day.'}
                        </p>
                    </div>
                    {isSubmitted && <StatusBadge status={existingReport.status} />}
                </div>
            )}

            {isAdmin && (
                <div className="daily-report-admin-stats">
                    <div className="daily-report-admin-stat">
                        <span>Pending Review</span>
                        <strong>{formatNumber(listData?.pending_review_count)}</strong>
                    </div>
                    <div className="daily-report-admin-stat">
                        <span>Today Submitted</span>
                        <strong>{listData?.today?.submitted ? 'Yes' : 'No'}</strong>
                    </div>
                </div>
            )}

            <div className="page-toolbar daily-report-toolbar">
                <div className="page-date-picker daily-report-date-picker">
                    <AnimatedDatePicker
                        value={selectedDate}
                        onChange={setSelectedDate}
                        placeholder="Select date"
                        allowClear={false}
                    />
                    <span className="daily-report-date-label">{formatDisplayDate(selectedDate)}</span>
                </div>
                {!isAdmin && canSubmit && (
                    <button type="submit" className="btn btn-primary" form="daily-report-form" disabled={submitting}>
                        <i className="bi bi-send"></i> {submitting ? 'Submitting...' : 'Submit Daily Report'}
                    </button>
                )}
            </div>

            <SummaryCards items={buildSummaryCards(snapshot?.summary)} columns={4} />

            {!isAdmin ? (
                <form id="daily-report-form" onSubmit={submitReport}>
                    <SnapshotSections snapshot={snapshot} notes={isSubmitted ? existingReport?.notes : null} />

                    {canSubmit && (
                        <PanelCard title="End-of-Day Notes" subtitle="Optional remarks for the admin">
                            <div className="form-group">
                                <textarea
                                    className="form-control"
                                    rows={4}
                                    value={notes}
                                    onChange={(event) => setNotes(event.target.value)}
                                    placeholder="Add notes about issues, weather, tasks completed, or anything the admin should know..."
                                    maxLength={2000}
                                />
                            </div>
                        </PanelCard>
                    )}
                </form>
            ) : (
                <>
                    <SnapshotSections
                        snapshot={snapshot}
                        notes={existingReport?.notes}
                        readOnly
                    />

                    <div className="data-panel">
                        <div className="data-panel-title">Submitted Daily Reports</div>
                        <div className="table-responsive">
                            <table className="data-table mockup-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Submitted By</th>
                                        <th>Status</th>
                                        <th>Submitted At</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.length ? filteredReports.map((report) => (
                                        <tr key={report.id}>
                                            <td>{formatDisplayDate(report.report_date)}</td>
                                            <td>{report.submitted_by || '—'}</td>
                                            <td><StatusBadge status={report.status} /></td>
                                            <td>{formatDateTime(report.submitted_at)}</td>
                                            <td>
                                                <button type="button" className="btn btn-outline btn-sm" onClick={() => openReport(report)}>
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" className="empty-state">No daily reports submitted yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            <Modal
                open={Boolean(viewReport)}
                title={viewReport ? `Daily Report · ${formatDisplayDate(viewReport.report_date)}` : 'Daily Report'}
                size="landscape"
                onClose={closeReportModal}
                actions={viewReport ? (
                    <>
                        {viewReport.status !== 'reviewed' && (
                            <button type="button" className="btn btn-primary" onClick={() => reviewReport(viewReport.id)}>
                                Mark as Reviewed
                            </button>
                        )}
                        <button type="button" className="btn btn-outline" onClick={closeReportModal}>Close</button>
                    </>
                ) : null}
            >
                {viewReport && (
                    <div className="daily-report-modal">
                        <div className="daily-report-modal-meta">
                            <div>
                                <span>Submitted by</span>
                                <strong>{viewReport.submitted_by || '—'}</strong>
                            </div>
                            <div>
                                <span>Status</span>
                                <StatusBadge status={viewReport.status} />
                            </div>
                            <div>
                                <span>Submitted at</span>
                                <strong>{formatDateTime(viewReport.submitted_at)}</strong>
                            </div>
                            {viewReport.reviewed_by && (
                                <div>
                                    <span>Reviewed by</span>
                                    <strong>{viewReport.reviewed_by}</strong>
                                </div>
                            )}
                        </div>
                        <SummaryCards items={buildSummaryCards(viewReport.summary || viewReport.snapshot?.summary)} columns={4} />
                        <SnapshotSections
                            snapshot={viewReport.snapshot}
                            notes={viewReport.notes}
                            readOnly
                        />
                    </div>
                )}
            </Modal>
        </PageState>
    );
}
