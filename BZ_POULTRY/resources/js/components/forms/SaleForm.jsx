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

const EGG_PRODUCTS = [
    { id: 'egg_small', name: 'Small Eggs' },
    { id: 'egg_medium', name: 'Medium Eggs' },
    { id: 'egg_large', name: 'Large Eggs' },
    { id: 'egg_extra_large', name: 'Extra Large Eggs' },
    { id: 'egg_jumbo', name: 'Jumbo Eggs' },
    { id: 'egg_super_jumbo', name: 'Super Jumbo Eggs' },
];

const CHICKEN_PRODUCTS = [
    { id: 'chicken_grower', name: 'Grower Chicken' },
    { id: 'chicken_layer', name: 'Layer Chicken' },
];

export default function SaleForm({ id, form, onChange, onSubmit, customers = [] }) {
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
                            placeholder={form.id ? 'Enter number' : 'Auto-generated (starts at 01)'}
                            required={Boolean(form.id)}
                            disabled={!form.id}
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
                    <label>Choose Product Type First</label>
                    <select
                        className="form-control"
                        value={form.sale_category || ''}
                        onChange={(e) => {
                            const saleCategory = e.target.value;
                            onChange('sale_category', saleCategory);
                            onChange('product_id', '');

                            if (saleCategory === 'egg') {
                                onChange('product_id', EGG_PRODUCTS[0].id);
                            } else if (saleCategory === 'chicken') {
                                onChange('product_id', CHICKEN_PRODUCTS[0].id);
                            }
                        }}
                        required
                    >
                        <option value="">Select product type</option>
                        <option value="egg">Eggs</option>
                        <option value="chicken">Chicken</option>
                    </select>
                </div>


                {form.sale_category === 'chicken' ? (
                    <>
                        <div className="form-group">
                            <label>Chicken Type</label>
                            <select
                                className="form-control"
                                value={form.chicken_type || ''}
                                onChange={(e) => {
                                    const chickenType = e.target.value;
                                    onChange('chicken_type', chickenType);
                                    onChange('product_id', chickenType ? `chicken_${chickenType}` : '');
                                }}
                                required
                            >
                                <option value="">Choose chicken type</option>
                                <option value="grower">Grower</option>
                                <option value="layer">Layer</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>How many chickens?</label>
                            <input
                                type="number"
                                className="form-control"
                                value={form.quantity_heads || ''}
                                onChange={(e) => onChange('quantity_heads', e.target.value)}
                                min="1"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Unit Price (per head)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                value={form.unit_price || ''}
                                onChange={(e) => onChange('unit_price', e.target.value)}
                                required
                            />
                        </div>
                    </>
                ) : form.sale_category === 'egg' ? (
                    <>
                        <div className="form-group">
                            <label>Egg Type</label>
                            <select
                                className="form-control"
                                value={form.egg_type || ''}
                                onChange={(e) => {
                                    const eggType = e.target.value;
                                    onChange('egg_type', eggType);
                                    onChange('product_id', eggType ? `egg_${eggType}` : '');
                                }}
                                required
                            >
                                <option value="">Choose egg type</option>
                                <option value="small">Small</option>
                                <option value="medium">Medium</option>
                                <option value="large">Large</option>
                                <option value="extra_large">Extra Large</option>
                                <option value="jumbo">Jumbo</option>
                                <option value="super_jumbo">Super Jumbo</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Pricing Unit</label>
                            <select
                                className="form-control"
                                value={form.pricing_unit || 'per_tray'}
                                onChange={(e) => onChange('pricing_unit', e.target.value)}
                                required
                            >
                                <option value="per_tray">Per Tray</option>
                                <option value="per_piece">Per Piece</option>
                            </select>
                        </div>
                        {(form.pricing_unit || 'per_tray') === 'per_piece' ? (
                            <div className="form-group">
                                <label>How many eggs (pieces)?</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={form.quantity_pieces || ''}
                                    onChange={(e) => onChange('quantity_pieces', e.target.value)}
                                    min="1"
                                    required
                                />
                            </div>
                        ) : (
                            <div className="form-group">
                                <label>How many eggs (trays)?</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={form.quantity_trays || ''}
                                    onChange={(e) => onChange('quantity_trays', e.target.value)}
                                    min="1"
                                    required
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label>Unit Price</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                value={form.unit_price || ''}
                                onChange={(e) => onChange('unit_price', e.target.value)}
                                required
                            />
                        </div>
                    </>
                ) : null}
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
