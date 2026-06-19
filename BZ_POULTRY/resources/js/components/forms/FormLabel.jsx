export default function FormLabel({ htmlFor, children, required = false }) {
    return (
        <label htmlFor={htmlFor} className="form-label">
            {children}
            {required ? <span className="form-required-mark" aria-hidden="true"> *</span> : null}
        </label>
    );
}
