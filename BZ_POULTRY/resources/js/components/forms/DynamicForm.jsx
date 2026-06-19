import FormLabel from './FormLabel';

function fieldId(field) {
    return `field-${field.key}`;
}

export default function DynamicForm({ id, fields, values, onChange, onSubmit }) {
    const hasRequiredFields = fields.some((field) => field.required && !field.readOnly);

    return (
        <form id={id} onSubmit={onSubmit} noValidate={false}>
            {hasRequiredFields && (
                <p className="form-required-note">
                    Fields marked with <span className="form-required-mark">*</span> are required.
                </p>
            )}
            <div className="modal-form-grid">
                {fields.map((field) => {
                    const isRequired = Boolean(field.required) && !field.readOnly;
                    const inputId = fieldId(field);

                    if (field.type === 'textarea') {
                        return (
                            <div className={`form-group ${field.span === 2 ? 'span-2' : ''}`} key={field.key}>
                                <FormLabel htmlFor={inputId} required={isRequired}>{field.label}</FormLabel>
                                <textarea
                                    id={inputId}
                                    className="form-control"
                                    value={values[field.key] ?? ''}
                                    onChange={(event) => onChange(field.key, event.target.value)}
                                    required={isRequired}
                                    readOnly={field.readOnly}
                                    disabled={field.readOnly}
                                    rows={field.rows || 3}
                                    placeholder={field.placeholder || ''}
                                />
                            </div>
                        );
                    }

                    if (field.type === 'select') {
                        return (
                            <div className={`form-group ${field.span === 2 ? 'span-2' : ''}`} key={field.key}>
                                <FormLabel htmlFor={inputId} required={isRequired}>{field.label}</FormLabel>
                                <select
                                    id={inputId}
                                    className="form-control"
                                    value={values[field.key] || ''}
                                    onChange={(event) => onChange(field.key, event.target.value)}
                                    disabled={field.readOnly}
                                    required={isRequired}
                                >
                                    <option value="" disabled={isRequired}>
                                        {isRequired ? `Select ${field.label}` : `Choose ${field.label}`}
                                    </option>
                                    {(field.options || []).map((option) => {
                                        const value = typeof option === 'object' ? option.value : option;
                                        const label = typeof option === 'object' ? option.label : option;

                                        return <option key={value} value={value}>{label}</option>;
                                    })}
                                </select>
                            </div>
                        );
                    }

                    return (
                        <div className={`form-group ${field.span === 2 ? 'span-2' : ''}`} key={field.key}>
                            <FormLabel htmlFor={inputId} required={isRequired}>{field.label}</FormLabel>
                            <input
                                id={inputId}
                                className="form-control"
                                type={field.type}
                                value={values[field.key] ?? ''}
                                onChange={(event) => onChange(field.key, event.target.value)}
                                required={isRequired}
                                readOnly={field.readOnly}
                                disabled={field.readOnly}
                                min={field.min}
                                step={field.step}
                                placeholder={field.placeholder || ''}
                            />
                        </div>
                    );
                })}
            </div>
        </form>
    );
}
