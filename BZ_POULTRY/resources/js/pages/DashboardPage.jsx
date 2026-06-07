import { useEffect, useState } from 'react';
import axios from 'axios';

export default function DashboardPage() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get('/api/dashboard').then((response) => {
            setDashboard(response.data);
        }).catch((err) => {
            setError(err.message);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <p>Loading dashboard...</p>;
    }

    if (error) {
        return <div className="alert-error">Unable to load dashboard: {error}</div>;
    }

    const summary = dashboard.summary || {};

    return (
        <>
            <div className="stat-cards">
                <div className="stat-card"><div className="label">Total Poultry</div><div className="value">{summary.totalPoultry ?? 0}</div></div>
                <div className="stat-card"><div className="label">Eggs Today</div><div className="value">{summary.eggsToday ?? 0}</div></div>
                <div className="stat-card"><div className="label">Feed in Stock</div><div className="value">{summary.feedStock ?? 0}</div></div>
                <div className="stat-card"><div className="label">Medicine in Stock</div><div className="value">{summary.medicineStock ?? 0}</div></div>
                <div className="stat-card"><div className="label">Sales Today</div><div className="value">₱{Number(summary.salesToday ?? 0).toFixed(2)}</div></div>
            </div>
            <div className="grid-2">
                <div className="card">
                    <div className="card-header"><h3>Low Stock Alerts</h3></div>
                    <div className="card-body">
                        <ul className="alert-list">
                            {dashboard.lowStockAlerts?.length ? dashboard.lowStockAlerts.map((alert, index) => (
                                <li key={index}><i className="bi bi-exclamation-triangle alert-icon"></i><div><strong>{alert.name}</strong><div className="activity-time">{alert.category} · {alert.days_left} Days Left</div></div></li>
                            )) : <li style={{ color: '#6c757d' }}>No low stock alerts</li>}
                        </ul>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header"><h3>Recent Activities</h3></div>
                    <div className="card-body">
                        <ul className="activity-list">
                            {dashboard.recentActivities?.map((item) => (
                                <li key={item.id}><div className="activity-dot"></div><div>{item.description}<div className="activity-time">{new Date(item.created_at).toLocaleString()}</div></div></li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}
