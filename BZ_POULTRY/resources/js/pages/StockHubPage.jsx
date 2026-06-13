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

const PAGE_SIZE = 11;

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
    const [filters, setFilters] = useState({ type: '', status: '', category: '', building: '', date: '' });
    const [page, setPage] = useState(1);
    const [form, setForm] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [viewItem, setViewItem] = useState(null);
    const [isFormOpen, setFormOpen] = useState(false);
    const [isExportOpen, setExportOpen] = useState(false);
    const [isTransferOpen, setTransferOpen] = useState(false);
    const [transferForm, setTransferForm] = useState({ flock_id: '', destination_building: '' });

    const activeFields = editingId && resource.editFormFields ? resource.editFormFields : resource.formFields;
    const isEditing = Boolean(editingId);

    const resolvedFields = useMemo(() => {
        const occupiedNames = new Set(
            (data?.items || [])
                .filter((item) => item.status === 'active')
                .flatMap((item) => [item.building_name, item.batch_no].filter(Boolean))
        );

        return activeFields.map((field) => {
            if (field.optionsKey === 'buildings' && data?.buildings) {
                const valueKey = field.optionValue || 'id';
                const labelKey = field.optionLabel || 'name';
                const availableBuildings = data.buildings.filter((b) => !occupiedNames.has(b.name));

                return {
                    ...field,
                    options: availableBuildings.map((building) => ({
                        value: String(building[valueKey]),
                        label: building[labelKey],
                    })),
                };
            }

            if (field.key === 'type' && !editingId) {
                const buildingValue = form.building_name;
                if (buildingValue) {
                    const selected = (data?.buildings || []).find(
                        (b) => String(b.id) === String(buildingValue)
                    );
                    const bName = selected?.name || '';
                    const match = bName.match(/B-(\d+)/);
                    const num = match ? parseInt(match[1], 10) : 0;
                    const autoType = num >= 1 && num <= 3 ? 'Growers' : num >= 4 ? 'Layers' : '';

                    if (autoType) {
                        return { ...field, readOnly: true, _autoValue: autoType };
                    }
                }
                return { ...field, readOnly: false };
            }

            return field;
        });
    }, [activeFields, data, form.building_name, editingId]);

    useEffect(() => {
        resolvedFields.forEach((field) => {
            if (field._autoValue && form[field.key] !== field._autoValue) {
                setForm((prev) => ({ ...prev, [field.key]: field._autoValue }));
            }
        });
    }, [resolvedFields, form]);

    useEffect(() => {
        setSearch('');
        setFilters({ type: '', status: '', category: '', building: '', date: '' });
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
        if (filters.status) rows = rows.filter((item) => item.status === filters.status);
        if (filters.category) rows = rows.filter((item) => item.category === filters.category);
        if (filters.building) {
            rows = rows.filter((item) => String(item.building_name || item.batch_no || '') === filters.building);
        }
        if (filters.date) {
            rows = rows.filter((item) => String(item.date || '').slice(0, 10) === filters.date);
        }

        return rows;
    }, [data, search, filters, resource]);

    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const pagedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const categoryOptions = useMemo(() => [...new Set((data?.items || []).map((item) => item.category).filter(Boolean))], [data]);

    const typeOptions = [
        { value: '', label: 'All Type' },
        { value: 'Layers', label: 'Layers' },
        { value: 'Growers', label: 'Growers' },
    ];

    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ];

    const buildingOptions = useMemo(() => [
        { value: '', label: 'All Buildings' },
        ...((data?.buildings || []).map((building) => ({
            value: building.name,
            label: building.name,
        }))),
    ], [data]);

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
        if (key === 'building_name' && !editingId) {
            const selected = (data?.buildings || []).find(
                (b) => String(b.id) === String(value)
            );
            const bName = selected?.name || '';
            const match = bName.match(/B-(\d+)/);
            const num = match ? parseInt(match[1], 10) : 0;
            const autoType = num >= 1 && num <= 3 ? 'Growers' : num >= 4 ? 'Layers' : '';

            setForm((prev) => ({ ...prev, building_name: value, type: autoType }));
            return;
        }
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

            if (!isEditing && form.age_days) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dateIn = new Date(today);
                dateIn.setDate(dateIn.getDate() - parseInt(form.age_days, 10));
                payload.date_in = dateIn.toISOString().slice(0, 10);
                delete payload.age_days;
            }

            if (!isEditing && payload.building_name) {
                const selected = (data?.buildings || []).find(
                    (b) => String(b.id) === String(payload.building_name)
                );
                if (selected) {
                    payload.building_name = selected.name;
                }
            }

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

    const transferableFlocks = useMemo(() => {
        return (data?.items || []).filter((item) => {
            if (item.status !== 'active') return false;
            if (item.type !== 'Growers' && item.type !== 'growers') return false;
            if (!item.date_in) return false;
            const now = new Date();
            const dateIn = new Date(item.date_in);
            const days = Math.floor((now - dateIn) / (1000 * 60 * 60 * 24));
            const weeks = Math.floor(days / 7);
            return weeks >= 18;
        });
    }, [data]);

    const availableLayerBuildings = useMemo(() => {
        const occupiedNames = new Set(
            (data?.items || [])
                .filter((item) => item.status === 'active')
                .map((item) => item.building_name)
                .filter(Boolean)
        );
        return (data?.buildings || []).filter(
            (b) => !occupiedNames.has(b.name) && /^B-(0[4-9]|1[01])$/.test(b.name)
        );
    }, [data]);

    const handleTransfer = async () => {
        if (!transferForm.flock_id || !transferForm.destination_building) {
            setError('Please select both a flock and a destination building.');
            return;
        }

        try {
            await axios.post('/api/flocks/transfer', transferForm);
            setTransferOpen(false);
            setTransferForm({ flock_id: '', destination_building: '' });
            await reload();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
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
                        <div className="data-panel-actions">
                            {activeTab === 'chicken' && (
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setTransferOpen(true)}
                                    disabled={transferableFlocks.length === 0 || availableLayerBuildings.length === 0}
                                >
                                    <i className="bi bi-arrow-left-right"></i> Transfer Chicken
                                </button>
                            )}
                            <button type="button" className="btn btn-primary data-panel-add-btn" onClick={openCreate}>
                                <i className="bi bi-plus-lg"></i> {tabConfig.addLabel}
                            </button>
                        </div>
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

            <Modal
                open={isTransferOpen}
                title="Transfer Chicken to Layer Building"
                size="landscape"
                onClose={() => {
                    setTransferOpen(false);
                    setTransferForm({ flock_id: '', destination_building: '' });
                }}
                actions={(
                    <>
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => {
                                setTransferOpen(false);
                                setTransferForm({ flock_id: '', destination_building: '' });
                            }}
                        >
                            Cancel
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleTransfer}>
                            Transfer
                        </button>
                    </>
                )}
            >
                <div className="modal-form-grid">
                    <div className="form-group">
                        <label>Select Grower Flock (18+ weeks)</label>
                        <select
                            className="form-control"
                            value={transferForm.flock_id}
                            onChange={(e) => setTransferForm({ ...transferForm, flock_id: e.target.value })}
                        >
                            <option value="">Select a flock</option>
                            {transferableFlocks.map((flock) => (
                                <option key={flock.id} value={flock.id}>
                                    {flock.building_name} - {flock.batch_no} ({flock.quantity} birds)
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Destination Layer Building (B-04 to B-11)</label>
                        <select
                            className="form-control"
                            value={transferForm.destination_building}
                            onChange={(e) => setTransferForm({ ...transferForm, destination_building: e.target.value })}
                        >
                            <option value="">Select a building</option>
                            {availableLayerBuildings.map((b) => (
                                <option key={b.id} value={b.name}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Modal>

        </PageState>
    );
}
