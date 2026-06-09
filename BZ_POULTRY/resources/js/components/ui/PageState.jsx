import Loading from './Loading';

export default function PageState({ loading, error, loadingLabel = 'Loading...', children }) {
    if (loading) {
        return <Loading label={loadingLabel} />;
    }

    if (error) {
        return <div className="alert-error">{error}</div>;
    }

    return children;
}
