import SearchableSelect from '../ui/SearchableSelect';

export function parseInvoiceNo(invoiceNo) {
    if (!invoiceNo) {
        return { invoice_prefix: 'SI#', invoice_number: '' };
    }

    const matchedPrefix = ['SI#', 'DR#'].find((prefix) => invoiceNo.startsWith(prefix));

    if (matchedPrefix) {
        return {
            invoice_prefix: matchedPrefix,
            invoice_number: invoiceNo.slice(matchedPrefix.length),
        };
    }

    return { invoice_prefix: 'SI#', invoice_number: invoiceNo };
}

function setInvoiceTypeInInvoiceNo(currentInvoiceNo, invoiceType) {
    const { invoice_number } = parseInvoiceNo(currentInvoiceNo);
    const prefix = invoiceType === 'dr' ? 'DR#' : 'SI#';
    return `${prefix}${String(invoice_number || '').trim()}`;
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

export default function SaleForm({ id, form, onChange, onSubmit, customers = [], products = [] }) {
    const normalized = (v) => {
        if (v === '' || v === null || v === undefined) return 0;
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };

    const selectedProduct = products?.find((p) => String(p.id) === String(form?.product_id)) || null;
    const computedUnitPrice = selectedProduct ? normalized(selectedProduct.unit_price) : 0;

    const quantityForAmount = (() => {
        if (form?.sale_category === 'chicken') return normalized(form?.quantity_heads);
        if (form?.sale_category === 'egg') {
            const pricingUnit = form?.pricing_unit || 'per_tray';
            if (pricingUnit === 'per_piece') return normalized(form?.quantity_pieces);
            return normalized(form?.quantity_trays);
        }
        return normalized(form?.quantity);
    })();

    const amountComputed = quantityForAmount * normalized(form?.unit_price);

    return (
        <form id={id} onSubmit={onSubmit}>
            <div className="modal-form-grid">
                <div className="form-group">
                    <label>Invoice Type</label>
                    <select
                        className="form-control"
                        value={(() => {
                            const { invoice_prefix } = parseInvoiceNo(form.invoice_no || '');
                            return invoice_prefix === 'DR#' ? 'dr' : 'si';
                        })()}
                        onChange={(e) => {
                            const invoiceType = e.target.value; // 'si' | 'dr'
                            const nextInvoiceNo = setInvoiceTypeInInvoiceNo(form.invoice_no || '', invoiceType);
                            onChange('invoice_no', nextInvoiceNo);
                        }}
                        required
                    >
                        <option value="si">SI</option>
                        <option value="dr">DR</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Invoice No.</label>
                    <div className="invoice-no-field">
                        <input
                            className="form-control"
                            value={form.invoice_no || ''}
                            onChange={(event) => {
                                const next = event.target.value;
                                onChange('invoice_no', next);
                            }}
                            placeholder="Enter invoice number (e.g., SI#01 / DR#01)"
                            required
                        />
                    </div>
                </div>



                <div className="form-group">
                    <label>Sale Date</label>
                    <input
                        type="date"
                        className="form-control"
                        value={form.sale_date || ''}
                        onChange={(e) => onChange('sale_date', e.target.value)}
                        required
                    />
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
                                    const nextProductId = chickenType ? `chicken_${chickenType}` : '';
                                    onChange('chicken_type', chickenType);
                                    onChange('product_id', nextProductId);

                                    // Auto-fill unit_price from product configuration
                                    const nextSelectedProduct = products?.find((p) => String(p.id) === String(nextProductId));
                                    if (nextSelectedProduct && nextSelectedProduct.unit_price !== undefined) {
                                        onChange('unit_price', nextSelectedProduct.unit_price);
                                    }
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

                        <div className="form-group">
                            <label>Total</label>
                            <div className="form-control" style={{ display: 'flex', alignItems: 'center' }}>
                                <strong style={{ marginRight: 8 }}>₱{Number(amountComputed).toFixed(2)}</strong>
                                <span style={{ color: '#666' }}>
                                    ({quantityForAmount} × {Number(form?.unit_price || 0).toFixed(2)})
                                </span>
                            </div>
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
                                    const nextProductId = eggType === 'piwi' ? 'egg_piwi' : (eggType ? `egg_${eggType}` : '');
                                    onChange('egg_type', eggType);
                                    onChange('product_id', nextProductId);

                                    // Auto-fill unit_price from product configuration
                                    const nextSelectedProduct = products?.find((p) => String(p.id) === String(nextProductId));
                                    if (nextSelectedProduct && nextSelectedProduct.unit_price !== undefined) {
                                        onChange('unit_price', nextSelectedProduct.unit_price);
                                    }
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
                                <option value="piwi">Piwi</option>
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

                        <div className="form-group">
                            <label>Total</label>
                            <div className="form-control" style={{ display: 'flex', alignItems: 'center' }}>
                                <strong style={{ marginRight: 8 }}>₱{Number(amountComputed).toFixed(2)}</strong>
                                <span style={{ color: '#666' }}>
                                    ({quantityForAmount} × {Number(form?.unit_price || 0).toFixed(2)})
                                </span>
                            </div>
                        </div>
                    </>
                ) : null}

                <div className="form-group">
                    <label>Payment Method</label>
                    <select
                        className="form-control"
                        value={form.payment_method || ''}
                        onChange={(e) => onChange('payment_method', e.target.value)}
                        required
                    >
                        <option value="">Choose</option>
                        <option value="cash">Cash</option>
                        <option value="credit">Credit</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Status</label>
                    <select
                        className="form-control"
                        value={form.status || ''}
                        onChange={(e) => onChange('status', e.target.value)}
                        required
                    >
                        <option value="">Choose status</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                    </select>
                </div>
            </div>
        </form>
    );
}

