import SearchableSelect from '../ui/SearchableSelect';
import FormLabel from './FormLabel';

export const EGG_TYPE_OPTIONS = [
    { value: 'piwi', label: 'Piwi' },
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'extra_large', label: 'Extra Large' },
    { value: 'jumbo', label: 'Jumbo' },
    { value: 'super_jumbo', label: 'Super Jumbo' },
];

export function createEmptyEggLine() {
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        egg_type: '',
        product_id: '',
        quantity: '',
        unit_price: '',
    };
}

export function createEmptyChickenLine() {
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        chicken_type: '',
        product_id: '',
        quantity: '',
        unit_price: '',
    };
}

export function findProductByEggType(products, eggType) {
    if (!eggType) return null;

    const option = EGG_TYPE_OPTIONS.find((item) => item.value === eggType);
    const needle = (option?.label || eggType.replace(/_/g, ' ')).toLowerCase();

    return (products || []).find((product) => String(product.name || '').toLowerCase().includes(needle)) || null;
}

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

function normalizedNumber(value) {
    if (value === '' || value === null || value === undefined) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
    return `₱${Number(value || 0).toFixed(2)}`;
}

export function buildEggLinesFromSale(sale) {
    if (Array.isArray(sale?.egg_lines) && sale.egg_lines.length) {
        return sale.egg_lines.map((line, index) => ({
            id: line.id || `line-${index}`,
            egg_type: line.egg_type || '',
            product_id: line.product_id || '',
            quantity: line.quantity ?? '',
            unit_price: line.unit_price ?? '',
        }));
    }

    const quantity = sale?.pricing_unit === 'per_piece'
        ? sale?.quantity_pieces
        : sale?.quantity_trays;

    if (!sale?.egg_type) {
        return [createEmptyEggLine()];
    }

    return [{
        id: 'line-0',
        egg_type: sale.egg_type,
        product_id: sale.product_id || '',
        quantity: quantity ?? sale.quantity ?? '',
        unit_price: sale.unit_price ?? '',
    }];
}

export default function SaleForm({ id, form, onChange, onSubmit, customers = [], products = [] }) {
    const pricingUnit = form?.pricing_unit || 'per_tray';
    const eggLines = form?.egg_lines?.length ? form.egg_lines : [createEmptyEggLine()];
    const chickenLines = form?.chicken_lines?.length ? form.chicken_lines : [createEmptyChickenLine()];

    const eggLinesTotal = eggLines.reduce(
        (sum, line) => sum + normalizedNumber(line.quantity) * normalizedNumber(line.unit_price),
        0
    );

    const updateEggLine = (index, key, value) => {
        const nextLines = eggLines.map((line, lineIndex) => {
            if (lineIndex !== index) return line;

            const updated = { ...line, [key]: value };

            if (key === 'egg_type') {
                const matchedProduct = findProductByEggType(products, value);
                updated.product_id = matchedProduct?.id || '';
                updated.unit_price = matchedProduct?.unit_price ?? '';
            }

            return updated;
        });

        onChange('egg_lines', nextLines);

        if (index === 0) {
            onChange('product_id', nextLines[0]?.product_id || '');
            onChange('egg_type', nextLines[0]?.egg_type || '');
        }
    };

    const updateChickenLine = (index, key, value) => {
        const nextLines = chickenLines.map((line, lineIndex) => {
            if (lineIndex !== index) return line;

            const updated = { ...line, [key]: value };

            if (key === 'chicken_type') {
                const matchedProduct = (products || []).find((product) => (
                    String(product.name || '').toLowerCase().includes(String(value || '').toLowerCase())
                ));
                updated.product_id = matchedProduct?.id || '';
                updated.unit_price = matchedProduct?.unit_price ?? '';
            }

            return updated;
        });

        onChange('chicken_lines', nextLines);

        if (index === 0) {
            onChange('product_id', nextLines[0]?.product_id || '');
            onChange('chicken_type', nextLines[0]?.chicken_type || '');
            onChange('quantity_heads', nextLines[0]?.quantity || '');
            onChange('unit_price', nextLines[0]?.unit_price || '');
        }
    };

    const addEggLine = () => {
        onChange('egg_lines', [...eggLines, createEmptyEggLine()]);
    };

    const addChickenLine = () => {
        onChange('chicken_lines', [...chickenLines, createEmptyChickenLine()]);
    };

    const removeEggLine = (index) => {
        if (eggLines.length <= 1) return;
        const nextLines = eggLines.filter((_, lineIndex) => lineIndex !== index);
        onChange('egg_lines', nextLines);
        onChange('product_id', nextLines[0]?.product_id || '');
        onChange('egg_type', nextLines[0]?.egg_type || '');
    };

    const removeChickenLine = (index) => {
        if (chickenLines.length <= 1) return;
        const nextLines = chickenLines.filter((_, lineIndex) => lineIndex !== index);
        onChange('chicken_lines', nextLines);
        onChange('product_id', nextLines[0]?.product_id || '');
        onChange('chicken_type', nextLines[0]?.chicken_type || '');
        onChange('quantity_heads', nextLines[0]?.quantity || '');
        onChange('unit_price', nextLines[0]?.unit_price || '');
    };

    const usedEggTypes = new Set(eggLines.map((line) => line.egg_type).filter(Boolean));
    const usedChickenTypes = new Set(chickenLines.map((line) => line.chicken_type).filter(Boolean));
    const chickenLinesTotal = chickenLines.reduce(
        (sum, line) => sum + normalizedNumber(line.quantity) * normalizedNumber(line.unit_price),
        0
    );

    return (
        <form id={id} onSubmit={onSubmit}>
            <div className="modal-form-grid">
                <div className="form-group">
                    <FormLabel htmlFor="sale-invoice-type" required>Invoice Type</FormLabel>
                    <select
                        id="sale-invoice-type"
                        className="form-control"
                        value={(() => {
                            const { invoice_prefix } = parseInvoiceNo(form.invoice_no || '');
                            return invoice_prefix === 'DR#' ? 'dr' : 'si';
                        })()}
                        onChange={(event) => {
                            const invoiceType = event.target.value;
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
                    <FormLabel htmlFor="sale-invoice-no-suffix" required>Invoice No.</FormLabel>
                    <div className="invoice-no-field">
                        <input
                            className="form-control invoice-no-prefix"
                            value={(() => {
                                const { invoice_prefix } = parseInvoiceNo(form.invoice_no || '');
                                return invoice_prefix || 'SI#';
                            })()}
                            readOnly
                            aria-label="Invoice prefix"
                            tabIndex={-1}
                        />
                        <input
                            id="sale-invoice-no-suffix"
                            className="form-control"
                            value={(() => {
                                const { invoice_number } = parseInvoiceNo(form.invoice_no || '');
                                return invoice_number || '';
                            })()}
                            onChange={(event) => {
                                const { invoice_prefix } = parseInvoiceNo(form.invoice_no || '');
                                onChange('invoice_no', buildInvoiceNo(invoice_prefix || 'SI#', event.target.value));
                            }}
                            placeholder="Enter invoice number (e.g., 01)"
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <FormLabel htmlFor="sale-date" required>Sale Date</FormLabel>
                    <input
                        id="sale-date"
                        type="date"
                        className="form-control"
                        value={form.sale_date || ''}
                        onChange={(event) => onChange('sale_date', event.target.value)}
                        required
                    />
                </div>

                <div className="form-group span-2 searchable-select-field">
                    <SearchableSelect
                        id="sale-customer"
                        label="Customer"
                        placeholder="Choose customer"
                        options={customers}
                        value={form.customer_id || ''}
                        onChange={(value) => onChange('customer_id', value)}
                        getOptionLabel={(customer) => customer.name}
                        getOptionValue={(customer) => customer.id}
                        emptyMessage="No customers found. Add a customer first."
                        required
                    />
                </div>

                <div className="form-group">
                    <FormLabel htmlFor="sale-category" required>Choose Product Type First</FormLabel>
                    <select
                        id="sale-category"
                        className="form-control"
                        value={form.sale_category || ''}
                        onChange={(event) => {
                            const saleCategory = event.target.value;
                            onChange('sale_category', saleCategory);
                            onChange('product_id', '');

                            if (saleCategory === 'egg') {
                                onChange('egg_lines', [createEmptyEggLine()]);
                                onChange('chicken_lines', []);
                                onChange('pricing_unit', form.pricing_unit || 'per_tray');
                            } else if (saleCategory === 'chicken') {
                                onChange('egg_lines', []);
                                onChange('chicken_lines', [createEmptyChickenLine()]);
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
                        <div className="form-group span-2 sale-egg-lines-wrap">
                            <div className="sale-egg-lines-header">
                                <FormLabel required>Chicken Types</FormLabel>
                                <button type="button" className="btn btn-outline btn-sm" onClick={addChickenLine}>
                                    <i className="bi bi-plus-lg"></i> Add Chicken Type
                                </button>
                            </div>

                            <div className="sale-egg-lines">
                                {chickenLines.map((line, index) => {
                                    const lineTotal = normalizedNumber(line.quantity) * normalizedNumber(line.unit_price);

                                    return (
                                        <div className="sale-egg-line" key={line.id || `chicken-line-${index}`}>
                                            <div className="sale-egg-line-grid">
                                                <div className="form-group">
                                                    <FormLabel required={index === 0}>Chicken Type</FormLabel>
                                                    <select
                                                        className="form-control"
                                                        value={line.chicken_type || ''}
                                                        onChange={(event) => updateChickenLine(index, 'chicken_type', event.target.value)}
                                                        required
                                                    >
                                                        <option value="">Choose chicken type</option>
                                                        <option
                                                            value="grower"
                                                            disabled={usedChickenTypes.has('grower') && line.chicken_type !== 'grower'}
                                                        >
                                                            Grower
                                                        </option>
                                                        <option
                                                            value="layer"
                                                            disabled={usedChickenTypes.has('layer') && line.chicken_type !== 'layer'}
                                                        >
                                                            Layer
                                                        </option>
                                                    </select>
                                                </div>

                                                <div className="form-group">
                                                    <FormLabel required={index === 0}>Quantity (heads)</FormLabel>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={line.quantity || ''}
                                                        onChange={(event) => updateChickenLine(index, 'quantity', event.target.value)}
                                                        min="1"
                                                        required
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <FormLabel required={index === 0}>Unit Price (per head)</FormLabel>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="form-control"
                                                        value={line.unit_price || ''}
                                                        onChange={(event) => updateChickenLine(index, 'unit_price', event.target.value)}
                                                        required
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <FormLabel>Line Total</FormLabel>
                                                    <div className="form-control sale-total-display">
                                                        <strong>{formatCurrency(lineTotal)}</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            {chickenLines.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline btn-sm sale-egg-line-remove"
                                                    onClick={() => removeChickenLine(index)}
                                                >
                                                    <i className="bi bi-trash"></i> Remove
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="form-group span-2">
                            <FormLabel htmlFor="sale-chicken-total">Total Amount</FormLabel>
                            <div id="sale-chicken-total" className="form-control sale-total-display sale-total-display--grand">
                                <strong>{formatCurrency(chickenLinesTotal)}</strong>
                                <span className="sale-total-meta">
                                    Sum of {chickenLines.length} chicken type{chickenLines.length === 1 ? '' : 's'}
                                </span>
                            </div>
                        </div>
                    </>
                ) : form.sale_category === 'egg' ? (
                    <>
                        <div className="form-group">
                            <FormLabel htmlFor="sale-pricing-unit" required>Pricing Unit</FormLabel>
                            <select
                                id="sale-pricing-unit"
                                className="form-control"
                                value={pricingUnit}
                                onChange={(event) => onChange('pricing_unit', event.target.value)}
                                required
                            >
                                <option value="per_tray">Per Tray</option>
                                <option value="per_piece">Per Piece</option>
                            </select>
                        </div>

                        <div className="form-group span-2 sale-egg-lines-wrap">
                            <div className="sale-egg-lines-header">
                                <FormLabel required>Egg Types</FormLabel>
                                <button type="button" className="btn btn-outline btn-sm" onClick={addEggLine}>
                                    <i className="bi bi-plus-lg"></i> Add Egg Type
                                </button>
                            </div>

                            <div className="sale-egg-lines">
                                {eggLines.map((line, index) => {
                                    const lineTotal = normalizedNumber(line.quantity) * normalizedNumber(line.unit_price);
                                    const quantityLabel = pricingUnit === 'per_piece'
                                        ? 'Quantity (pieces)'
                                        : 'Quantity (trays)';

                                    return (
                                        <div className="sale-egg-line" key={line.id || `egg-line-${index}`}>
                                            <div className="sale-egg-line-grid">
                                                <div className="form-group">
                                                    <FormLabel required={index === 0}>Egg Type</FormLabel>
                                                    <select
                                                        className="form-control"
                                                        value={line.egg_type || ''}
                                                        onChange={(event) => updateEggLine(index, 'egg_type', event.target.value)}
                                                        required
                                                    >
                                                        <option value="">Choose egg type</option>
                                                        {EGG_TYPE_OPTIONS.map((option) => (
                                                            <option
                                                                key={option.value}
                                                                value={option.value}
                                                                disabled={usedEggTypes.has(option.value) && line.egg_type !== option.value}
                                                            >
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="form-group">
                                                    <FormLabel required={index === 0}>{quantityLabel}</FormLabel>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={line.quantity || ''}
                                                        onChange={(event) => updateEggLine(index, 'quantity', event.target.value)}
                                                        min="1"
                                                        required
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <FormLabel required={index === 0}>Unit Price</FormLabel>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="form-control"
                                                        value={line.unit_price || ''}
                                                        onChange={(event) => updateEggLine(index, 'unit_price', event.target.value)}
                                                        required
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <FormLabel>Line Total</FormLabel>
                                                    <div className="form-control sale-total-display">
                                                        <strong>{formatCurrency(lineTotal)}</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            {eggLines.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline btn-sm sale-egg-line-remove"
                                                    onClick={() => removeEggLine(index)}
                                                >
                                                    <i className="bi bi-trash"></i> Remove
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="form-group span-2">
                            <FormLabel htmlFor="sale-egg-total">Total Amount</FormLabel>
                            <div id="sale-egg-total" className="form-control sale-total-display sale-total-display--grand">
                                <strong>{formatCurrency(eggLinesTotal)}</strong>
                                <span className="sale-total-meta">
                                    Sum of {eggLines.length} egg type{eggLines.length === 1 ? '' : 's'}
                                </span>
                            </div>
                        </div>
                    </>
                ) : null}

                <div className="form-group">
                    <FormLabel htmlFor="sale-payment-method" required>Payment Method</FormLabel>
                    <select
                        id="sale-payment-method"
                        className="form-control"
                        value={form.payment_method || ''}
                        onChange={(event) => onChange('payment_method', event.target.value)}
                        required
                    >
                        <option value="">Choose</option>
                        <option value="cash">Cash</option>
                        <option value="credit">Credit</option>
                    </select>
                </div>

                <div className="form-group">
                    <FormLabel htmlFor="sale-status" required>Status</FormLabel>
                    <select
                        id="sale-status"
                        className="form-control"
                        value={form.status || ''}
                        onChange={(event) => onChange('status', event.target.value)}
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
