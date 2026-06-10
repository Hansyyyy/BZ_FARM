import { Link } from 'react-router-dom';

export default function NotFoundPage() {
    return (
        <div className="centered-page">
            <div className="card card-large">
                <div className="card-body">
                    <div className="not-found-icon">
                        <i className="bi bi-compass"></i>
                    </div>
                    <h1>404</h1>
                    <p>The page you are looking for was not found or may have been moved.</p>
                    <Link to="/" className="btn btn-primary">Go back home</Link>
                </div>
            </div>
        </div>
    );
}
