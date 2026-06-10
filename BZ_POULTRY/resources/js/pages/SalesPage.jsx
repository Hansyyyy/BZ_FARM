import { useMemo, useState } from 'react';
import axios from 'axios';
import useFetch from '../hooks/useFetch';
import PageState from '../components/ui/PageState';
import SummaryCards from '../components/ui/SummaryCards';
import Modal from '../components/ui/Modal';
import ExportModal from '../components/ui/ExportModal';
import SaleForm from '../components/forms/SaleForm';
import RowActionButtons from '../components/ui/RowActionButtons';
import { exportTableData } from '../utils/exportData';

const salesSummaryFields = [
    { key: 'eggsToday', label: 'Eggs Collected Today', sub: 'Today' },
    { key: 'calTotal', label: 'Cal Total', sub: 'Good Eggs' },
    { key: 'crackedToday', label: 'Cracked Eggs', sub: 'Today' },
    { key: 'weekTotal', label: 'This Week', sub: 'Weekly Total' },
    { key: 'monthTotal', label: 'This Month', sub: 'Monthly Total' },
];

const salesColumns = [
    { key: 'sale_date', label: 'Date' },
    { key: 'invoice_no', label: 'Invoice No.' },
    { key: 'customer', label: 'Customer', render: (sale) => sale.customer?.name ?? sale.customer_name },
    { key: 'product', label: 'Product', render: (sale) => sale.product?.name ?? sale.product_name },
    { key: 'quantity', label: 'Qty' },
    { key: 'amount', label: 'Amount', render: (sale) => `₱${Number(sale.amount).toFixed(2)}` },
    { key: 'payment_method', label: 'Payment' },
    { key: 'status', label: 'Status' },
];

export default function SalesPage() {
    const { data, loading, error, reload, setError } = useFetch('/api/sales');
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [viewItem, setViewItem] = useState(null);

    const updateField = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

    const closeForm = () => {
        setShowForm(false);
        setForm({});
        setEditingId(null);
    };

    const openEdit = (sale) => {
        setEditingId(sale.id);
        setForm({
            invoice_no: sale.invoice_no || '',
            customer_id: sale.customer_id || sale.customer?.id || '',
            product_id: sale.product_id || sale.product?.id || '',
            quantity: sale.quantity || '',
            unit_price: sale.unit_price || '',
            payment_method: sale.payment_method || '',
            status: sale.status || '',
            sale_date: sale.sale_date ? String(sale.sale_date).slice(0, 10) : '',
        });
        setShowForm(true);
    };

    const submit = async (event) => {
        event.preventDefault();
        try {
            const payload = { ...form };

            if (editingId) {
                await axios.put(`/api/sales/${editingId}`, payload);
            } else {
                const formData = new FormData();
                Object.entries(payload).forEach(([key, value]) => formData.append(key, value));
                await axios.post('/api/sales', formData);
            }

            closeForm();
            await reload();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const filteredSales = useMemo(() => {
        const rows = data?.items || [];
        if (!search.trim()) return rows;
        const query = search.toLowerCase();
        return rows.filter((sale) => (
            String(sale.sale_date || '').toLowerCase().includes(query) ||
            String(sale.invoice_no || '').toLowerCase().includes(query) ||
            String(sale.customer?.name || sale.customer_name || '').toLowerCase().includes(query) ||
            String(sale.product?.name || sale.product_name || '').toLowerCase().includes(query) ||
            String(sale.status || '').toLowerCase().includes(query)
        ));
    }, [data, search]);

    return (
        <PageState loading={loading} error={error} loadingLabel="Loading sales...">
            <SummaryCards fields={salesSummaryFields} summary={data?.summary} />

            <div className="data-panel">
                <div className="data-panel-toolbar">
                    <div className="data-panel-search">
                        <i className="bi bi-search"></i>
                        <input type="text" placeholder="Search sales..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="data-panel-filters">
                        <button type="button" className="btn btn-outline" onClick={() => setShowExport(true)}>
                            <i className="bi bi-printer"></i> Export
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => { setEditingId(null); setForm({}); setShowForm(true); }}>
                            <i className="bi bi-plus-lg"></i> New Sale
                        </button>
                    </div>
                </div>

                <div className="data-panel-title">Sales List</div>

                <div className="table-responsive">
                    <table className="data-table mockup-table">
                        <thead>
                            <tr>
                                <th>Date</th><th>Invoice No.</th><th>Customer</th><th>Product</th>
                                <th>Qty</th><th>Amount</th><th>Payment</th><th>Status</th><th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSales.length ? filteredSales.map((sale) => (
                                <tr key={sale.id}>
                                    <td>{sale.sale_date}</td>
                                    <td><strong>{sale.invoice_no}</strong></td>
                                    <td>{sale.customer?.name ?? sale.customer_name}</td>
                                    <td>{sale.product?.name ?? sale.product_name}</td>
                                    <td>{sale.quantity}</td>
                                    <td>₱{Number(sale.amount).toFixed(2)}</td>
                                    <td>{sale.payment_method}</td>
                                    <td><span className={`status-pill status-${sale.status}`}>{sale.status}</span></td>
                                    <td>
                                        <RowActionButtons
                                            onView={() => setViewItem(sale)}
                                            onEdit={() => openEdit(sale)}
                                        />
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="9">No sales found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal open={showForm} title={editingId ? 'Update Sale' : 'New Sale'} size="landscape" onClose={closeForm} actions={(
                <>
                    <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
                    <button type="submit" className="btn btn-primary" form="sale-form">{editingId ? 'Update' : 'Record Sale'}</button>
                </>
            )}>
                <SaleForm id="sale-form" form={form} onChange={updateField} onSubmit={submit} customers={data?.customers || []} products={data?.products || []} />
            </Modal>

            <Modal
                open={Boolean(viewItem)}
                title="Sale Details"
                size="landscape"
                onClose={() => setViewItem(null)}
                actions={<button type="button" className="btn btn-outline" onClick={() => setViewItem(null)}>Close</button>}
            >
                {viewItem && (
                    <div className="detail-grid">
                        {salesColumns.map((col) => {
                            const value = col.render ? col.render(viewItem) : viewItem[col.key] ?? '';
                            return (
                                <div className="detail-item" key={col.key}>
                                    <span>{col.label}</span>
                                    <strong>{value}</strong>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Modal>

            <ExportModal
                open={showExport}
                title="Export Sales"
                description="Choose how you want to export your sales records."
                onClose={() => setShowExport(false)}
                onExport={(format) => exportTableData({ title: 'Sales List', columns: salesColumns, rows: filteredSales, format })}
            />
        </PageState>
    );
}
