export default function CustomerForm({ id, customer, onChange, onSubmit }) {
    return (
        <form id={id} onSubmit={onSubmit}>
            <div className="modal-form-grid">
                <div className="form-group span-2">
                    <label>Customer Name</label>
                    <input
                        className="form-control"
                        value={customer.name || ''}
                        onChange={(event) => onChange('name', event.target.value)}
                        placeholder="Enter customer name"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Contact Person</label>
                    <input
                        className="form-control"
                        value={customer.contact || ''}
                        onChange={(event) => onChange('contact', event.target.value)}
                        placeholder="Optional"
                    />
                </div>
                <div className="form-group">
                    <label>Phone</label>
                    <input
                        className="form-control"
                        value={customer.phone || ''}
                        onChange={(event) => onChange('phone', event.target.value)}
                        placeholder="Optional"
                    />
                </div>
                <div className="form-group span-2">
                    <label>Email</label>
                    <input
                        type="email"
                        className="form-control"
                        value={customer.email || ''}
                        onChange={(event) => onChange('email', event.target.value)}
                        placeholder="Optional"
                    />
                </div>
            </div>
        </form>
    );
}
