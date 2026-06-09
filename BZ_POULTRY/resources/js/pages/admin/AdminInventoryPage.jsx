import { useMemo, useState } from 'react';
import useFetch from '../../hooks/useFetch';
import PageState from '../../components/ui/PageState';

const MAIN_TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'chickens', label: 'Chickens' },
    { id: 'egg-productions', label: 'Egg Productions' },
    { id: 'buildings', label: 'Buildings' },
    { id: 'medications', label: 'Medications' },
];

const EGG_SUB_TABS = [
    { id: 'daily', label: 'Daily by Building' },
    { id: 'grading', label: 'Egg Grading' },
    { id: 'inventory', label: 'Egg Inventory' },
];

function formatNumber(value) {
    return Number(value || 0).toLocaleString();
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).replace(',', ' -');
}

function formatDateInputValue(dateStr) {
    if (!dateStr) return new Date().toISOString().slice(0, 10);
    return dateStr;
}

export default function AdminInventoryPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [eggSubTab, setEggSubTab] = useState('daily');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [search, setSearch] = useState('');

    const { data, loading, error } = useFetch(`/api/admin/inventory?date=${selectedDate}`);
    const user = window.Laravel?.user || { name: 'User' };

    const summary = data?.summary || {};
    const overview = data?.overview || {};
    const chickens = data?.chickens || [];
    const eggProductions = data?.egg_productions || {};
    const managerActivities = data?.manager_activities || [];

    const filteredChickens = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return chickens;

        return chickens.filter((row) => (
            row.building_no?.toLowerCase().includes(query)
            || row.type?.toLowerCase().includes(query)
            || String(row.current_population).includes(query)
        ));
    }, [chickens, search]);

    const summaryCards = useMemo(() => {
        if (activeTab === 'egg-productions') {
            const inventory = eggProductions.inventory || {};
            const gradeAa = inventory.grade_breakdown?.find((g) => g.key === 'grade_aa')?.value || 0;
            const rejected = (inventory.grade_breakdown?.find((g) => g.key === 'cracked')?.value || 0)
                + (inventory.grade_breakdown?.find((g) => g.key === 'dirty')?.value || 0);
            const rejectedRate = inventory.total_on_hand > 0
                ? `${Math.round((rejected / inventory.total_on_hand) * 100)}%`
                : '0%';

            return [
                { label: 'Total Active Layer Birds', value: formatNumber(overview.layer_count), tone: 'default' },
                { label: 'On Hand Inventory', value: formatNumber(inventory.total_on_hand), tone: 'default' },
                { label: 'Grade AA', value: formatNumber(gradeAa), tone: 'success' },
                { label: 'Rejected Rate', value: rejectedRate, tone: 'danger' },
            ];
        }

        return [
            { label: 'Total Birds', value: formatNumber(summary.totalBirds), tone: 'default' },
            { label: "Today's Egg Collections", value: formatNumber(summary.eggsToday), tone: 'default' },
            { label: 'Cull Total', value: formatNumber(summary.cull), tone: 'default' },
            { label: 'Mortality', value: formatNumber(summary.mortality), tone: 'default' },
        ];
    }, [activeTab, eggProductions, overview.layer_count, summary]);

    return (
        <PageState loading={loading} error={error ? `Unable to load inventory dashboard: ${error}` : null} loadingLabel="Loading inventory dashboard...">
            <div className="admin-inventory">
                <div className="admin-inventory-hero">
                    <div className="admin-inventory-hero-left">
                        <div className="admin-inventory-logo">
                            <img src={window.Laravel?.logoUrl || '/images/BZ%20LOGO.png'} alt="BZ Farm logo" />
                        </div>
                        <div>
                            <h2>Inventory Dashboard</h2>
                            <p>Welcome, {user.name}!</p>
                        </div>
                    </div>
                    <div className="admin-inventory-hero-right">
                        <span className="admin-role-badge">Admin</span>
                    </div>
                </div>

                <div className="admin-summary-cards">
                    {summaryCards.map((card) => (
                        <div key={card.label} className="admin-summary-card">
                            <div className="admin-summary-card-label">{card.label}</div>
                            <div className={`admin-summary-card-value tone-${card.tone}`}>{card.value}</div>
                        </div>
                    ))}
                </div>

                <div className="admin-tab-bar">
                    <div className="admin-main-tabs">
                        {MAIN_TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`admin-main-tab ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="admin-date-picker">
                        <i className="bi bi-calendar3"></i>
                        <input
                            type="date"
                            value={formatDateInputValue(data?.date || selectedDate)}
                            onChange={(event) => setSelectedDate(event.target.value)}
                        />
                        <span>{formatDisplayDate(data?.date || selectedDate)}</span>
                    </div>
                </div>

                {activeTab === 'overview' && (
                    <div className="admin-panel-grid">
                        <div className="admin-panel">
                            <div className="admin-panel-head">
                                <div>
                                    <div className="admin-panel-kicker">Total Population</div>
                                    <div className="admin-panel-stats">
                                        <span><strong>{formatNumber(overview.grower_count)}</strong> Grower</span>
                                        <span><strong>{formatNumber(overview.layer_count)}</strong> Layer</span>
                                    </div>
                                </div>
                            </div>
                            <div className="table-wrap">
                                <table className="data-table mockup-table">
                                    <thead>
                                        <tr>
                                            <th>Building No.</th>
                                            <th>Population</th>
                                            <th>Average</th>
                                            <th>Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {overview.population_table?.length ? overview.population_table.map((row, index) => (
                                            <tr key={`${row.building_no}-${index}`}>
                                                <td>{row.building_no}</td>
                                                <td>{formatNumber(row.population)}</td>
                                                <td>{row.average}%</td>
                                                <td>{row.remarks}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="4" className="empty-state">No flock data recorded by managers yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="admin-panel">
                            <div className="admin-panel-head">
                                <div>
                                    <div className="admin-panel-kicker">Total Productions</div>
                                    <div className="admin-panel-big-value">{formatNumber(overview.total_production)}</div>
                                </div>
                                <div className="admin-panel-select">Production Building</div>
                            </div>
                            <div className="table-wrap">
                                <table className="data-table mockup-table">
                                    <thead>
                                        <tr>
                                            <th>Building No.</th>
                                            <th>Population</th>
                                            <th>Production Average</th>
                                            <th>Farm Average</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {overview.production_table?.length ? overview.production_table.map((row, index) => (
                                            <tr key={`${row.building_no}-${index}`}>
                                                <td>{row.building_no}</td>
                                                <td>{formatNumber(row.population)}</td>
                                                <td>{row.production_average}%</td>
                                                <td>{row.farm_average}%</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="4" className="empty-state">No egg production records for this date.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="admin-panel admin-panel-full">
                            <div className="admin-panel-head">
                                <div className="admin-panel-kicker">Manager Activity</div>
                                <p className="admin-panel-sub">Updates submitted by farm managers</p>
                            </div>
                            <ul className="admin-activity-list">
                                {managerActivities.length ? managerActivities.map((activity) => (
                                    <li key={activity.id}>
                                        <div>
                                            <strong>{activity.manager}</strong>
                                            <span>{activity.module}</span>
                                        </div>
                                        <p>{activity.description}</p>
                                        <time>{new Date(activity.created_at).toLocaleString()}</time>
                                    </li>
                                )) : (
                                    <li className="empty-state">No manager activity logged yet.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'chickens' && (
                    <div className="data-panel">
                        <div className="data-panel-toolbar">
                            <div className="data-panel-search">
                                <i className="bi bi-search"></i>
                                <input
                                    type="text"
                                    placeholder="Search batch ID, building, breed..."
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                            </div>
                        </div>
                        <div className="table-wrap">
                            <table className="data-table mockup-table">
                                <thead>
                                    <tr>
                                        <th>Building No.</th>
                                        <th>Type</th>
                                        <th>Current Population</th>
                                        <th>Age</th>
                                        <th>Cull</th>
                                        <th>Mortality</th>
                                        <th>Mortality rate</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredChickens.length ? filteredChickens.map((row) => (
                                        <tr key={row.id}>
                                            <td>{row.building_no}</td>
                                            <td>{row.type}</td>
                                            <td>{formatNumber(row.current_population)}</td>
                                            <td>{row.age}</td>
                                            <td>{row.cull}</td>
                                            <td>{formatNumber(row.mortality)}</td>
                                            <td className="text-danger">{row.mortality_rate}</td>
                                            <td><span className="status-pill">{row.status}</span></td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="8" className="empty-state">No chicken stock records found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'egg-productions' && (
                    <div className="data-panel">
                        <div className="data-panel-toolbar admin-egg-toolbar">
                            <div className="data-panel-title">Daily Productions per building</div>
                            <div className="admin-sub-tabs">
                                {EGG_SUB_TABS.map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        className={`admin-sub-tab ${eggSubTab === tab.id ? 'active' : ''}`}
                                        onClick={() => setEggSubTab(tab.id)}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {eggSubTab === 'daily' && (
                            <div className="table-wrap">
                                <table className="data-table mockup-table">
                                    <thead>
                                        <tr>
                                            <th>Building</th>
                                            <th>Flock</th>
                                            <th>Eggs collected</th>
                                            <th>Shares of day</th>
                                            <th>Collection Time</th>
                                            <th>Recorded By</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {eggProductions.daily_by_building?.length ? eggProductions.daily_by_building.map((row, index) => (
                                            <tr key={`${row.building}-${index}`}>
                                                <td>{row.building}</td>
                                                <td>{row.flock}</td>
                                                <td>{formatNumber(row.eggs_collected)}</td>
                                                <td>
                                                    <div className="share-bar">
                                                        <span style={{ width: `${row.share_of_day}%` }}></span>
                                                        <em>{row.share_of_day}%</em>
                                                    </div>
                                                </td>
                                                <td>{row.collection_time}</td>
                                                <td>{row.recorded_by || '—'}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="6" className="empty-state">No daily production records for this date.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {eggSubTab === 'grading' && (
                            <>
                                <div className="data-panel-title">Egg Grading Record</div>
                                <div className="table-wrap">
                                    <table className="data-table mockup-table admin-grading-table">
                                        <thead>
                                            <tr>
                                                <th>Building</th>
                                                <th className="grade-aa">Grade AA</th>
                                                <th className="grade-a">Grade A</th>
                                                <th className="grade-b">Grade B</th>
                                                <th className="grade-cracked">Cracked</th>
                                                <th className="grade-dirty">Dirty</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {eggProductions.grading?.length ? eggProductions.grading.map((row, index) => (
                                                <tr key={`${row.building}-${index}`}>
                                                    <td>{row.building}</td>
                                                    <td>{formatNumber(row.grade_aa)}</td>
                                                    <td>{formatNumber(row.grade_a)}</td>
                                                    <td>{formatNumber(row.grade_b)}</td>
                                                    <td>{formatNumber(row.cracked)}</td>
                                                    <td>{formatNumber(row.dirty)}</td>
                                                    <td>{formatNumber(row.total)}</td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="7" className="empty-state">No grading data for this date.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {eggSubTab === 'inventory' && (
                            <div className="admin-inventory-split">
                                <div className="admin-inventory-side">
                                    <div className="admin-panel-kicker">Total On Hand</div>
                                    <div className="admin-panel-big-value">{formatNumber(eggProductions.inventory?.total_on_hand)}</div>
                                    <div className="grade-breakdown">
                                        {eggProductions.inventory?.grade_breakdown?.map((grade) => (
                                            <div key={grade.key} className={`grade-row grade-${grade.color}`}>
                                                <div className="grade-row-head">
                                                    <span>{grade.label}</span>
                                                    <strong>{formatNumber(grade.value)} ({grade.percent}%)</strong>
                                                </div>
                                                <div className="grade-bar">
                                                    <span style={{ width: `${grade.percent}%` }}></span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="admin-inventory-main">
                                    <div className="admin-panel-head">
                                        <div className="data-panel-title">Inventory by Grade</div>
                                    </div>
                                    <div className="table-wrap">
                                        <table className="data-table mockup-table">
                                            <thead>
                                                <tr>
                                                    <th>Grade</th>
                                                    <th>On Hand</th>
                                                    <th>Incoming (Today)</th>
                                                    <th>Outgoing</th>
                                                    <th>Net</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {eggProductions.inventory?.inventory_table?.map((row) => (
                                                    <tr key={row.grade}>
                                                        <td>{row.grade}</td>
                                                        <td>{formatNumber(row.on_hand)}</td>
                                                        <td className="text-success">+{formatNumber(row.incoming_today)}</td>
                                                        <td className="text-danger">-{formatNumber(row.outgoing)}</td>
                                                        <td className={row.net >= 0 ? 'text-success' : 'text-danger'}>
                                                            {row.net >= 0 ? '+' : ''}{formatNumber(row.net)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'buildings' && (
                    <div className="data-panel">
                        <div className="data-panel-title">Buildings Overview</div>
                        <div className="table-wrap">
                            <table className="data-table mockup-table">
                                <thead>
                                    <tr>
                                        <th>Building</th>
                                        <th>Assigned Flocks</th>
                                        <th>Today's Collection</th>
                                        <th>Good Eggs</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.buildings?.length ? data.buildings.map((row) => (
                                        <tr key={row.id}>
                                            <td>{row.name}</td>
                                            <td>{row.assigned_flocks}</td>
                                            <td>{formatNumber(row.population)}</td>
                                            <td>{formatNumber(row.production)}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4" className="empty-state">No buildings configured.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'medications' && (
                    <div className="admin-panel-grid">
                        <div className="admin-panel">
                            <div className="data-panel-title">Medications & Vaccines</div>
                            <div className="table-wrap">
                                <table className="data-table mockup-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Category</th>
                                            <th>Stock</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data?.medications?.length ? data.medications.map((row) => (
                                            <tr key={row.name}>
                                                <td>{row.name}</td>
                                                <td>{row.category}</td>
                                                <td>{formatNumber(row.stock)} {row.unit}</td>
                                                <td>
                                                    <span className={`status-pill ${row.status === 'low' ? 'status-inactive' : ''}`}>
                                                        {row.status === 'low' ? 'Low Stock' : 'Active'}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="4" className="empty-state">No medication inventory recorded.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="admin-panel">
                            <div className="data-panel-title">Feeds</div>
                            <div className="table-wrap">
                                <table className="data-table mockup-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Category</th>
                                            <th>Stock</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data?.feeds?.length ? data.feeds.map((row) => (
                                            <tr key={row.name}>
                                                <td>{row.name}</td>
                                                <td>{row.category}</td>
                                                <td>{formatNumber(row.stock)} {row.unit}</td>
                                                <td>
                                                    <span className={`status-pill ${row.status === 'low' ? 'status-inactive' : ''}`}>
                                                        {row.status === 'low' ? 'Low Stock' : 'Active'}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="4" className="empty-state">No feed inventory recorded.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageState>
    );
}
