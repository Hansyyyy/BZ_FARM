import { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';

export default function SalesPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({});
    const [showCreate, setShowCreate] = useState(false);
    const [showExport, setShowExport] = useState(false);

    useEffect(() => {
        axios.get('/api/sales').then((response) => setData(response.data)).catch((err) => setError(err.message)).finally(() => setLoading(false));
    }, []);

    const submit = async (event) => {
        event.preventDefault();
        try {
            const payload = new FormData();
            Object.entries(form).forEach(([key, value]) => payload.append(key, value));
            await axios.post('/api/sales', payload);
            setShowCreate(false);
            const response = await axios.get('/api/sales');
            setData(response.data);
        } catch (err) {
            setError(err.message);
        }
    };

    const remove = async (id) => {
        if (!window.confirm('Delete this sale?')) return;
        try {
            await axios.delete(`/api/sales/${id}`);
            setData((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }));
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <p>Loading sales...</p>;
    if (error) return <div className="alert-error">{error}</div>;

    const filteredSales = data?.items?.filter((sale) => {
        if (!search.trim()) return true;
        const query = search.toLowerCase();
        return (
            String(sale.sale_date || '').toLowerCase().includes(query) ||
            String(sale.invoice_no || '').toLowerCase().includes(query) ||
            String(sale.customer?.name || sale.customer_name || '').toLowerCase().includes(query) ||
            String(sale.product?.name || sale.product_name || '').toLowerCase().includes(query) ||
            String(sale.status || '').toLowerCase().includes(query)
        );
    }) || [];

    return (
        <>
            <div className="card">
                <div className="card-header"><h3>Sales Management</h3></div>
                <div className="card-body">
                    <div className="table-toolbar" style={{ marginBottom: '1rem' }}>
                        <div className="search-box"><i className="bi bi-search"></i><input type="text" placeholder="Search sales..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                        <div>
                            <button className="btn btn-outline" onClick={() => setShowExport(true)}><i className="bi bi-printer"></i> Export</button>
                            <button className="btn btn-success" onClick={() => setShowCreate(true)}><i className="bi bi-plus-lg"></i> New Sale</button>
                        </div>
                    </div>
                    <div className="stat-cards">
                        <div className="stat-card"><div className="label">Eggs Collected Today</div><div className="value">{data.summary.eggsToday ?? 0}</div></div>
                        <div className="stat-card"><div className="label">Cal Total</div><div className="value">{data.summary.calTotal ?? 0}</div></div>
                        <div className="stat-card"><div className="label">Cracked Eggs</div><div className="value">{data.summary.crackedToday ?? 0}</div></div>
                        <div className="stat-card"><div className="label">This Week</div><div className="value">{data.summary.weekTotal ?? 0}</div></div>
                        <div className="stat-card"><div className="label">This Month</div><div className="value">{data.summary.monthTotal ?? 0}</div></div>
                    </div>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead><tr><th>Date</th><th>Invoice No.</th><th>Customer</th><th>Product</th><th>Qty</th><th>Amount</th><th>Payment</th><th>Status</th><th>Action</th></tr></thead>
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
                                        <td><span className={`status-badge status-${sale.status}`}>{sale.status}</span></td>
                                        <td><button className="action-btn delete" onClick={() => remove(sale.id)}><i className="bi bi-trash"></i></button></td>
                                    </tr>
                                )) : <tr><td colSpan="9">No sales found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal open={showCreate} title="New Sale" onClose={() => setShowCreate(false)} actions={(
                <>
                    <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                    <button type="submit" className="btn btn-success" form="sale-form">Record Sale</button>
                </>
            )}>
                <form id="sale-form" onSubmit={submit}>
                    <div className="form-group"><label>Invoice No.</label><input className="form-control" value={form.invoice_no || ''} onChange={(e) => setForm({ ...form, invoice_no: e.target.value })} required /></div>
                    <div className="form-group"><label>Customer</label><select className="form-control" value={form.customer_id || ''} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} required>
                        <option value="">Choose customer</option>
                        {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select></div>
                    <div className="form-group"><label>Product</label><select className="form-control" value={form.product_id || ''} onChange={(e) => setForm({ ...form, product_id: e.target.value })} required>
                        <option value="">Choose product</option>
                        {data.products.map((p) => <option key={p.id} value={p.id}>{p.name} - ₱{p.unit_price}</option>)}
                    </select></div>
                    <div className="form-group"><label>Quantity</label><input type="number" className="form-control" value={form.quantity || ''} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></div>
                    <div className="form-group"><label>Unit Price</label><input type="number" step="0.01" className="form-control" value={form.unit_price || ''} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} required /></div>
                    <div className="form-group"><label>Payment Method</label><select className="form-control" value={form.payment_method || ''} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} required><option value="">Choose</option><option value="cash">Cash</option><option value="credit">Credit</option></select></div>
                    <div className="form-group"><label>Status</label><select className="form-control" value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })} required><option value="">Choose status</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select></div>
                    <div className="form-group"><label>Sale Date</label><input type="date" className="form-control" value={form.sale_date || ''} onChange={(e) => setForm({ ...form, sale_date: e.target.value })} required /></div>
                </form>
            </Modal>

            <Modal open={showExport} title="Export Sales" onClose={() => setShowExport(false)} actions={(
                <>
                    <button type="button" className="btn btn-outline" onClick={() => setShowExport(false)}>Cancel</button>
                    <button type="button" className="btn btn-success" onClick={() => { window.alert('Export request submitted'); setShowExport(false); }}>Export</button>
                </>
            )}>
                <div className="form-group"><label>Format</label><select className="form-control"><option value="pdf">PDF</option><option value="csv">CSV</option></select></div>
                <p>Select the export format for sales.</p>
            </Modal>
        </>
    );
}
