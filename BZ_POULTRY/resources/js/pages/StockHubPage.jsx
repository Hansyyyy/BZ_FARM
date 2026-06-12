import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import useFetch from '../hooks/useFetch';
import { usePageSearch } from '../context/HeaderSearchContext';
import PageState from '../components/ui/PageState';
import SummaryCards from '../components/ui/SummaryCards';
import ModuleTabs from '../components/ui/ModuleTabs';
import SegmentDonut from '../components/ui/SegmentDonut';
import { buildFlockSegments } from '../config/chartTheme';
import RecentActivities from '../components/ui/RecentActivities';
import PanelCard from '../components/ui/PanelCard';
import Modal from '../components/ui/Modal';
import ExportModal from '../components/ui/ExportModal';
import DynamicForm from '../components/forms/DynamicForm';
import RowActionButtons from '../components/ui/RowActionButtons';
import AnimatedSelect from '../components/ui/AnimatedSelect';
import AnimatedDatePicker from '../components/ui/AnimatedDatePicker';
import { exportTableData } from '../utils/exportData';
import { stockTabs, getStockResource } from '../config/stockTabs';

const PAGE_SIZE = 8;

function prepareFormItem(item, fields) {
    const prepared = { ...item };

    fields.forEach((field) => {
        if (field.type === 'date' && prepared[field.key]) {
            prepared[field.key] = String(prepared[field.key]).slice(0, 10);
        }
    });

    if (prepared.status === undefined) {
        prepared.status = 'active';
    }

    if (prepared.mortality === undefined) {
        prepared.mortality = 0;
    }

    if (prepared.building?.id !== undefined) {
        prepared.building_id = String(prepared.building.id);
    }

    return prepared;
}

function buildPayload(form, fields) {
    const payload = {};

    fields.forEach((field) => {
        if (field.readOnly) {
            return;
        }

        if (form[field.key] !== undefined && form[field.key] !== '') {
            payload[field.key] = form[field.key];
        }
    });

    return payload;
}

export default function StockHubPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'chicken';
    const tabConfig = stockTabs.find((tab) => tab.id === activeTab) || stockTabs[0];
    const resource = getStockResource(activeTab);

    const { data, loading, error, reload, setError } = useFetch(resource.endpoint);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ type: '', breed: '', status: '', category: '', building: '', date: '' });
    const [page, setPage] = useState(1);
    const [form, setForm] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [viewItem, setViewItem] = useState(null);
    const [isFormOpen, setFormOpen] = useState(false);
    const [isExportOpen, setExportOpen] = useState(false);

    const activeFields = editingId && resource.editFormFields ? resource.editFormFields : resource.formFields;
    const isEditing = Boolean(editingId);

    const resolvedFields = useMemo(() => activeFields.map((field) => {
        if (field.optionsKey === 'buildings' && data?.buildings) {
            const valueKey = field.optionValue || 'id';
            const labelKey = field.optionLabel || 'name';

            return {
                ...field,
                options: data.buildings.map((building) => ({
                    value: String(building[valueKey]),
                    label: building[labelKey],
                })),
            };
        }

        return field;
    }), [activeFields, data]);

    useEffect(() => {
        setSearch('');
        setFilters({ type: '', breed: '', status: '', category: '', building: '', date: '' });
        setPage(1);
        setForm({});
        setEditingId(null);
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
        if (filters.building) {
            rows = rows.filter((item) => String(item.batch_no || '') === filters.building);
        }
        if (filters.date) {
            rows = rows.filter((item) => String(item.date || '').slice(0, 10) === filters.date);
        }

        return rows;
    }, [data, search, filters, resource]);

    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const pagedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const breedOptions = useMemo(() => [...new Set((data?.items || []).map((item) => item.breed).filter(Boolean))], [data]);
    const categoryOptions = useMemo(() => [...new Set((data?.items || []).map((item) => item.category).filter(Boolean))], [data]);

    const typeOptions = [
        { value: '', label: 'All Type' },
        { value: 'layers', label: 'Layers' },
        { value: 'pullets', label: 'Pullets' },
        { value: 'roosters', label: 'Roosters' },
    ];

    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ];

    const buildingOptions = useMemo(() => [
        { value: '', label: 'All Buildings' },
        ...((data?.buildings || []).map((building) => ({
            value: String(building.id),
            label: building.name,
        }))),
    ], [data]);

    const breedSelectOptions = useMemo(() => [
        { value: '', label: 'All Breeds' },
        ...breedOptions.map((breed) => ({ value: breed, label: breed })),
    ], [breedOptions]);

    const categorySelectOptions = useMemo(() => [
        { value: '', label: 'All Category' },
        ...categoryOptions.map((category) => ({ value: category, label: category })),
    ], [categoryOptions]);

    const handleSearchChange = useCallback((value) => {
        setSearch(value);
        setPage(1);
    }, []);

    usePageSearch(tabConfig.searchPlaceholder, search, handleSearchChange);

    const updateField = (key, value) => {
        setForm((previous) => ({ ...previous, [key]: value }));
    };

    const closeForm = () => {
        setFormOpen(false);
        setForm({});
        setEditingId(null);
    };

    const openCreate = () => {
        setEditingId(null);
        setForm({});
        setFormOpen(true);
    };

    const openEdit = (item) => {
        const fields = resource.editFormFields || resource.formFields;
        setEditingId(item.id);
        setForm(prepareFormItem(item, fields));
        setFormOpen(true);
    };

    const submit = async (event) => {
        event.preventDefault();

        try {
            const payload = buildPayload(form, activeFields);

            if (isEditing) {
                await axios.put(`${resource.endpoint}/${editingId}`, payload);
            } else {
                const formData = new FormData();
                Object.entries(payload).forEach(([key, value]) => formData.append(key, value));
                await axios.post(resource.endpoint, formData);
            }

            closeForm();
            await reload();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleExport = async (format) => {
        exportTableData({
            title: tabConfig.listTitle,
            columns: resource.columns,
            rows: items,
            format,
        });
    };

    const setTab = (tabId) => {
        setSearchParams({ tab: tabId });
    };

    return (
        <PageState loading={loading} error={error} loadingLabel="Loading stock data...">
            {resource.summaryFields && (
                <SummaryCards fields={resource.summaryFields} summary={data?.summary} />
            )}

            <div className="data-panel">
                <ModuleTabs tabs={stockTabs} activeTab={activeTab} onChange={setTab} />

                <div className="data-panel-toolbar">
                    <div className="data-panel-filters data-panel-filters--stacked">
                        <div className="data-panel-filter-group">
                            {tabConfig.filters?.includes('type') && (
                                <AnimatedSelect
                                    value={filters.type}
                                    onChange={(option) => setFilters({ ...filters, type: option })}
                                    options={typeOptions}
                                    placeholder="All Type"
                                />
                            )}
                            {tabConfig.filters?.includes('breed') && (
                                <AnimatedSelect
                                    value={filters.breed}
                                    onChange={(option) => setFilters({ ...filters, breed: option })}
                                    options={breedSelectOptions}
                                    placeholder="All Breeds"
                                />
                            )}
                            {tabConfig.filters?.includes('status') && (
                                <AnimatedSelect
                                    value={filters.status}
                                    onChange={(option) => setFilters({ ...filters, status: option })}
                                    options={statusOptions}
                                    placeholder="All Status"
                                />
                            )}
                            {tabConfig.filters?.includes('category') && (
                                <AnimatedSelect
                                    value={filters.category}
                                    onChange={(option) => setFilters({ ...filters, category: option })}
                                    options={categorySelectOptions}
                                    placeholder="All Category"
                                />
                            )}
                            {tabConfig.filters?.includes('building') && (
                                <AnimatedSelect
                                    value={filters.building}
                                    onChange={(option) => setFilters({ ...filters, building: option })}
                                    options={buildingOptions}
                                    placeholder="All Buildings"
                                />
                            )}
                            {tabConfig.filters?.includes('date') && (
                                <AnimatedDatePicker
                                    value={filters.date}
                                    onChange={(date) => setFilters({ ...filters, date })}
                                    placeholder="All Dates"
                                />
                            )}
                            <button type="button" className="btn btn-outline data-panel-export-btn" onClick={() => setExportOpen(true)}>
                                <i className="bi bi-printer"></i> Export
                            </button>
                        </div>
                        <button type="button" className="btn btn-primary data-panel-add-btn" onClick={openCreate}>
                            <i className="bi bi-plus-lg"></i> {tabConfig.addLabel}
                        </button>
                    </div>
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
                                        <RowActionButtons
                                            onView={() => setViewItem(item)}
                                            onEdit={() => openEdit(item)}
                                        />
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
                    <PanelCard title="Chicken Distribution by Type" subtitle="Birds by flock type" icon="bi-pie-chart">
                        <SegmentDonut
                            segments={buildFlockSegments(data?.distribution)}
                            total={data?.summary?.totalPoultry}
                            centerLabel="Birds"
                        />
                    </PanelCard>
                    <PanelCard title="Recent Activities" subtitle="Latest stock updates" icon="bi-clock-history">
                        <RecentActivities activities={data?.recentActivities} />
                    </PanelCard>
                </div>
            )}

            <Modal
                open={isFormOpen}
                title={isEditing ? `Update ${tabConfig.listTitle.replace(' List', '')}` : tabConfig.addLabel}
                size="landscape"
                onClose={closeForm}
                actions={(
                    <>
                        <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
                        <button type="submit" className="btn btn-primary" form="stock-form">
                            {isEditing ? 'Update' : 'Save'}
                        </button>
                    </>
                )}
            >
                <DynamicForm id="stock-form" fields={resolvedFields} values={form} onChange={updateField} onSubmit={submit} />
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

            <ExportModal
                open={isExportOpen}
                title={`Export ${tabConfig.listTitle}`}
                description={`Choose how you want to export your ${tabConfig.listTitle.toLowerCase()}.`}
                onClose={() => setExportOpen(false)}
                onExport={handleExport}
            />

        </PageState>
    );
}
