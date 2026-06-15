import SearchableSelect from '../ui/SearchableSelect';

const INVOICE_PREFIXES = ['SI#', 'DR#'];

export function parseInvoiceNo(invoiceNo) {
    if (!invoiceNo) {
        return { invoice_prefix: 'SI#', invoice_number: '' };
    }

    const matchedPrefix = INVOICE_PREFIXES.find((prefix) => invoiceNo.startsWith(prefix));

    if (matchedPrefix) {
        return {
            invoice_prefix: matchedPrefix,
            invoice_number: invoiceNo.slice(matchedPrefix.length),
        };
    }

    return { invoice_prefix: 'SI#', invoice_number: invoiceNo };
}

export function buildInvoiceNo(prefix, number) {
    return `${prefix || 'SI#'}${String(number || '').trim()}`;
}

export default function SaleForm({ id, form, onChange, onSubmit, customers = [], products = [] }) {
    return (
        <form id={id} onSubmit={onSubmit}>
            <div className="modal-form-grid">
                <div className="form-group">
                    <label>Invoice No.</label>
                    <div className="invoice-no-field">
                        <select
                            className="form-control invoice-no-prefix"
                            value={form.invoice_prefix || 'SI#'}
                            onChange={(event) => onChange('invoice_prefix', event.target.value)}
                            required
                        >
                            {INVOICE_PREFIXES.map((prefix) => (
                                <option key={prefix} value={prefix}>{prefix}</option>
                            ))}
                        </select>
                        <input
                            className="form-control"
                            value={form.invoice_number || ''}
                            onChange={(event) => onChange('invoice_number', event.target.value)}
                            placeholder="Enter number"
                            required
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label>Sale Date</label>
                    <input type="date" className="form-control" value={form.sale_date || ''} onChange={(e) => onChange('sale_date', e.target.value)} required />
                </div>
                <div className="form-group span-2 searchable-select-field">
                    <SearchableSelect
                        label="Customer"
                        placeholder="Choose customer"
                        options={customers}
                        value={form.customer_id || ''}
                        onChange={(value) => onChange('customer_id', value)}
                        getOptionLabel={(customer) => customer.name}
                        getOptionValue={(customer) => customer.id}
                        emptyMessage="No customers found. Add a customer first."
                    />
                </div>
                <div className="form-group">
                    <label>Product</label>
                    <select className="form-control" value={form.product_id || ''} onChange={(e) => onChange('product_id', e.target.value)} required>
                        <option value="">Choose product</option>
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>{product.name} - ₱{product.unit_price}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Quantity</label>
                    <input type="number" className="form-control" value={form.quantity || ''} onChange={(e) => onChange('quantity', e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Unit Price</label>
                    <input type="number" step="0.01" className="form-control" value={form.unit_price || ''} onChange={(e) => onChange('unit_price', e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Payment Method</label>
                    <select className="form-control" value={form.payment_method || ''} onChange={(e) => onChange('payment_method', e.target.value)} required>
                        <option value="">Choose</option>
                        <option value="cash">Cash</option>
                        <option value="credit">Credit</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Status</label>
                    <select className="form-control" value={form.status || ''} onChange={(e) => onChange('status', e.target.value)} required>
                        <option value="">Choose status</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                    </select>
                </div>
            </div>
        </form>
    );
}
