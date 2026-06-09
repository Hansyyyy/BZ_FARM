import useFetch from '../hooks/useFetch';
import PageState from '../components/ui/PageState';
import SummaryCards from '../components/ui/SummaryCards';
import PanelCard from '../components/ui/PanelCard';
import RecentActivities from '../components/ui/RecentActivities';
import SegmentDonut from '../components/ui/SegmentDonut';
import VerticalBarChart from '../components/ui/VerticalBarChart';
import HorizontalStatBars from '../components/ui/HorizontalStatBars';

const dashboardFields = [
    { key: 'totalPoultry', label: 'Total Poultry', sub: 'Bird in Stock' },
    { key: 'eggsToday', label: 'Eggs Today', sub: 'Collected Today' },
    { key: 'feedStock', label: 'Feed in Stock', sub: 'Kilograms Available' },
    { key: 'medicineStock', label: 'Medicine in Stock', sub: 'Units Available' },
    { key: 'salesToday', label: 'Sales Today', sub: 'Revenue Today' },
];

const inventoryColors = {
    feed: '#2d6a4f',
    medicine: '#40916c',
    supplies: '#52b788',
    others: '#95d5b2',
};

const inventoryLabels = {
    feed: 'Feed',
    medicine: 'Medicine',
    supplies: 'Supplies',
    others: 'Others',
};

function formatTxnDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
    const { data: dashboard, loading, error } = useFetch('/api/dashboard');
    const summary = dashboard?.summary || {};
    const eggSummary = summary.eggSummary || {};

    const inventorySegments = Object.entries(dashboard?.inventoryBreakdown || {}).map(([key, value]) => ({
        key,
        label: inventoryLabels[key] || key,
        value: Number(value) || 0,
        color: inventoryColors[key] || '#2d6a4f',
    }));

    const flockSegments = [
        { key: 'layers', label: 'Layers', value: dashboard?.flockDistribution?.layers || 0, color: '#2d6a4f' },
        { key: 'pullets', label: 'Pullets', value: dashboard?.flockDistribution?.pullets || 0, color: '#f4b942' },
        { key: 'roosters', label: 'Roosters', value: dashboard?.flockDistribution?.roosters || 0, color: '#4a90d9' },
    ];

    const eggQualitySegments = [
        { key: 'good', label: 'Good Eggs', value: dashboard?.eggQuality?.good || 0, color: '#2d6a4f' },
        { key: 'cracked', label: 'Cracked', value: dashboard?.eggQuality?.cracked || 0, color: '#dc3545' },
    ];

    const eggSummaryBars = [
        { label: 'Today', value: eggSummary.today, suffix: 'eggs', color: '#2d6a4f' },
        { label: 'This Week', value: eggSummary.week, suffix: 'eggs', color: '#40916c' },
        { label: 'This Month', value: eggSummary.month, suffix: 'eggs', color: '#52b788' },
        { label: 'Daily Average', value: eggSummary.daily_avg, suffix: 'eggs', color: '#74c69d' },
    ];

    return (
        <PageState loading={loading} error={error ? `Unable to load dashboard: ${error}` : null} loadingLabel="Loading dashboard...">
            <SummaryCards fields={dashboardFields} summary={summary} />

            <div className="grid-3 dashboard-infographics">
                <PanelCard title="Egg Production (This Week)">
                    <div className="chart-container">
                        <VerticalBarChart
                            data={dashboard?.weeklyProduction || []}
                            valueKey="total"
                            labelKey="label"
                        />
                    </div>
                </PanelCard>

                <PanelCard title="Inventory Status">
                    <SegmentDonut
                        segments={inventorySegments}
                        centerLabel="Stock"
                    />
                </PanelCard>

                <PanelCard title="Poultry Distribution">
                    <SegmentDonut
                        segments={flockSegments}
                        total={summary.totalPoultry}
                        centerLabel="Birds"
                    />
                </PanelCard>
            </div>

            <div className="grid-3 dashboard-infographics">
                <PanelCard title="Egg Quality (This Week)">
                    <SegmentDonut
                        segments={eggQualitySegments}
                        centerLabel="Eggs"
                    />
                </PanelCard>

                <PanelCard title="Egg Production Summary">
                    <HorizontalStatBars items={eggSummaryBars} />
                </PanelCard>

                <PanelCard title="Low Stock Alerts">
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
            </div>

            <div className="grid-2 stock-widgets">
                <PanelCard title="Recent Inventory Transactions">
                    <div className="table-wrap dashboard-txn-table">
                        <table className="data-table mockup-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Item</th>
                                    <th>Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboard?.recentTransactions?.length ? dashboard.recentTransactions.map((txn) => (
                                    <tr key={txn.id}>
                                        <td>{formatTxnDate(txn.created_at)}</td>
                                        <td>
                                            <span className={`txn-type-${txn.type}`}>
                                                {txn.type === 'in' ? 'In' : 'Out'}
                                            </span>
                                        </td>
                                        <td>{txn.item_name}</td>
                                        <td>{Number(txn.quantity).toLocaleString()}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="empty-state">No recent transactions</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </PanelCard>

                <PanelCard title="Recent Activities">
                    <RecentActivities activities={dashboard?.recentActivities} />
                </PanelCard>
            </div>
        </PageState>
    );
}
