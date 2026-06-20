import FormLabel from './FormLabel';

export default function CustomerForm({ id, customer, onChange, onSubmit }) {
    return (
        <form id={id} onSubmit={onSubmit}>
            <div className="modal-form-grid">
                <div className="form-group span-2">
                    <FormLabel htmlFor="customer-name" required>Customer Name</FormLabel>
                    <input
                        id="customer-name"
                        className="form-control"
                        value={customer.name || ''}
                        onChange={(event) => onChange('name', event.target.value)}
                        placeholder="Enter customer name"
                        required
                    />
                </div>
                <div className="form-group">
                    <FormLabel htmlFor="customer-contact">Contact Person</FormLabel>
                    <input
                        id="customer-contact"
                        className="form-control"
                        value={customer.contact || ''}
                        onChange={(event) => onChange('contact', event.target.value)}
                        placeholder="Optional"
                    />
                </div>
                <div className="form-group">
                    <FormLabel htmlFor="customer-phone">Phone</FormLabel>
                    <input
                        id="customer-phone"
                        className="form-control"
                        value={customer.phone || ''}
                        onChange={(event) => onChange('phone', event.target.value)}
                        placeholder="Optional"
                    />
                </div>
                <div className="form-group span-2">
                    <FormLabel htmlFor="customer-email">Email</FormLabel>
                    <input
                        id="customer-email"
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
