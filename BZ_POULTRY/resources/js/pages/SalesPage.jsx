import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import useFetch from '../hooks/useFetch';
import { usePageSearch } from '../context/HeaderSearchContext';
import PageState from '../components/ui/PageState';
import SummaryCards from '../components/ui/SummaryCards';
import Modal from '../components/ui/Modal';
import ExportModal from '../components/ui/ExportModal';
import SaleForm, { buildEggLinesFromSale, createEmptyEggLine, createEmptyChickenLine } from '../components/forms/SaleForm';
import CustomerForm from '../components/forms/CustomerForm';
import RowActionButtons from '../components/ui/RowActionButtons';
import { exportTableData } from '../utils/exportData';

const salesSummaryFields = [
    { key: 'eggsToday', label: 'Eggs Collected Today', sub: 'Today', icon: 'bi-basket' },
    { key: 'calTotal', label: 'Cal Total', sub: 'Total Eggs', icon: 'bi-check-circle' },
    { key: 'crackedToday', label: 'Cracked Eggs', sub: 'Today', icon: 'bi-exclamation-circle', tone: 'warning' },
    { key: 'weekTotal', label: 'This Week', sub: 'Weekly Total', icon: 'bi-calendar-week' },
    { key: 'monthTotal', label: 'This Month', sub: 'Monthly Total', icon: 'bi-calendar-month' },
];

const salesColumns = [
    { key: 'sale_date', label: 'Date' },
    { key: 'invoice_no', label: 'Invoice No.' },
    { key: 'customer', label: 'Customer', render: (sale) => sale.customer?.name ?? sale.customer_name },
    { key: 'product', label: 'Product', render: (sale) => sale.product_summary || sale.product?.name || sale.product_name },
    { key: 'quantity', label: 'Qty' },
    { key: 'amount', label: 'Amount', render: (sale) => `₱${Number(sale.amount).toFixed(2)}` },
    { key: 'payment_method', label: 'Payment' },
    { key: 'status', label: 'Status' },
];

export default function SalesPage() {
    const { data, loading, error, reload, setError } = useFetch('/api/sales');
    const [search, setSearch] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [form, setForm] = useState({});
    const [newCustomer, setNewCustomer] = useState({ name: '', contact: '', email: '', phone: '' });
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [viewItem, setViewItem] = useState(null);
    const [customerMessage, setCustomerMessage] = useState(null);

    const customers = data?.customers || [];

    const updateField = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
    const updateCustomerField = (key, value) => setNewCustomer((previous) => ({ ...previous, [key]: value }));

    const closeForm = () => {
        setShowForm(false);
        setForm({});
        setEditingId(null);
    };

    const openCreateSale = () => {
        setEditingId(null);
        setForm({
            invoice_no: '',
            sale_category: '',
            pricing_unit: 'per_tray',
            egg_lines: [createEmptyEggLine()],
            chicken_lines: [createEmptyChickenLine()],
        });
        setShowForm(true);
    };


    const openEdit = (sale) => {
        setEditingId(sale.id);
        setForm({
            id: sale.id,
            invoice_no: sale.invoice_no || '',
            customer_id: sale.customer_id || sale.customer?.id || '',
            product_id: sale.product_id || sale.product?.id || '',
            sale_category: sale.sale_category || 'egg',
            egg_type: sale.egg_type || '',
            egg_lines: buildEggLinesFromSale(sale),
            chicken_type: sale.chicken_type || '',
            chicken_lines: Array.isArray(sale.chicken_lines) && sale.chicken_lines.length
                ? sale.chicken_lines.map((line, index) => ({
                    id: line.id || `chicken-line-${index}`,
                    chicken_type: line.chicken_type || '',
                    product_id: line.product_id || '',
                    quantity: line.quantity ?? '',
                    unit_price: line.unit_price ?? '',
                }))
                : [{
                    id: 'chicken-line-0',
                    chicken_type: sale.chicken_type || '',
                    product_id: sale.product_id || sale.product?.id || '',
                    quantity: sale.quantity_heads || '',
                    unit_price: sale.unit_price || '',
                }],
            quantity_heads: sale.quantity_heads || '',
            quantity_trays: sale.quantity_trays || '',
            quantity_pieces: sale.quantity_pieces || '',
            pricing_unit: sale.pricing_unit || 'per_tray',
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

            if (payload.sale_category === 'egg') {
                payload.egg_lines = (payload.egg_lines || []).map(({ id, ...line }) => line);
                delete payload.chicken_lines;
            } else if (payload.sale_category === 'chicken') {
                payload.chicken_lines = (payload.chicken_lines || []).map(({ id, ...line }) => line);

                if (payload.chicken_lines.length) {
                    payload.chicken_type = payload.chicken_lines[0]?.chicken_type || '';
                    payload.quantity_heads = payload.chicken_lines[0]?.quantity || '';
                    payload.unit_price = payload.chicken_lines[0]?.unit_price || '';
                    payload.product_id = payload.chicken_lines[0]?.product_id || '';
                }

                delete payload.egg_lines;
            } else {
                delete payload.egg_lines;
                delete payload.chicken_lines;
            }

            if (editingId) {
                delete payload.id;
                await axios.put(`/api/sales/${editingId}`, payload);
            } else {
                delete payload.id;

                const formData = new FormData();
                Object.entries(payload).forEach(([key, value]) => {
                    if (key === 'egg_lines' || key === 'chicken_lines') {
                        formData.append(key, JSON.stringify(value));
                        return;
                    }

                    if (value !== undefined && value !== null) {
                        formData.append(key, value);
                    }
                });
                await axios.post('/api/sales', formData);
            }

            closeForm();
            await reload();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const addCustomer = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.post('/api/customers', newCustomer);
            setShowAddCustomer(false);
            setNewCustomer({ name: '', contact: '', email: '', phone: '' });
            setCustomerMessage(`${response.data.item.name} added to customer list.`);
            await reload();
            setForm((previous) => ({ ...previous, customer_id: response.data.item.id }));
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

    const filteredCustomers = useMemo(() => {
        if (!customerSearch.trim()) return customers;
        const query = customerSearch.toLowerCase();
        return customers.filter((customer) => (
            String(customer.name || '').toLowerCase().includes(query) ||
            String(customer.contact || '').toLowerCase().includes(query) ||
            String(customer.email || '').toLowerCase().includes(query) ||
            String(customer.phone || '').toLowerCase().includes(query)
        ));
    }, [customers, customerSearch]);

    const handleSearchChange = useCallback((value) => {
        setSearch(value);
    }, []);

    usePageSearch('Search sales...', search, handleSearchChange);

    return (
        <PageState loading={loading} error={error} loadingLabel="Loading sales...">
            <SummaryCards fields={salesSummaryFields} summary={data?.summary} />

            <div className="data-panel">
                <div className="data-panel-toolbar">
                    <div className="data-panel-title" style={{ margin: 0 }}>Customers</div>
                    <div className="data-panel-filters">
                        <div className="data-panel-search">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={customerSearch}
                                onChange={(event) => setCustomerSearch(event.target.value)}
                            />
                        </div>
                        <button type="button" className="btn btn-primary" onClick={() => setShowAddCustomer(true)}>
                            <i className="bi bi-person-plus"></i> Add Customer
                        </button>
                    </div>
                </div>
                {customerMessage && <div className="alert-success panel-inline-alert">{customerMessage}</div>}
                <div className="table-responsive">
                    <table className="data-table mockup-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Phone</th>
                                <th>Email</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length ? filteredCustomers.map((customer) => (
                                <tr key={customer.id}>
                                    <td><strong>{customer.name}</strong></td>
                                    <td>{customer.contact || '—'}</td>
                                    <td>{customer.phone || '—'}</td>
                                    <td>{customer.email || '—'}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="empty-state">No customers yet. Click Add Customer to create one.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="data-panel">
                <div className="data-panel-toolbar">
                    <div className="data-panel-filters">
                        <button type="button" className="btn btn-outline" onClick={() => setShowExport(true)}>
                            <i className="bi bi-printer"></i> Export
                        </button>
                        <button type="button" className="btn btn-primary" onClick={openCreateSale}>
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
                <SaleForm id="sale-form" form={form} onChange={updateField} onSubmit={submit} customers={customers} products={data?.products || []} />
            </Modal>

            <Modal open={showAddCustomer} title="Add Customer" size="landscape" onClose={() => setShowAddCustomer(false)} actions={(
                <>
                    <button type="button" className="btn btn-outline" onClick={() => setShowAddCustomer(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" form="customer-form">Save Customer</button>
                </>
            )}>
                <CustomerForm id="customer-form" customer={newCustomer} onChange={updateCustomerField} onSubmit={addCustomer} />
            </Modal>

            <Modal
                open={Boolean(viewItem)}
                title="Sale Details"
                size="landscape"
                onClose={() => setViewItem(null)}
                actions={<button type="button" className="btn btn-outline" onClick={() => setViewItem(null)}>Close</button>}
            >
                {viewItem && (
                    <>
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

                        {Array.isArray(viewItem.egg_lines) && viewItem.egg_lines.length > 0 && (
                            <div className="sale-egg-lines-view">
                                <h4>Egg Type Breakdown</h4>
                                <div className="table-responsive">
                                    <table className="data-table mockup-table">
                                        <thead>
                                            <tr>
                                                <th>Egg Type</th>
                                                <th>Qty</th>
                                                <th>Unit Price</th>
                                                <th>Line Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewItem.egg_lines.map((line, index) => (
                                                <tr key={`${line.egg_type}-${index}`}>
                                                    <td>{line.egg_type_label || line.egg_type}</td>
                                                    <td>{line.quantity}</td>
                                                    <td>₱{Number(line.unit_price || 0).toFixed(2)}</td>
                                                    <td>₱{Number(line.line_total || 0).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Modal>

            <ExportModal
                open={showExport}
                title="Export Sales"
                description="Choose how you want to export your sales records."
                onClose={() => setShowExport(false)}
                onExport={(format, preparedBy) => exportTableData({
                    title: 'Sales List',
                    columns: salesColumns,
                    rows: filteredSales,
                    format,
                    preparedBy,
                })}
            />
        </PageState>
    );
}
