export default function Loading({ label = 'Loading...' }) {
    return (
        <div className="page-loading">
            <div className="spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
            </div>
            <p>{label}</p>
        </div>
    );
}
