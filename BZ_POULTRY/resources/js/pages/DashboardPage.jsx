import { Link } from 'react-router-dom';
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
    { key: 'salesToday', label: 'Sales Today', sub: 'Revenue Today', icon: 'bi-cash-stack', tone: 'success', prefix: '₱' },
];

const quickMetrics = [
    { key: 'feedLow', label: 'Low Feed Items', icon: 'bi-exclamation-triangle', tone: 'orange' },
    { key: 'medicineLow', label: 'Low Medicine Items', icon: 'bi-capsule', tone: 'pink' },
    { key: 'layers', label: 'Layer Birds', icon: 'bi-diagram-3', tone: 'purple', source: 'flock' },
    { key: 'pullets', label: 'Pullet Birds', icon: 'bi-egg-fried', tone: 'blue', source: 'flock' },
];

function formatTxnDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTodayLabel() {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function buildSummaryItems(summary) {
    return dashboardFields.map((field) => ({
        key: field.key,
        label: field.label,
        value: `${field.prefix || ''}${Number(summary[field.key] ?? 0).toLocaleString()}${field.suffix || ''}`,
        sub: field.sub,
        tone: field.tone || 'default',
        icon: field.icon,
    }));
}

export default function DashboardPage() {
    const { data: dashboard, loading, error } = useFetch('/api/dashboard');
    const summary = dashboard?.summary || {};
    const eggSummary = summary.eggSummary || {};
    const flockDistribution = dashboard?.flockDistribution || {};
    const inventoryRows = buildInventorySegments(dashboard?.inventoryBreakdown);

    return (
        <PageState loading={loading} error={error ? `Unable to load dashboard: ${error}` : null} loadingLabel="Loading dashboard...">
            <SummaryCards items={buildSummaryItems(summary)} columns={5} />

            <div className="dashboard-coach">
                <div className="dashboard-col dashboard-col-left">
                    <PanelCard
                        title="Today's Snapshot"
                        actionLabel="View reports"
                        actionTo="/daily-reports"
                        className="snapshot-card"
                    >
                        <div className="snapshot-meta">
                            <span className="snapshot-tag">Daily Operations</span>
                            <span className="snapshot-date">{formatTodayLabel()}</span>
                        </div>
                        <div className="snapshot-stats-row">
                            <div className="snapshot-stat">
                                <div className="snapshot-team-icon"><i className="bi bi-basket"></i></div>
                                <strong>{Number(summary.eggsToday || 0).toLocaleString()}</strong>
                                <span>Eggs Collected</span>
                            </div>
                            <div className="snapshot-stat">
                                <div className="snapshot-team-icon snapshot-team-icon-alt"><i className="bi bi-cash-stack"></i></div>
                                <strong>₱{Number(summary.salesToday || 0).toLocaleString()}</strong>
                                <span>Sales Revenue</span>
                            </div>
                            <div className="snapshot-stat">
                                <div className="snapshot-team-icon snapshot-team-icon-feed"><i className="bi bi-egg-fried"></i></div>
                                <strong>{Number(summary.totalPoultry || 0).toLocaleString()}</strong>
                                <span>Active Birds</span>
                            </div>
                        </div>
                    </PanelCard>

                    <PanelCard
                        title="Inventory Overview"
                        actionLabel="View all"
                        actionTo="/inventory-stock"
                        className="standings-card"
                    >
                        <div className="table-wrap standings-table">
                            <table className="data-table mockup-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Category</th>
                                        <th>Stock</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventoryRows.length ? inventoryRows.map((row, index) => (
                                        <tr key={row.key} className={index === 0 ? 'highlight-row' : ''}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <span className="standings-team">
                                                    <span className="standings-dot" style={{ background: row.color }}></span>
                                                    {row.label}
                                                </span>
                                            </td>
                                            <td>{row.value.toLocaleString()}</td>
                                            <td>
                                                <span className={`inventory-status ${row.value > 0 ? 'inventory-status-ok' : 'inventory-status-low'}`}>
                                                    {row.value > 0 ? 'In stock' : 'Empty'}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="empty-state">No inventory data</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </PanelCard>

                    <PanelCard title="Egg Production" subtitle="Total eggs collected this week" actionLabel="View stock" actionTo="/chicken-stock?tab=eggs">
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
                </div>

                <div className="dashboard-col dashboard-col-right">
                    <PanelCard
                        title="Production Summary"
                        actionLabel="View all"
                        actionTo="/daily-reports"
                        className="production-stat-card"
                    >
                        <HorizontalStatBars items={buildEggSummaryBars(eggSummary)} />
                    </PanelCard>

                    <div className="metric-tiles-grid">
                        {quickMetrics.map((tile) => {
                            const raw = tile.source === 'flock'
                                ? flockDistribution[tile.key] ?? 0
                                : summary[tile.key] ?? 0;

                            return (
                                <div className={`metric-tile tone-${tile.tone}`} key={tile.key}>
                                    <span className="metric-tile-icon"><i className={`bi ${tile.icon}`}></i></span>
                                    <div>
                                        <span className="metric-tile-label">{tile.label}</span>
                                        <strong className="metric-tile-value">{Number(raw).toLocaleString()}</strong>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="dashboard-cta-banner">
                        <div className="dashboard-cta-content">
                            <span className="dashboard-cta-kicker">Don't forget</span>
                            <h3>Submit your daily farm report</h3>
                            <Link to="/daily-reports" className="dashboard-cta-btn">Go to daily reports</Link>
                        </div>
                        <div className="dashboard-cta-art" aria-hidden="true">
                            <span></span><span></span><span></span>
                        </div>
                    </div>

                    <div className="dashboard-charts-grid">
                        <PanelCard title="Inventory Mix" subtitle="Stock by category">
                            <SegmentDonut
                                segments={inventoryRows}
                                centerLabel="Stock"
                            />
                        </PanelCard>

                        <PanelCard title="Poultry Distribution" subtitle="Active birds by type">
                            <SegmentDonut
                                segments={buildFlockSegments(flockDistribution)}
                                total={summary.totalPoultry}
                                centerLabel="Birds"
                            />
                        </PanelCard>
                    </div>
                </div>
            </div>

            <section className="page-section">
                <div className="section-heading">
                    <h2>Quality & Alerts</h2>
                    <p>Egg quality breakdown and stock warnings.</p>
                </div>
                <div className="grid-3 dashboard-infographics">
                    <PanelCard title="Egg Quality" subtitle="Defect breakdown this week">
                        <SegmentDonut
                            segments={buildEggQualitySegments(dashboard?.eggQuality)}
                            centerLabel="Eggs"
                        />
                    </PanelCard>

                    <PanelCard title="Low Stock Alerts" subtitle="Items needing attention">
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

                    <PanelCard title="Recent Activities" subtitle="Latest manager actions">
                        <RecentActivities activities={dashboard?.recentActivities} />
                    </PanelCard>
                </div>
            </section>

            <section className="page-section">
                <div className="section-heading">
                    <h2>Recent Transactions</h2>
                    <p>Latest inventory movements across the farm.</p>
                </div>
                <PanelCard title="Inventory Transactions" actionLabel="View stock" actionTo="/inventory-stock">
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
            </section>
        </PageState>
    );
}
