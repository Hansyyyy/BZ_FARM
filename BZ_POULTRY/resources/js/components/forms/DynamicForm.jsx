export default function DynamicForm({ id, fields, values, onChange, onSubmit }) {
    return (
        <form id={id} onSubmit={onSubmit}>
            <div className="modal-form-grid">
                {fields.map((field) => (
                    <div className="form-group" key={field.key}>
                        <label>{field.label}</label>
                        {field.type === 'select' ? (
                            <select
                                className="form-control"
                                value={values[field.key] || ''}
                                onChange={(event) => onChange(field.key, event.target.value)}
                                disabled={field.readOnly}
                            >
                                <option value="">Select {field.label}</option>
                                {(field.options || []).map((option) => {
                                    const value = typeof option === 'object' ? option.value : option;
                                    const label = typeof option === 'object' ? option.label : option;

                                    return <option key={value} value={value}>{label}</option>;
                                })}
                            </select>
                        ) : (
                            <input
                                className="form-control"
                                type={field.type}
                                value={values[field.key] ?? ''}
                                onChange={(event) => onChange(field.key, event.target.value)}
                                required={field.type !== 'date' && !field.readOnly}
                                readOnly={field.readOnly}
                                disabled={field.readOnly}
                            />
                        )}
                    </div>
                ))}
            </div>
        </form>
    );
}
