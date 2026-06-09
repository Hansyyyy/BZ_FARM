import { useMemo, useState } from 'react';
import axios from 'axios';
import useFetch from '../hooks/useFetch';
import PageState from '../components/ui/PageState';
import SummaryCards from '../components/ui/SummaryCards';
import Modal from '../components/ui/Modal';
import ExportModal from '../components/ui/ExportModal';
import SaleForm from '../components/forms/SaleForm';

const salesSummaryFields = [
    { key: 'eggsToday', label: 'Eggs Collected Today', sub: 'Today' },
    { key: 'calTotal', label: 'Cal Total', sub: 'Good Eggs' },
    { key: 'crackedToday', label: 'Cracked Eggs', sub: 'Today' },
    { key: 'weekTotal', label: 'This Week', sub: 'Weekly Total' },
    { key: 'monthTotal', label: 'This Month', sub: 'Monthly Total' },
];

export default function SalesPage() {
    const { data, loading, error, setData, reload, setError } = useFetch('/api/sales');
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({});
    const [showCreate, setShowCreate] = useState(false);
    const [showExport, setShowExport] = useState(false);

    const updateField = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

    const submit = async (event) => {
        event.preventDefault();
        try {
            const payload = new FormData();
            Object.entries(form).forEach(([key, value]) => payload.append(key, value));
            await axios.post('/api/sales', payload);
            setShowCreate(false);
            setForm({});
            await reload();
        } catch (err) {
            setError(err.message);
        }
    };

    const remove = async (id) => {
        if (!window.confirm('Delete this sale?')) return;
        try {
            await axios.delete(`/api/sales/${id}`);
            setData((previous) => ({ ...previous, items: previous.items.filter((item) => item.id !== id) }));
        } catch (err) {
            setError(err.message);
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
                        <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
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
                                        <button type="button" className="action-btn delete" onClick={() => remove(sale.id)}>
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="9">No sales found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal open={showCreate} title="New Sale" size="landscape" onClose={() => setShowCreate(false)} actions={(
                <>
                    <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" form="sale-form">Record Sale</button>
                </>
            )}>
                <SaleForm id="sale-form" form={form} onChange={updateField} onSubmit={submit} customers={data?.customers || []} products={data?.products || []} />
            </Modal>

            <ExportModal open={showExport} title="Export Sales" description="Choose how you want to export your sales records." onClose={() => setShowExport(false)} onExport={() => window.alert('Export request submitted.')} />
        </PageState>
    );
}
