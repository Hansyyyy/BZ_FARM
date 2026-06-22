import { useCallback, useMemo, useState } from 'react';
import useFetch from '../hooks/useFetch';
import { usePageSearch } from '../context/HeaderSearchContext';
import PageState from '../components/ui/PageState';
import ModuleTabs from '../components/ui/ModuleTabs';
import ExportModal from '../components/ui/ExportModal';
import { exportTableData } from '../utils/exportData';

const HISTORY_TABS = [
    { id: 'inventory', label: 'Inventory Stock', icon: 'bi-box-seam' },
    { id: 'sales', label: 'Sales Management', icon: 'bi-cash-stack' },
];

const inventoryColumns = [
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    { key: 'module', label: 'Module' },
    { key: 'action', label: 'Action' },
    { key: 'description', label: 'Details' },
    { key: 'recorded_by', label: 'Recorded By' },
];

const salesColumns = [
    { key: 'sale_date', label: 'Date' },
    { key: 'invoice_no', label: 'Invoice No.' },
    { key: 'customer', label: 'Customer' },
    { key: 'product', label: 'Product' },
    { key: 'quantity', label: 'Qty' },
    {
        key: 'amount',
        label: 'Amount',
        render: (row) => `₱${Number(row.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    { key: 'payment_method', label: 'Payment' },
    { key: 'status', label: 'Status' },
    { key: 'recorded_by', label: 'Recorded By' },
];

function actionClass(action) {
    const value = String(action || '').toLowerCase();
    if (value.includes('delete') || value.includes('out')) return 'history-pill history-pill-danger';
    if (value.includes('create') || value.includes('in')) return 'history-pill history-pill-success';
    return 'history-pill history-pill-warning';
}

export default function HistoryPage() {
    const [activeTab, setActiveTab] = useState('inventory');
    const [search, setSearch] = useState('');
    const [showExport, setShowExport] = useState(false);

    const { data, loading, error } = useFetch(`/api/history?type=${activeTab}`);

    const handleSearchChange = useCallback((value) => {
        setSearch(value);
    }, []);

    usePageSearch('Search history records...', search, handleSearchChange);

    const items = data?.items || [];
    const columns = activeTab === 'sales' ? salesColumns : inventoryColumns;

    const filteredItems = useMemo(() => {
        if (!search.trim()) return items;

        const query = search.toLowerCase();
        return items.filter((item) => Object.values(item).some((value) => String(value ?? '').toLowerCase().includes(query)));
    }, [items, search]);

    const exportTitle = activeTab === 'sales' ? 'Sales History' : 'Inventory Stock History';

    const normalizeDate = (value) => String(value || '').slice(0, 10);

    const getRowsToExport = (dateFilter) => {
        if (!dateFilter) return filteredItems;

        const dateKey = activeTab === 'sales' ? 'sale_date' : 'date';

        return filteredItems.filter((row) => normalizeDate(row[dateKey]) === normalizeDate(dateFilter));
    };

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearch('');
    };

    return (
        <PageState loading={loading} error={error} loadingLabel="Loading history...">
            <div className="data-panel history-table-card">
                <div className="history-table-header">
                    <div>
                        <h2 className="history-title">History</h2>
                        <p className="history-subtitle mb-0">
                            {activeTab === 'sales'
                                ? 'Sales transactions recorded in Sales Management.'
                                : 'Inventory updates logged from stock modules when managers add or edit records.'}
                        </p>
                    </div>
                    <div className="history-table-actions">
                        <span className="history-batch-count">{filteredItems.length} records</span>
                        <button type="button" className="btn btn-outline" onClick={() => setShowExport(true)}>
                            <i className="bi bi-printer"></i> Export
                        </button>
                    </div>
                </div>

                <ModuleTabs tabs={HISTORY_TABS} activeTab={activeTab} onChange={handleTabChange} />

                <div className="table-responsive">
                    {activeTab === 'inventory' ? (
                        <table className="history-table data-table mockup-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Module</th>
                                    <th>Action</th>
                                    <th>Details</th>
                                    <th>Recorded By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.length ? filteredItems.map((row) => (
                                    <tr key={row.id}>
                                        <td>{row.date}</td>
                                        <td>{row.time}</td>
                                        <td>{row.module}</td>
                                        <td>
                                            <span className={actionClass(row.action)}>{row.action}</span>
                                        </td>
                                        <td>{row.description}</td>
                                        <td>{row.recorded_by}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="empty-state">
                                            No inventory history yet. Updates from Inventory Stock will appear here.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="history-table data-table mockup-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Invoice No.</th>
                                    <th>Customer</th>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Amount</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th>Recorded By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.length ? filteredItems.map((row) => (
                                    <tr key={row.id}>
                                        <td>{row.sale_date}</td>
                                        <td>{row.invoice_no}</td>
                                        <td>{row.customer}</td>
                                        <td>{row.product}</td>
                                        <td>{Number(row.quantity || 0).toLocaleString()}</td>
                                        <td>₱{Number(row.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td>{row.payment_method}</td>
                                        <td><span className="history-pill history-pill-success">{row.status}</span></td>
                                        <td>{row.recorded_by}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="9" className="empty-state">
                                            No sales history yet. Sales recorded in Sales Management will appear here.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <ExportModal
                open={showExport}
                title={`Export ${exportTitle}`}
                description={`Choose how you want to export your ${activeTab === 'sales' ? 'sales' : 'inventory stock'} history.`}
                onClose={() => setShowExport(false)}
                onExport={(format, preparedBy, filterDate) => exportTableData({
                    title: exportTitle,
                    columns,
                    rows: getRowsToExport(filterDate),
                    format,
                    preparedBy,
                })}
            />
        </PageState>
    );
}
