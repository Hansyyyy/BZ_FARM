import useFetch from '../hooks/useFetch';
import PageState from '../components/ui/PageState';
import SummaryCards from '../components/ui/SummaryCards';
import PanelCard from '../components/ui/PanelCard';
import RecentActivities from '../components/ui/RecentActivities';

const dashboardFields = [
    { key: 'totalPoultry', label: 'Total Poultry', sub: 'Bird in Stock' },
    { key: 'eggsToday', label: 'Eggs Today', sub: 'Collected Today' },
    { key: 'feedStock', label: 'Feed in Stock', sub: 'Kilograms Available' },
    { key: 'medicineStock', label: 'Medicine in Stock', sub: 'Units Available' },
    { key: 'salesToday', label: 'Sales Today', sub: 'Revenue Today' },
];

export default function DashboardPage() {
    const { data: dashboard, loading, error } = useFetch('/api/dashboard');
    const summary = dashboard?.summary || {};

    return (
        <PageState loading={loading} error={error ? `Unable to load dashboard: ${error}` : null} loadingLabel="Loading dashboard...">
            <SummaryCards fields={dashboardFields} summary={summary} />
            <div className="grid-2 stock-widgets">
                <PanelCard title="Low Stock Alerts" actionLabel="View All">
                    <ul className="recent-activities">
                        {dashboard?.lowStockAlerts?.length ? dashboard.lowStockAlerts.map((alert, index) => (
                            <li key={index}>
                                <span className="activity-icon activity-icon-red"></span>
                                <div className="activity-content">
                                    <strong>{alert.name}</strong>
                                    <p>{alert.category} · {alert.days_left} days left</p>
                                </div>
                            </li>
                        )) : <li className="empty-state">No low stock alerts</li>}
                    </ul>
                </PanelCard>
                <PanelCard title="Recent Activities" actionLabel="View All">
                    <RecentActivities activities={dashboard?.recentActivities} />
                </PanelCard>
            </div>
        </PageState>
    );
}
