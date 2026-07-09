import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import PageState from '../components/ui/PageState';
import SummaryCards from '../components/ui/SummaryCards';
import PanelCard from '../components/ui/PanelCard';
import RecentActivities from '../components/ui/RecentActivities';
import VerticalBarChart from '../components/ui/VerticalBarChart';
import FarmCalendar from '../components/ui/FarmCalendar';
import { buildInventorySegments, chartColors } from '../config/chartTheme';

const dashboardFields = [
    { key: 'totalPoultry', label: 'Total Poultry', sub: 'Birds in Stock', icon: 'bi-egg-fried' },
    { key: 'eggsToday', label: 'Eggs Today', sub: 'Collected Today', icon: 'bi-basket' },
    { key: 'salesToday', label: 'Sales Today', sub: 'Revenue Today', icon: 'bi-cash-stack', tone: 'success', prefix: '₱' },
    { key: 'mortality', label: 'Mortality', sub: 'Birds Lost', icon: 'bi-heartbreak', tone: 'danger' },
    { key: 'cull', label: 'Cull', sub: 'Birds Culled', icon: 'bi-scissors', tone: 'warning' },
];

const quickMetrics = [
    { key: 'feedLow', label: 'Low Feed Items', icon: 'bi-exclamation-triangle', tone: 'orange' },
    { key: 'medicineLow', label: 'Low Medicine Items', icon: 'bi-capsule', tone: 'pink' },
    { key: 'layers', label: 'Layer Birds', icon: 'bi-diagram-3', tone: 'purple', source: 'flock' },
    { key: 'growers', label: 'Grower Birds', icon: 'bi-egg-fried', tone: 'blue', source: 'flock' },
];

function formatTxnDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    const flockDistribution = dashboard?.flockDistribution || {};
    const inventoryRows = buildInventorySegments(dashboard?.inventoryBreakdown);

    
    
    return (
        <PageState loading={loading} error={error ? `Unable to load dashboard: ${error}` : null} loadingLabel="Loading dashboard...">
            <SummaryCards items={buildSummaryItems(summary)} columns={5} />

            <PanelCard
                title="Farm Calendar"
                subtitle="Click any date to add or edit a note"
                icon="bi-calendar3"
                className="farm-calendar-card"
                collapsible
                defaultCollapsed
            >
                <FarmCalendar />
            </PanelCard>

            <div className="dashboard-coach">
                <div className="dashboard-col dashboard-col-left">
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
                                            <td data-label="#">{index + 1}</td>
                                            <td data-label="Category">
                                                <span className="standings-team">
                                                    <span className="standings-dot" style={{ background: row.color }}></span>
                                                    {row.label}
                                                </span>
                                            </td>
                                            <td data-label="Stock">{row.value.toLocaleString()}</td>
                                            <td data-label="Status">
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
                </div>

                <div className="dashboard-col dashboard-col-right">
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
                </div>
            </div>

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
                                        <td data-label="Date">{formatTxnDate(txn.created_at)}</td>
                                        <td data-label="Type">
                                            <span className={`txn-type-${txn.type}`}>
                                                {txn.type === 'in' ? 'In' : 'Out'}
                                            </span>
                                        </td>
                                        <td data-label="Item">{txn.item_name}</td>
                                        <td data-label="Qty">{Number(txn.quantity).toLocaleString()}</td>
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
