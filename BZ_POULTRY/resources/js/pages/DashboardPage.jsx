import useFetch from '../hooks/useFetch';
import PageState from '../components/ui/PageState';
import SummaryCards from '../components/ui/SummaryCards';
import PanelCard from '../components/ui/PanelCard';
import RecentActivities from '../components/ui/RecentActivities';
import SegmentDonut from '../components/ui/SegmentDonut';
import VerticalBarChart from '../components/ui/VerticalBarChart';
import HorizontalStatBars from '../components/ui/HorizontalStatBars';
import {
    buildEggQualitySegments,
    buildEggSummaryBars,
    buildFlockSegments,
    buildInventorySegments,
    chartColors,
} from '../config/chartTheme';

const dashboardFields = [
    { key: 'totalPoultry', label: 'Total Poultry', sub: 'Birds in Stock', icon: 'bi-egg-fried' },
    { key: 'eggsToday', label: 'Eggs Today', sub: 'Collected Today', icon: 'bi-basket' },
    { key: 'feedStock', label: 'Feed in Stock', sub: 'Kilograms Available', icon: 'bi-box-seam' },
    { key: 'medicineStock', label: 'Medicine in Stock', sub: 'Units Available', icon: 'bi-capsule' },
    { key: 'salesToday', label: 'Sales Today', sub: 'Revenue Today', icon: 'bi-cash-stack', tone: 'success' },
];

function formatTxnDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
    const { data: dashboard, loading, error } = useFetch('/api/dashboard');
    const summary = dashboard?.summary || {};
    const eggSummary = summary.eggSummary || {};

    return (
        <PageState loading={loading} error={error ? `Unable to load dashboard: ${error}` : null} loadingLabel="Loading dashboard...">
            <SummaryCards fields={dashboardFields} summary={summary} />

            <section className="page-section">
                <div className="section-heading">
                    <h2>Production Overview</h2>
                    <p>Weekly trends and distribution across your farm operations.</p>
                </div>
                <div className="grid-3 dashboard-infographics">
                    <PanelCard title="Egg Production" subtitle="Good eggs collected this week" icon="bi-bar-chart-line">
                        <div className="chart-container">
                            <VerticalBarChart
                                data={dashboard?.weeklyProduction || []}
                                valueKey="total"
                                labelKey="label"
                                color={chartColors.bar}
                                emptyLabel="No egg production data this week."
                            />
                        </div>
                    </PanelCard>

                    <PanelCard title="Inventory Mix" subtitle="Stock levels by category" icon="bi-pie-chart">
                        <SegmentDonut
                            segments={buildInventorySegments(dashboard?.inventoryBreakdown)}
                            centerLabel="Stock"
                        />
                    </PanelCard>

                    <PanelCard title="Poultry Distribution" subtitle="Active birds by type" icon="bi-diagram-3">
                        <SegmentDonut
                            segments={buildFlockSegments(dashboard?.flockDistribution)}
                            total={summary.totalPoultry}
                            centerLabel="Birds"
                        />
                    </PanelCard>
                </div>
            </section>

            <section className="page-section">
                <div className="section-heading">
                    <h2>Quality & Alerts</h2>
                    <p>Egg quality breakdown, production totals, and stock warnings.</p>
                </div>
                <div className="grid-3 dashboard-infographics">
                    <PanelCard title="Egg Quality" subtitle="Good vs cracked this week" icon="bi-shield-check">
                        <SegmentDonut
                            segments={buildEggQualitySegments(dashboard?.eggQuality)}
                            centerLabel="Eggs"
                        />
                    </PanelCard>

                    <PanelCard title="Production Summary" subtitle="Collected eggs by period" icon="bi-graph-up">
                        <HorizontalStatBars items={buildEggSummaryBars(eggSummary)} />
                    </PanelCard>

                    <PanelCard title="Low Stock Alerts" subtitle="Items needing attention" icon="bi-exclamation-triangle">
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
            </section>

            <section className="page-section">
                <div className="section-heading">
                    <h2>Recent Activity</h2>
                    <p>Latest inventory movements and manager actions.</p>
                </div>
                <div className="grid-2 stock-widgets">
                    <PanelCard title="Inventory Transactions" icon="bi-arrow-left-right">
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

                    <PanelCard title="Recent Activities" icon="bi-clock-history">
                        <RecentActivities activities={dashboard?.recentActivities} />
                    </PanelCard>
                </div>
            </section>
        </PageState>
    );
}
