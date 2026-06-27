import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import useFetch from '../hooks/useFetch';
import { usePageSearch } from '../context/HeaderSearchContext';
import PageState from '../components/ui/PageState';
import SummaryCards from '../components/ui/SummaryCards';
import PanelCard from '../components/ui/PanelCard';
import Modal from '../components/ui/Modal';
import ExportModal from '../components/ui/ExportModal';
import AnimatedDatePicker from '../components/ui/AnimatedDatePicker';
import FormLabel from '../components/forms/FormLabel';

const isAdmin = window.Laravel?.user?.role === 'admin';

function formatNumber(value) {
    return Number(value || 0).toLocaleString();
}

function formatCurrency(value) {
    return `₱${Number(value || 0).toLocaleString()}`;
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
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

function getTodayKey() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function buildSummaryCards(summary = {}, reportType = 'daily', dateRange = {}) {
    const rangeSub = reportType !== 'daily' && dateRange.start && dateRange.end
        ? `${dateRange.start} to ${dateRange.end}`
        : 'For selected date';
    const poultrySub = reportType !== 'daily'
        ? 'Headcount at end of period'
        : 'Headcount at end of day';

    return [
        { key: 'poultry', label: 'Total Poultry', value: formatNumber(summary.total_poultry), sub: poultrySub, icon: 'bi-egg-fried' },
        { key: 'eggs', label: 'Eggs Collected', value: formatNumber(summary.eggs_collected), sub: rangeSub, icon: 'bi-basket' },
        { key: 'sales', label: 'Sales Total', value: formatCurrency(summary.sales_total), sub: `${formatNumber(summary.sales_count)} transactions`, icon: 'bi-cash-stack', tone: 'success' },
        { key: 'defects', label: 'Defect Eggs', value: formatNumber(summary.defect_eggs), sub: 'Soft shell, damaged, cracked', icon: 'bi-exclamation-circle', tone: 'orange' },
    ];
}

function StatusBadge({ status }) {
    const className = status === 'reviewed' ? 'daily-report-status reviewed' : 'daily-report-status submitted';
    const label = status === 'reviewed' ? 'Reviewed' : 'Submitted';

    return <span className={className}>{label}</span>;
}

function SnapshotSections({ snapshot, category = 'all', notes, readOnly = false, periodLabel = '' }) {
    if (!snapshot) {
        return <p className="empty-state">No snapshot data available.</p>;
    }

    const periodSuffix = periodLabel ? ` · ${periodLabel}` : '';
    const isRange = snapshot.period && !snapshot.period.is_single_day;
    const qtyLabel = isRange ? 'Qty (end of period)' : 'Qty (end of day)';
    const lossLabel = isRange ? 'Mortality (period)' : 'Mortality (day)';
    const cullLabel = isRange ? 'Cull (period)' : 'Cull (day)';

    const showEgg = category === 'all' || category === 'egg';
    const showPoultry = category === 'all' || category === 'poultry';
    const showMortality = category === 'all' || category === 'mortality';
    const showFeed = category === 'all' || category === 'feed';
    const showSales = category === 'all' || category === 'sales';
    const showInventory = category === 'all' || category === 'inventory';

    return (
        <div className="daily-report-sections">
            {notes && (
                <PanelCard title="Manager Notes" className="daily-report-notes-card">
                    <p className="daily-report-notes-text">{notes}</p>
                </PanelCard>
            )}

            {showEgg && (
                <PanelCard title="Egg Production" subtitle={`Collections for selected period${periodSuffix}`}>
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
            )}

            <div className="daily-report-split">
                {showPoultry && (
                    <PanelCard title="Poultry" subtitle={`Flocks active during period${periodSuffix}`}>
                        <div className="table-wrap">
                            <table className="data-table mockup-table">
                                <thead>
                                    <tr><th>Building</th><th>Batch</th><th>Type</th><th>{qtyLabel}</th><th>{lossLabel}</th><th>{cullLabel}</th></tr>
                                </thead>
                                <tbody>
                                    {snapshot.poultry?.length ? snapshot.poultry.map((row) => (
                                        <tr key={`${row.building}-${row.batch_no}`}>
                                            <td>{row.building || '—'}</td>
                                            <td>{row.batch_no}</td>
                                            <td>{row.type}</td>
                                            <td>{formatNumber(row.quantity)}</td>
                                            <td>{formatNumber(row.mortality)}</td>
                                            <td>{formatNumber(row.cull)}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="6" className="empty-state">No poultry records for this period.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </PanelCard>
                )}

                {showSales && (
                    <PanelCard title="Sales" subtitle={`Transactions for selected period${periodSuffix}`}>
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
                )}
            </div>

            {showInventory && (
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
            )}

            {showFeed && (
                <div className="daily-report-split">
                    <PanelCard title="Feed Consumption" subtitle={`Feed used by building${periodSuffix}`}>
                        <div className="table-wrap">
                            <table className="data-table mockup-table">
                                <thead>
                                    <tr><th>Building</th><th>Feed Type</th><th>Used</th><th>Remaining</th></tr>
                                </thead>
                                <tbody>
                                    {snapshot.feed_consumption?.length ? snapshot.feed_consumption.map((row, idx) => (
                                        <tr key={`feed-${idx}`}>
                                            <td>{row.building}</td>
                                            <td>{row.feed_type}</td>
                                            <td>{formatNumber(row.used)} kg</td>
                                            <td>{formatNumber(row.remaining)} kg</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4" className="empty-state">No feed consumption recorded for this date.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </PanelCard>

                    {showMortality && (
                        <PanelCard title="Mortality & Cull Details" subtitle={`Per-building breakdown${periodSuffix}`}>
                            <div className="table-wrap">
                                <table className="data-table mockup-table">
                                    <thead>
                                        <tr><th>Building</th><th>Batch</th><th>Mortality</th><th>Cull</th><th>Reason</th></tr>
                                    </thead>
                                    <tbody>
                                        {snapshot.mortality_cull_details?.length ? snapshot.mortality_cull_details.map((row, idx) => (
                                            <tr key={`loss-${idx}`}>
                                                <td>{row.building}</td>
                                                <td>{row.batch}</td>
                                                <td>{formatNumber(row.mortality)}</td>
                                                <td>{formatNumber(row.cull)}</td>
                                                <td>{row.reason || '—'}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="5" className="empty-state">No mortality or cull details available.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </PanelCard>
                    )}
                </div>
            )}

            {showMortality && !showFeed && (
                <PanelCard title="Mortality & Cull Details" subtitle={`Per-building breakdown${periodSuffix}`}>
                    <div className="table-wrap">
                        <table className="data-table mockup-table">
                            <thead>
                                <tr><th>Building</th><th>Batch</th><th>Mortality</th><th>Cull</th><th>Reason</th></tr>
                            </thead>
                            <tbody>
                                {snapshot.mortality_cull_details?.length ? snapshot.mortality_cull_details.map((row, idx) => (
                                    <tr key={`loss-${idx}`}>
                                        <td>{row.building}</td>
                                        <td>{row.batch}</td>
                                        <td>{formatNumber(row.mortality)}</td>
                                        <td>{formatNumber(row.cull)}</td>
                                        <td>{row.reason || '—'}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="5" className="empty-state">No mortality or cull details available.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </PanelCard>
            )}

            {(category === 'all') && (
                <PanelCard title="Building Performance" subtitle={`Compare building KPIs${periodSuffix}`}>
                <div className="table-wrap">
                    <table className="data-table mockup-table">
                        <thead>
                            <tr><th>Building</th><th>Chickens</th><th>Eggs</th><th>Mortality</th><th>Cull</th><th>Feed Used</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {snapshot.building_performance?.length ? snapshot.building_performance.map((row, idx) => (
                                <tr key={`bp-${idx}`}>
                                    <td>{row.building}</td>
                                    <td>{formatNumber(row.chickens)}</td>
                                    <td>{formatNumber(row.eggs)}</td>
                                    <td>{formatNumber(row.mortality)}</td>
                                    <td>{formatNumber(row.cull ?? 0)}</td>
                                    <td>{formatNumber(row.feed_used)} kg</td>
                                    <td>{row.status || '—'}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="7" className="empty-state">No building performance data available.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </PanelCard>
            )}

            {!readOnly && !notes && (
                <p className="daily-report-hint">Review the data above, add any notes below, then submit the daily report.</p>
            )}
        </div>
    );
}

export default function ReportsPage() {
    const [selectedDate, setSelectedDate] = useState(getTodayKey());
    const [reportType, setReportType] = useState('daily');
    const [startDate, setStartDate] = useState(getTodayKey());
    const [endDate, setEndDate] = useState(getTodayKey());
    const [category, setCategory] = useState('all');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [viewReport, setViewReport] = useState(null);
    const [isExportOpen, setExportOpen] = useState(false);
    const [buildingFilter, setBuildingFilter] = useState('');
    const [batchFilter, setBatchFilter] = useState('');
    const [actionError, setActionError] = useState(null);

    const { data: listData, loading, error, reload, setError } = useFetch('/api/daily-reports');

    const snapshotUrl = useMemo(() => {
        if (reportType === 'daily') {
            return `/api/daily-reports/snapshot?date=${encodeURIComponent(selectedDate)}`;
        }

        if (startDate && endDate) {
            const from = startDate <= endDate ? startDate : endDate;
            const to = startDate <= endDate ? endDate : startDate;
            return `/api/daily-reports/snapshot?start_date=${encodeURIComponent(from)}&end_date=${encodeURIComponent(to)}`;
        }

        return `/api/daily-reports/snapshot?date=${encodeURIComponent(selectedDate)}`;
    }, [reportType, selectedDate, startDate, endDate]);

    const {
        data: snapshotData,
        loading: snapshotLoading,
        error: snapshotError,
        reload: reloadSnapshot,
    } = useFetch(snapshotUrl);

    const todayKey = getTodayKey();
    const existingReport = snapshotData?.report;
    const snapshot = existingReport?.snapshot || snapshotData?.snapshot;
    const isRangeReport = reportType !== 'daily';
    const effectiveStartDate = isRangeReport && startDate && endDate
        ? (startDate <= endDate ? startDate : endDate)
        : selectedDate;
    const effectiveEndDate = isRangeReport && startDate && endDate
        ? (startDate <= endDate ? endDate : startDate)
        : selectedDate;
    const periodLabel = isRangeReport
        ? `${effectiveStartDate} to ${effectiveEndDate}`
        : effectiveStartDate;
    const isSubmitted = Boolean(existingReport);
    const todaySubmitted = Boolean(listData?.today?.submitted);
    const isManagerDateLocked = !isAdmin && todaySubmitted;
    const canSubmit = !isAdmin && !isSubmitted && selectedDate === todayKey;

    useEffect(() => {
        if (!isAdmin && selectedDate !== todayKey) {
            setSelectedDate(todayKey);
        }
    }, [isAdmin, selectedDate, todayKey]);

    useEffect(() => {
        setNotes(existingReport?.notes || '');
    }, [existingReport?.id, existingReport?.notes, selectedDate]);

    useEffect(() => {
        if (reportType === 'daily') {
            setSelectedDate(todayKey);
        } else if (reportType === 'weekly') {
            const today = new Date();
            const weekStart = new Date(today);
            const day = weekStart.getDay();
            weekStart.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
            setStartDate(toDateKey(weekStart));
            setEndDate(todayKey);
        } else if (reportType === 'monthly') {
            const today = new Date();
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            setStartDate(toDateKey(monthStart));
            setEndDate(todayKey);
        } else if (reportType === 'custom') {
            // Keep user-selected dates when switching to custom range.
        }
    }, [reportType, todayKey]);

    const handleSearchChange = useCallback((value) => {
        setSearch(value);
    }, []);

    const handleCardClick = useCallback((cardKey) => {
        const categoryMap = {
            poultry: 'poultry',
            eggs: 'egg',
            sales: 'sales',
            defects: 'mortality',
        };
        setCategory(categoryMap[cardKey] || 'all');
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

    const filteredSnapshot = useMemo(() => {
        if (!snapshot) return snapshot;

        const matchBuilding = (value) => {
            if (!buildingFilter) return true;
            return String(value || '').toLowerCase().includes(buildingFilter.toLowerCase());
        };

        const matchBatch = (value) => {
            if (!batchFilter) return true;
            return String(value || '').toLowerCase().includes(batchFilter.toLowerCase());
        };

        return {
            ...snapshot,
            egg_production: snapshot.egg_production?.filter((row) => matchBuilding(row.building)) || [],
            poultry: snapshot.poultry?.filter((row) => matchBuilding(row.building) && matchBatch(row.batch_no)) || [],
            feed_consumption: snapshot.feed_consumption?.filter((row) => matchBuilding(row.building)) || [],
            mortality_cull_details: snapshot.mortality_cull_details?.filter((row) => matchBuilding(row.building) && matchBatch(row.batch)) || [],
            building_performance: snapshot.building_performance?.filter((row) => matchBuilding(row.building)) || [],
        };
    }, [snapshot, buildingFilter, batchFilter]);

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
                                ? `Submitted by ${existingReport.submitted_by} on ${formatDateTime(existingReport.submitted_at)}. The date is locked until a new day starts.`
                                : 'Review today\'s snapshot below and submit before end of day. The report date stays on today.'}
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

            {isRangeReport && (
                <div className="daily-report-banner is-pending">
                    <div>
                        <span className="daily-report-banner-kicker">Report Period</span>
                        <h3>{formatDisplayDate(effectiveStartDate)} — {formatDisplayDate(effectiveEndDate)}</h3>
                        <p>Aggregated totals and records from {effectiveStartDate} through {effectiveEndDate}.</p>
                    </div>
                </div>
            )}

            <div className="page-toolbar daily-report-toolbar">
                <div className="daily-report-filter-group" style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: '150px' }}>
                        <label className="form-label">Report Type</label>
                        <select className="form-control" value={reportType} onChange={(event) => setReportType(event.target.value)}>
                            <option value="daily">Daily Report</option>
                            <option value="weekly">Weekly Report</option>
                            <option value="monthly">Monthly Report</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    <div style={{ minWidth: '170px' }}>
                        <label className="form-label">Category</label>
                        <select className="form-control" value={category} onChange={(event) => setCategory(event.target.value)}>
                            <option value="all">All Categories</option>
                            <option value="egg">Egg Production</option>
                            <option value="poultry">Poultry Status</option>
                            <option value="mortality">Mortality & Cull</option>
                            <option value="feed">Feed Consumption</option>
                            <option value="sales">Sales</option>
                            <option value="inventory">Inventory</option>
                        </select>
                    </div>
                    {reportType === 'daily' ? (
                        <div style={{ minWidth: '180px' }}>
                            <label className="form-label">Date</label>
                            <AnimatedDatePicker value={selectedDate} onChange={setSelectedDate} allowClear={false} />
                        </div>
                    ) : (
                        <>
                            <div style={{ minWidth: '160px' }}>
                                <label className="form-label">Start Date</label>
                                <AnimatedDatePicker value={startDate} onChange={setStartDate} allowClear={false} />
                            </div>
                            <div style={{ minWidth: '160px' }}>
                                <label className="form-label">End Date</label>
                                <AnimatedDatePicker value={endDate} onChange={setEndDate} allowClear={false} />
                            </div>
                        </>
                    )}
                    <div style={{ minWidth: '170px' }}>
                        <label className="form-label">Building</label>
                        <select className="form-control" value={buildingFilter} onChange={(event) => setBuildingFilter(event.target.value)}>
                            <option value="">All Buildings</option>
                            {Array.from(new Set([...(snapshot?.poultry || []).map((row) => row.building), ...(snapshot?.egg_production || []).map((row) => row.building), ...(snapshot?.feed_consumption || []).map((row) => row.building), ...(snapshot?.mortality_cull_details || []).map((row) => row.building), ...(snapshot?.building_performance || []).map((row) => row.building)])).filter(Boolean).map((building) => (
                                <option key={building} value={building}>{building}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ minWidth: '170px' }}>
                        <label className="form-label">Batch</label>
                        <select className="form-control" value={batchFilter} onChange={(event) => setBatchFilter(event.target.value)}>
                            <option value="">All Batches</option>
                            {Array.from(new Set([...(snapshot?.poultry || []).map((row) => row.batch_no), ...(snapshot?.mortality_cull_details || []).map((row) => row.batch)])).filter(Boolean).map((batch) => (
                                <option key={batch} value={batch}>{batch}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div style={{ marginLeft: 12 }}>
                    <button type="button" className="btn btn-outline" onClick={() => setExportOpen(true)}>
                        <i className="bi bi-download"></i> Export
                    </button>
                </div>
                {!isAdmin && canSubmit && (
                    <button type="submit" className="btn btn-primary" form="daily-report-form" disabled={submitting}>
                        <i className="bi bi-send"></i> {submitting ? 'Submitting...' : 'Submit Daily Report'}
                    </button>
                )}
            </div>

            <ExportModal
                open={isExportOpen}
                title="Export Daily Report"
                description="Export the current filters and visible report layout to PDF, CSV, or Print-friendly HTML."
                onClose={() => setExportOpen(false)}
                onExport={(format, preparedBy) => {
                    const params = new URLSearchParams();
                    params.set('format', format === 'pdf' ? 'pdf' : format === 'csv' ? 'csv' : 'print');
                    params.set('report_type', reportType);
                    if (reportType === 'daily') {
                        params.set('date', selectedDate);
                    } else {
                        params.set('start_date', startDate);
                        params.set('end_date', endDate);
                    }
                    params.set('category', category);
                    if (buildingFilter) params.set('building', buildingFilter);
                    if (batchFilter) params.set('batch', batchFilter);

                    const url = `/api/daily-reports/export?${params.toString()}`;
                    window.open(url, '_blank');
                }}
            />

            <SummaryCards
                items={buildSummaryCards(snapshot?.summary, reportType, { start: effectiveStartDate, end: effectiveEndDate })}
                columns={4}
                onCardClick={handleCardClick}
            />

            {!isAdmin ? (
                <form id="daily-report-form" onSubmit={submitReport}>
                    <SnapshotSections snapshot={filteredSnapshot} category={category} notes={isSubmitted ? existingReport?.notes : null} periodLabel={periodLabel} />

                    {canSubmit && (
                        <PanelCard title="End-of-Day Notes" subtitle="Optional remarks for the admin">
                            <div className="form-group">
                                <FormLabel htmlFor="daily-report-notes">Notes (optional)</FormLabel>
                                <textarea
                                    id="daily-report-notes"
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
                        snapshot={filteredSnapshot}
                        category={category}
                        notes={existingReport?.notes}
                        readOnly
                        periodLabel={periodLabel}
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
