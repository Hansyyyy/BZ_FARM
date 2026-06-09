import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import useFetch from '../hooks/useFetch';
import PageState from '../components/ui/PageState';
import SummaryCards from '../components/ui/SummaryCards';
import ModuleTabs from '../components/ui/ModuleTabs';
import DonutChart from '../components/ui/DonutChart';
import RecentActivities from '../components/ui/RecentActivities';
import PanelCard from '../components/ui/PanelCard';
import Modal from '../components/ui/Modal';
import DynamicForm from '../components/forms/DynamicForm';
import { stockTabs, getStockResource } from '../config/stockTabs';

const PAGE_SIZE = 8;

export default function StockHubPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'chicken';
    const tabConfig = stockTabs.find((tab) => tab.id === activeTab) || stockTabs[0];
    const resource = getStockResource(activeTab);

    const { data, loading, error, setData, reload, setError } = useFetch(resource.endpoint);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ type: '', breed: '', status: '', category: '', building: '' });
    const [page, setPage] = useState(1);
    const [form, setForm] = useState({});
    const [viewItem, setViewItem] = useState(null);
    const [isFormOpen, setFormOpen] = useState(false);

    useEffect(() => {
        setSearch('');
        setFilters({ type: '', breed: '', status: '', category: '', building: '' });
        setPage(1);
        setForm({});
    }, [activeTab]);

    const items = useMemo(() => {
        let rows = data?.items || [];

        if (search.trim()) {
            const query = search.toLowerCase();
            rows = rows.filter((item) => resource.columns.some((col) => {
                const value = col.render ? col.render(item) : item[col.key] ?? '';
                return String(value).toLowerCase().includes(query);
            }));
        }

        if (filters.type) rows = rows.filter((item) => item.type === filters.type);
        if (filters.breed) rows = rows.filter((item) => item.breed === filters.breed);
        if (filters.status) rows = rows.filter((item) => item.status === filters.status);
        if (filters.category) rows = rows.filter((item) => item.category === filters.category);
        if (filters.building) rows = rows.filter((item) => String(item.building_name || '').includes(filters.building));

        return rows;
    }, [data, search, filters, resource]);

    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const pagedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const breedOptions = useMemo(() => [...new Set((data?.items || []).map((item) => item.breed).filter(Boolean))], [data]);
    const categoryOptions = useMemo(() => [...new Set((data?.items || []).map((item) => item.category).filter(Boolean))], [data]);

    const updateField = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

    const submit = async (event) => {
        event.preventDefault();
        try {
            const payload = new FormData();
            Object.entries(form).forEach(([key, value]) => payload.append(key, value));
            await axios.post(resource.endpoint, payload);
            setFormOpen(false);
            setForm({});
            await reload();
        } catch (err) {
            setError(err.message);
        }
    };

    const remove = async (id) => {
        if (!window.confirm('Delete this record?')) return;
        try {
            await axios.delete(`${resource.endpoint}/${id}`);
            setData((previous) => ({
                ...previous,
                items: previous.items.filter((item) => item.id !== id),
            }));
        } catch (err) {
            setError(err.message);
        }
    };

    const setTab = (tabId) => {
        setSearchParams({ tab: tabId });
    };

    const summaryFields = activeTab === 'chicken' ? resource.summaryFields : resource.summaryFields;

    return (
        <PageState loading={loading} error={error} loadingLabel="Loading stock data...">
            {resource.summaryFields && (
                <SummaryCards fields={summaryFields} summary={data?.summary} />
            )}

            <div className="data-panel">
                <ModuleTabs tabs={stockTabs} activeTab={activeTab} onChange={setTab} />

                <div className="data-panel-toolbar">
                    <div className="data-panel-search">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder={tabConfig.searchPlaceholder}
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="data-panel-filters">
                        {tabConfig.filters?.includes('type') && (
                            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                                <option value="">All Type</option>
                                <option value="layers">Layers</option>
                                <option value="pullets">Pullets</option>
                                <option value="roosters">Roosters</option>
                            </select>
                        )}
                        {tabConfig.filters?.includes('breed') && (
                            <select value={filters.breed} onChange={(e) => setFilters({ ...filters, breed: e.target.value })}>
                                <option value="">All Building</option>
                                {breedOptions.map((breed) => <option key={breed} value={breed}>{breed}</option>)}
                            </select>
                        )}
                        {tabConfig.filters?.includes('status') && (
                            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        )}
                        {tabConfig.filters?.includes('category') && (
                            <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                                <option value="">All Category</option>
                                {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
                            </select>
                        )}
                    </div>
                    <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)}>
                        <i className="bi bi-plus-lg"></i> {tabConfig.addLabel}
                    </button>
                </div>

                <div className="data-panel-title">{tabConfig.listTitle}</div>

                <div className="table-responsive">
                    <table className="data-table mockup-table">
                        <thead>
                            <tr>
                                {resource.columns.map((col) => <th key={col.key}>{col.label}</th>)}
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedItems.length ? pagedItems.map((item) => (
                                <tr key={item.id || item.batch_no || item.item_code || item.name}>
                                    {resource.columns.map((col) => {
                                        const value = col.render ? col.render(item) : item[col.key] ?? '';
                                        if (col.badge) {
                                            return (
                                                <td key={col.key}>
                                                    <span className={`status-pill status-${value || 'active'}`}>{value || 'active'}</span>
                                                </td>
                                            );
                                        }
                                        return <td key={col.key}>{value}</td>;
                                    })}
                                    <td>
                                        <div className="row-actions">
                                            <button type="button" className="action-btn" title="View" onClick={() => setViewItem(item)}>
                                                <i className="bi bi-eye"></i>
                                            </button>
                                            <button type="button" className="action-btn" title="Edit" onClick={() => { setForm(item); setFormOpen(true); }}>
                                                <i className="bi bi-pencil"></i>
                                            </button>
                                            <button type="button" className="action-btn delete" title="Delete" onClick={() => remove(item.id)}>
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={resource.columns.length + 1}>No records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="table-pagination">
                    <span>Showing {items.length ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, items.length)} of {items.length} entries</span>
                    <div className="pagination-controls">
                        <button type="button" className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                            <i className="bi bi-chevron-left"></i>
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1).map((num) => (
                            <button
                                key={num}
                                type="button"
                                className={`page-btn ${page === num ? 'active' : ''}`}
                                onClick={() => setPage(num)}
                            >
                                {num}
                            </button>
                        ))}
                        <button type="button" className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                            <i className="bi bi-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'chicken' && (
                <div className="grid-2 stock-widgets">
                    <PanelCard title="Flock Distribution by Type" actionLabel="View All">
                        <DonutChart distribution={data?.distribution} total={data?.summary?.totalPoultry} />
                    </PanelCard>
                    <PanelCard title="Recent Activities" actionLabel="View All">
                        <RecentActivities activities={data?.recentActivities} />
                    </PanelCard>
                </div>
            )}

            <Modal
                open={isFormOpen}
                title={tabConfig.addLabel}
                size="landscape"
                onClose={() => { setFormOpen(false); setForm({}); }}
                actions={(
                    <>
                        <button type="button" className="btn btn-outline" onClick={() => { setFormOpen(false); setForm({}); }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" form="stock-form">Save</button>
                    </>
                )}
            >
                <DynamicForm id="stock-form" fields={resource.formFields} values={form} onChange={updateField} onSubmit={submit} />
            </Modal>

            <Modal
                open={Boolean(viewItem)}
                title="Record Details"
                size="landscape"
                onClose={() => setViewItem(null)}
                actions={<button type="button" className="btn btn-outline" onClick={() => setViewItem(null)}>Close</button>}
            >
                {viewItem && (
                    <div className="detail-grid">
                        {resource.columns.map((col) => {
                            const value = col.render ? col.render(viewItem) : viewItem[col.key] ?? '';
                            return (
                                <div className="detail-item" key={col.key}>
                                    <span>{col.label}</span>
                                    <strong>{value}</strong>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Modal>
        </PageState>
    );
}
