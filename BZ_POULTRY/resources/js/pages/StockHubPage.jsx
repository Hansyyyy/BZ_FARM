import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import FormLabel from '../components/forms/FormLabel';
import RowActionButtons from '../components/ui/RowActionButtons';
import AnimatedSelect from '../components/ui/AnimatedSelect';
import AnimatedDatePicker from '../components/ui/AnimatedDatePicker';
import { exportTableData } from '../utils/exportData';
import { formatApiError } from '../utils/formatApiError';
import { stockTabs, getStockResource, getTabFilters } from '../config/stockTabs';

const PAGE_SIZE = 11;

const goodEggTypes = [
    { key: 'super_jumbo', label: 'Super Jumbo' },
    { key: 'jumbo', label: 'Jumbo' },
    { key: 'extra_large', label: 'Extra Large' },
    { key: 'large', label: 'Large' },
    { key: 'medium', label: 'Medium' },
    { key: 'small', label: 'Small' },
    { key: 'piwi', label: 'Piwi' },
];

const defectiveEggTypes = [
    { key: 'cracked', label: 'Cracked' },
    { key: 'soft_shell', label: 'Soft Shell' },
    { key: 'leak', label: 'Leak' },
];

const feedTypes = ['Booster', 'Starter', 'Grower', 'Prelay', 'Layer 1', 'Layer 2'];

const getDefaultDailyReportForm = () => ({
    building_id: '',
    cull: '',
    mortality: '',
    feed: '',
    feed_type: '',
    eggs: Object.fromEntries([...goodEggTypes, ...defectiveEggTypes].map((e) => [e.key, ''])),
});

function getAgeWeeks(item) {
    if (!item.date_in) return 0;
    const now = new Date();
    const dateIn = new Date(item.date_in);
    const days = Math.floor((now - dateIn) / (1000 * 60 * 60 * 24));
    return Math.floor(days / 7);
}

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

function toDateOnly(value) {
    if (!value) return '';
    const text = String(value);
    return text.includes('T') ? text.slice(0, 10) : text.slice(0, 10);
}

function getItemFilterDate(item) {
    return (
        toDateOnly(item?.date) ||
        toDateOnly(item?.created_at) ||
        toDateOnly(item?.updated_at) ||
        toDateOnly(item?.date_in) ||
        toDateOnly(item?.last_stock_in) ||
        toDateOnly(item?.expiry_date) ||
        ''
    );
}

export default function StockHubPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'chicken';
    const userRole = window.Laravel?.user?.role || 'admin';
    const tabConfig = stockTabs.find((tab) => tab.id === activeTab) || stockTabs[0];
    const tabFilters = getTabFilters(tabConfig, userRole);
    const resource = getStockResource(activeTab);

    const { data, loading, error, reload } = useFetch(resource.endpoint);
    const { data: flockData, reload: reloadFlocks } = useFetch('/api/flocks');
    const { data: feedData, reload: reloadFeeds } = useFetch('/api/feed');
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ type: '', status: '', category: '', building: '', date: '' });
    const [page, setPage] = useState(1);
    const [form, setForm] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [viewItem, setViewItem] = useState(null);
    const [isFormOpen, setFormOpen] = useState(false);
    const [isExportOpen, setExportOpen] = useState(false);
    const [isTransferOpen, setTransferOpen] = useState(false);
    const [isDailyReportOpen, setDailyReportOpen] = useState(false);
    const [transferForm, setTransferForm] = useState({ flock_id: '', destination_building: '' });
    const [dailyReportForm, setDailyReportForm] = useState(getDefaultDailyReportForm);
    const [dailyReportMessage, setDailyReportMessage] = useState(null);
    const [dailyReportError, setDailyReportError] = useState(null);
    const [dailyReportSubmitting, setDailyReportSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const [transferError, setTransferError] = useState(null);
    const [isCloseBatchOpen, setCloseBatchOpen] = useState(false);
    const [closeBatchItem, setCloseBatchItem] = useState(null);
    const [closeBatchForm, setCloseBatchForm] = useState({ closed_reason: 'cycle_end' });
    const [closeBatchError, setCloseBatchError] = useState(null);
    const [closeBatchSubmitting, setCloseBatchSubmitting] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [isRestockOpen, setRestockOpen] = useState(false);
    const [restockForm, setRestockForm] = useState({ feed_id: '', quantity: '' });
    const [restockError, setRestockError] = useState(null);
    const [restockMessage, setRestockMessage] = useState(null);

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
        setFilters({
            type: '',
            status: activeTab === 'chicken' ? 'active' : '',
            category: '',
            building: '',
            date: '',
        });
        setPage(1);
        setForm({});
        setEditingId(null);
        setExpandedRows(new Set());
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
            rows = rows.filter((item) => getItemFilterDate(item) === filters.date);
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
        { value: 'closed', label: 'Closed' },
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

    const toggleRow = (id) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

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
        setFormError(null);
    };

    const openCreate = () => {
        if (activeTab === 'feeds') {
            setRestockForm({ feed_id: '', quantity: '', expiry_date: '' });
            setRestockError(null);
            setRestockMessage(null);
            setRestockOpen(true);
            return;
        }
        setEditingId(null);
        setForm(activeTab === 'chicken' ? { age_days: 0 } : {});
        setFormError(null);
        setFormOpen(true);
    };

    const handleRestockSubmit = async (event) => {
        event.preventDefault();
        setRestockError(null);
        setRestockMessage(null);

        try {
            const res = await axios.post('/api/feed/restock', {
                feed_id: restockForm.feed_id,
                quantity: Number(restockForm.quantity),
                expiry_date: restockForm.expiry_date || null,
            });
            setRestockMessage(res.data.message || 'Feed restocked successfully.');
            await reload();
            setTimeout(() => {
                setRestockOpen(false);
                setRestockForm({ feed_id: '', quantity: '', expiry_date: '' });
                setRestockMessage(null);
            }, 1200);
        } catch (err) {
            setRestockError(err.response?.data?.message || 'Unable to restock feed.');
        }
    };

    const openEdit = (item) => {
        const fields = resource.editFormFields || resource.formFields;
        setEditingId(item.id);
        setForm(prepareFormItem(item, fields));
        setFormError(null);
        setFormOpen(true);
    };

    const submit = async (event) => {
        event.preventDefault();
        setFormError(null);

        try {
            const payload = buildPayload(form, activeFields);

            if (!isEditing) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dateIn = new Date(today);
                const ageDays = parseInt(form.age_days, 10);

                if (!Number.isNaN(ageDays) && ageDays > 0) {
                    dateIn.setDate(dateIn.getDate() - ageDays);
                }

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
                await axios.post(resource.endpoint, payload);
            }

            closeForm();
            await reload();
        } catch (err) {
            setFormError(formatApiError(err, 'Unable to save record.'));
        }
    };

    const handleExport = async (format, preparedBy) => {
        exportTableData({
            title: tabConfig.listTitle,
            columns: resource.columns,
            rows: items,
            format,
            preparedBy,
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

    const handleTransfer = async (event) => {
        event.preventDefault();
        setTransferError(null);

        try {
            await axios.post('/api/flocks/transfer', transferForm);
            setTransferOpen(false);
            setTransferForm({ flock_id: '', destination_building: '' });
            setTransferError(null);
            await reload();
        } catch (err) {
            setTransferError(formatApiError(err, 'Unable to transfer flock.'));
        }
    };

    const openCloseBatch = (item) => {
        setCloseBatchItem(item);
        setCloseBatchForm({ closed_reason: 'cycle_end' });
        setCloseBatchError(null);
        setCloseBatchOpen(true);
    };

    const closeCloseBatchModal = () => {
        setCloseBatchOpen(false);
        setCloseBatchItem(null);
        setCloseBatchForm({ closed_reason: 'cycle_end' });
        setCloseBatchError(null);
        setCloseBatchSubmitting(false);
    };

    const handleCloseBatch = async (event) => {
        event.preventDefault();
        if (!closeBatchItem?.id) return;

        setCloseBatchError(null);
        setCloseBatchSubmitting(true);

        try {
            await axios.post(`/api/flocks/${closeBatchItem.id}/close`, closeBatchForm);
            closeCloseBatchModal();
            await Promise.all([reload(), reloadFlocks()]);
        } catch (err) {
            setCloseBatchError(formatApiError(err, 'Unable to close batch.'));
        } finally {
            setCloseBatchSubmitting(false);
        }
    };

    const closeDailyReportModal = () => {
        setDailyReportOpen(false);
        setDailyReportMessage(null);
        setDailyReportError(null);
        setDailyReportForm(getDefaultDailyReportForm());
    };

    const buildingFlockMap = useMemo(() => {
        const map = {};
        (flockData?.items || []).forEach((item) => {
            if (item.status === 'active' && item.building_name) {
                map[item.building_name] = item;
            }
        });
        return map;
    }, [flockData]);

    const selectedBuildingFlock = dailyReportForm.building_id
        ? buildingFlockMap[
            (flockData?.buildings || []).find((b) => String(b.id) === String(dailyReportForm.building_id))?.name || ''
        ] || null
        : null;

    const activeBuildings = useMemo(() => {
        const activeNames = new Set(
            (flockData?.items || []).filter((item) => item.status === 'active').map((item) => item.building_name).filter(Boolean)
        );
        return (flockData?.buildings || []).filter((b) => activeNames.has(b.name));
    }, [flockData]);

    const availableFeedTypes = useMemo(() => {
        return (feedData?.items || []).filter((item) => item.status !== 'No Stock');
    }, [feedData]);

    const selectedFeedMaxStock = useMemo(() => {
        if (!dailyReportForm.feed_type) return null;
        const match = (feedData?.items || []).find((item) => (item.category || item.name) === dailyReportForm.feed_type);
        return match ? Number(match.stock) : null;
    }, [feedData, dailyReportForm.feed_type]);

    const handleDailyReportSubmit = async (event) => {
        event.preventDefault();
        setDailyReportError(null);
        setDailyReportMessage(null);

        const feedAmount = dailyReportForm.feed ? Number(dailyReportForm.feed) : 0;
        if (feedAmount > 0 && selectedFeedMaxStock != null && feedAmount > selectedFeedMaxStock) {
            setDailyReportError(`Feed amount (${feedAmount}kg) exceeds available stock (${selectedFeedMaxStock}kg).`);
            return;
        }

        setDailyReportSubmitting(true);

        try {
            const payload = {
                building_id: dailyReportForm.building_id,
                cull: dailyReportForm.cull ? Number(dailyReportForm.cull) : 0,
                mortality: dailyReportForm.mortality ? Number(dailyReportForm.mortality) : 0,
                feed: dailyReportForm.feed ? Number(dailyReportForm.feed) : 0,
                feed_type: dailyReportForm.feed_type,
                ...dailyReportForm.eggs,
            };
            const res = await axios.post('/api/daily-reports/entry', payload);
            setDailyReportMessage(res.data.message || 'Daily report entry saved.');
            await Promise.all([reload(), reloadFlocks(), reloadFeeds()]);
            setTimeout(() => closeDailyReportModal(), 1500);
        } catch (err) {
            setDailyReportError(err.response?.data?.message || 'Unable to save daily report.');
        } finally {
            setDailyReportSubmitting(false);
        }
    };

    const updateDailyReportEgg = (key, value) => {
        setDailyReportForm((prev) => ({ ...prev, eggs: { ...prev.eggs, [key]: value } }));
    };

    const infographicContext = useMemo(() => {
        const rows = items || [];
        const referenceRows = data?.items || [];

        const filteredReferenceRows = filters.date
            ? referenceRows.filter((item) => getItemFilterDate(item) === filters.date)
            : referenceRows;
        const lowStockRows = rows.filter((item) => {
            const stock = Number(item.stock ?? item.quantity ?? item.total_eggs ?? 0);
            const reorder = Number(item.reorder_level ?? 20);
            return stock <= reorder;
        }).slice(0, 5);

        const expiringRows = rows
            .filter((item) => item.expiry_date)
            .map((item) => {
                const expiry = new Date(item.expiry_date);
                const today = new Date();
                const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                return { ...item, _daysLeft: diffDays };
            })
            .filter((item) => item._daysLeft >= 0 && item._daysLeft <= 30)
            .sort((a, b) => a._daysLeft - b._daysLeft)
            .slice(0, 5);

        const recentRows = [...rows].slice(0, 5).map((item, index) => ({
            ...item,
            _tone: index % 2 === 0 ? 'success' : 'danger',
        }));

        const dateGrouped = filteredReferenceRows.reduce((acc, row) => {
            const dateKey = getItemFilterDate(row);
            if (!dateKey) return acc;
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(row);
            return acc;
        }, {});

        const dateKeys = Object.keys(dateGrouped).sort().slice(-7);

        const chartRows = dateKeys.length
            ? dateKeys.map((dateKey) => {
                const dayRows = dateGrouped[dateKey];
                const value = dayRows.reduce((sum, row) => {
                    const rowValue = Number(
                        row.quantity ??
                        row.stock ??
                        row.total_eggs ??
                        row.used ??
                        row.mortality ??
                        0
                    );
                    return sum + (Number.isFinite(rowValue) ? rowValue : 0);
                }, 0);

                return { label: dateKey.slice(5), value: Math.max(0, Math.round(value)) };
            })
            : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, idx) => {
                const row = rows[idx];
                const fallback = Math.max(5, Math.round((rows.length || 1) * (0.55 + (idx * 0.06))));
                if (!row) return { label, value: fallback };
                const value = Number(
                    row.quantity ??
                    row.stock ??
                    row.total_eggs ??
                    row.used ??
                    row.mortality ??
                    fallback
                );
                return { label, value: Number.isFinite(value) ? value : fallback };
            });

        const maxValue = Math.max(...chartRows.map((c) => c.value), 1);
        const kpiValue = chartRows.reduce((sum, c) => sum + c.value, 0);

        return {
            recentRows,
            expiringRows,
            lowStockRows,
            chartRows,
            maxValue,
            kpiValue,
        };
    }, [items, data, filters.date]);

    const infographicCopy = useMemo(() => {
        const map = {
            chicken: {
                recentTitle: 'Recent Chicken Transactions',
                recentSubtitle: 'Latest building and batch movements',
                expiringTitle: 'Transfer-Ready (Within 30 Days)',
                expiringSubtitle: 'Growers approaching transfer readiness',
                lowTitle: 'Health & Low Stock Alerts',
                lowSubtitle: 'Bird count and risk thresholds',
                chartTitle: 'Chicken Movement (This Week)',
                kpiLabel: 'Total Bird Movement',
                trendLabel: 'Movement trend is stable this week',
                icon: 'bi-egg-fried',
            },
            feeds: {
                recentTitle: 'Recent Feed Transactions',
                recentSubtitle: 'Latest feed stock updates by category',
                expiringTitle: 'Usage Forecast (Within 30 Days)',
                expiringSubtitle: 'Categories with projected demand',
                lowTitle: 'Low Feed Stock Alerts',
                lowSubtitle: 'Stock levels close to reorder point',
                chartTitle: 'Feed Usage (This Week)',
                kpiLabel: 'Total Feed Used',
                trendLabel: 'Feed consumption pacing is healthy',
                icon: 'bi-bucket',
            },
            medicine: {
                recentTitle: 'Recent Medicine Transactions',
                recentSubtitle: 'Latest medicine and vaccine activity',
                expiringTitle: 'Expiring Soon (Within 30 Days)',
                expiringSubtitle: 'Items that need immediate consumption',
                lowTitle: 'Low Medicine Stock Alerts',
                lowSubtitle: 'Critical inventory levels to restock',
                chartTitle: 'Medicine & Vaccine Usage',
                kpiLabel: 'Total Item Used',
                trendLabel: 'Usage trend remains within expected range',
                icon: 'bi-capsule',
            },
            eggs: {
                recentTitle: 'Recent Egg Production Entries',
                recentSubtitle: 'Latest collection and quality records',
                expiringTitle: 'Upcoming Collection Focus',
                expiringSubtitle: 'Buildings with lower recent output',
                lowTitle: 'Production Quality Alerts',
                lowSubtitle: 'Quality and output areas needing attention',
                chartTitle: 'Egg Collection (This Week)',
                kpiLabel: 'Total Eggs Tracked',
                trendLabel: 'Collection trend is improving gradually',
                icon: 'bi-basket',
            },
            medications: {
                recentTitle: 'Recent Medication Transactions',
                recentSubtitle: 'Latest medication stock movement',
                expiringTitle: 'Expiring Soon (Within 30 Days)',
                expiringSubtitle: 'Medication items nearing expiry',
                lowTitle: 'Low Medication Stock Alerts',
                lowSubtitle: 'Items nearing minimum stock threshold',
                chartTitle: 'Medication Consumption (This Week)',
                kpiLabel: 'Total Item Used',
                trendLabel: 'Consumption trend is steady and monitored',
                icon: 'bi-box-seam',
            },
        };

        return map[activeTab] || map.chicken;
    }, [activeTab]);

    const setTab = (tabId) => {
        setSearchParams({ tab: tabId });
    };

    return (
        <PageState loading={loading} error={error} loadingLabel="Loading stock data...">
            {resource.summaryFields && (
                <SummaryCards fields={resource.summaryFields} summary={data?.summary} />
            )}
            <div className="dailyReport_container">
                <button
                    type="button"
                    className="dailyReport_btn"
                    onClick={() => {
                        setDailyReportForm(getDefaultDailyReportForm());
                        setDailyReportMessage(null);
                        setDailyReportOpen(true);
                    }}
                >
                    <i className="bi bi-journal-check"></i> Create Daily Report
                </button>
            </div>

            <div className="data-panel">
                <ModuleTabs tabs={stockTabs} activeTab={activeTab} onChange={setTab} />

                <div className="data-panel-toolbar">
                    <div className="data-panel-filters data-panel-filters--stacked">
                        <div className="data-panel-filter-group">
                            {tabFilters?.includes('type') && (
                                <AnimatedSelect
                                    value={filters.type}
                                    onChange={(option) => setFilters({ ...filters, type: option })}
                                    options={typeOptions}
                                    placeholder="All Type"
                                />
                            )}
                            {tabFilters?.includes('status') && (
                                <AnimatedSelect
                                    value={filters.status}
                                    onChange={(option) => setFilters({ ...filters, status: option })}
                                    options={statusOptions}
                                    placeholder="All Status"
                                />
                            )}
                            {tabFilters?.includes('category') && (
                                <AnimatedSelect
                                    value={filters.category}
                                    onChange={(option) => setFilters({ ...filters, category: option })}
                                    options={categorySelectOptions}
                                    placeholder="All Category"
                                />
                            )}
                            {tabFilters?.includes('building') && (
                                <AnimatedSelect
                                    value={filters.building}
                                    onChange={(option) => setFilters({ ...filters, building: option })}
                                    options={buildingOptions}
                                    placeholder="All Buildings"
                                />
                            )}
                            {tabFilters?.includes('date') && (
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
                                <>

                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setTransferOpen(true)}
                                        disabled={transferableFlocks.length === 0 || availableLayerBuildings.length === 0}
                                    >
                                        <i className="bi bi-arrow-left-right"></i> Transfer Chicken
                                    </button>
                                </>
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
                                {resource.expandable && <th style={{ width: 40 }}></th>}
                                {resource.columns.map((col) => <th key={col.key}>{col.label}</th>)}
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedItems.length ? pagedItems.map((item) => {
                                const isMature = activeTab === 'chicken' && item.type === 'Growers' && getAgeWeeks(item) >= 18;
                                const dueforCull= activeTab === 'chicken' && item.type === 'Layers' && getAgeWeeks(item) >= 100;
                                const rowKey = item.id || item.batch_no || item.item_code || item.name || item.building?.name || `row-${item.building_id}`;
                                const isExpanded = expandedRows.has(rowKey);
                                const colSpan = resource.columns.length + (resource.expandable ? 2 : 1);
                                return (
                                    <React.Fragment key={rowKey}>
                                    <tr className={[isMature && 'row-mature', dueforCull && 'row-cull', resource.expandable && 'expandable-row', isExpanded && 'expanded'].filter(Boolean).join(' ')}>
                                    {resource.expandable && (
                                        <td>
                                            <button type="button" className="expand-toggle" onClick={() => toggleRow(rowKey)}>
                                                <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`}></i>
                                            </button>
                                        </td>
                                    )}
                                    {resource.columns.map((col) => {
                                        const value = col.render ? col.render(item) : item[col.key] ?? '';
                                        if (col.badge) {
                                            const slug = String(value || '').toLowerCase().replace(/\s+/g, '-');
                                            return (
                                                <td key={col.key}>
                                                    <span className={`status-pill status-${slug || 'active'}`}>{value || 'active'}</span>
                                                </td>
                                            );
                                        }
                                        return <td key={col.key}>{value}</td>;
                                    })}
                                    <td>
                                        <RowActionButtons
                                            onView={() => setViewItem(item)}
                                            onEdit={item.status === 'active' ? () => openEdit(item) : null}
                                            onClose={activeTab === 'chicken' && item.status === 'active'
                                                ? () => openCloseBatch(item)
                                                : null}
                                        />
                                    </td>
                                </tr>
                                {resource.expandable && isExpanded && (
                                    <tr className="expand-detail-row">
                                        <td colSpan={colSpan}>
                                            <div className="expand-detail-grid">
                                                <div className="expand-detail-section good-eggs-section">
                                                    <div className="expand-detail-header">
                                                        <h4><i className="bi bi-emoji-smile"></i> Good Eggs</h4>
                                                        <span className="expand-detail-total">
                                                            {(resource.goodEggBreakdown || []).reduce((sum, b) => sum + (Number(item[b.key]) || 0), 0)}
                                                        </span>
                                                    </div>
                                                    <table className="expand-detail-table">
                                                        <tbody>
                                                            {(resource.goodEggBreakdown || []).map((b) => (
                                                                <tr key={b.key}>
                                                                    <td>{b.label}</td>
                                                                    <td><span className="egg-count-pill good">{Number(item[b.key]) || 0}</span></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="expand-detail-section defective-eggs-section">
                                                    <div className="expand-detail-header">
                                                        <h4><i className="bi bi-exclamation-triangle"></i> Defective Eggs</h4>
                                                        <span className="expand-detail-total">
                                                            {(resource.defectiveEggBreakdown || []).reduce((sum, b) => sum + (Number(item[b.key]) || 0), 0)}
                                                        </span>
                                                    </div>
                                                    <table className="expand-detail-table">
                                                        <tbody>
                                                            {(resource.defectiveEggBreakdown || []).map((b) => (
                                                                <tr key={b.key}>
                                                                    <td>{b.label}</td>
                                                                    <td><span className="egg-count-pill defective">{Number(item[b.key]) || 0}</span></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                                );
                            }) : (
                                <tr><td colSpan={resource.columns.length + (resource.expandable ? 2 : 1)}>No records found.</td></tr>
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

            <div className="stock-infographics">
                <div className="stock-infographics-grid">
                    <PanelCard title={infographicCopy.recentTitle} subtitle={infographicCopy.recentSubtitle} icon={infographicCopy.icon}>
                        <ul className="stock-info-list">
                            {infographicContext.recentRows.length ? infographicContext.recentRows.map((row, index) => (
                                <li key={`recent-${row.id || row.name || row.batch_no || index}`}>
                                    <span className={`stock-info-dot ${row._tone === 'danger' ? 'tone-danger' : 'tone-success'}`}></span>
                                    <div>
                                        <strong>{row.name || row.batch_no || row.category || `Item ${index + 1}`}</strong>
                                        <small>{row.category || row.type || row.status || 'Updated recently'}</small>
                                    </div>
                                </li>
                            )) : <li className="stock-info-empty">No recent records.</li>}
                        </ul>
                    </PanelCard>

                    <PanelCard title={infographicCopy.expiringTitle} subtitle={infographicCopy.expiringSubtitle} icon="bi-hourglass-split">
                        <ul className="stock-info-list">
                            {(infographicContext.expiringRows.length ? infographicContext.expiringRows : infographicContext.recentRows).map((row, index) => (
                                <li key={`exp-${row.id || row.name || row.batch_no || index}`}>
                                    <span className="stock-info-dot tone-warning"></span>
                                    <div>
                                        <strong>{row.name || row.batch_no || `Record ${index + 1}`}</strong>
                                        <small>
                                            {row._daysLeft !== undefined
                                                ? `Expiry in ${row._daysLeft} day(s)`
                                                : infographicCopy.expiringSubtitle}
                                        </small>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </PanelCard>

                    <PanelCard title={infographicCopy.lowTitle} subtitle={infographicCopy.lowSubtitle} icon="bi-exclamation-triangle">
                        <ul className="stock-info-list">
                            {infographicContext.lowStockRows.length ? infographicContext.lowStockRows.map((row, index) => (
                                <li key={`low-${row.id || row.name || row.batch_no || index}`}>
                                    <span className="stock-info-dot tone-danger"></span>
                                    <div>
                                        <strong>{row.name || row.batch_no || row.category || `Item ${index + 1}`}</strong>
                                        <small>
                                            Current {(row.stock ?? row.quantity ?? row.total_eggs ?? 0)} | Reorder {(row.reorder_level ?? 20)}
                                        </small>
                                    </div>
                                </li>
                            )) : <li className="stock-info-empty">No low stock alerts.</li>}
                        </ul>
                    </PanelCard>
                </div>

                <PanelCard title={infographicCopy.chartTitle} subtitle="Last 7 records" icon="bi-bar-chart-line">
                    <div className="stock-usage-wrap">
                        <div className="stock-usage-chart">
                            {infographicContext.chartRows.map((entry) => {
                                const height = `${Math.max(8, (entry.value / infographicContext.maxValue) * 100)}%`;
                                return (
                                    <div className="stock-usage-bar-col" key={entry.label}>
                                        <span className="stock-usage-value">{entry.value}</span>
                                        <div className="stock-usage-track">
                                            <span className="stock-usage-fill" style={{ height }}></span>
                                        </div>
                                        <span className="stock-usage-label">{entry.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <aside className="stock-usage-kpi">
                            <div className="stock-usage-kpi-icon">
                                <i className={`bi ${infographicCopy.icon}`}></i>
                            </div>
                            <div>
                                <span>{infographicCopy.kpiLabel}</span>
                                <strong>{infographicContext.kpiValue}</strong>
                                <small>{infographicCopy.trendLabel}</small>
                            </div>
                        </aside>
                    </div>
                </PanelCard>
            </div>

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
                {formError && <div className="alert-error">{formError}</div>}
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
                open={isDailyReportOpen}
                title="Create Daily Report"
                size="landscape"
                onClose={closeDailyReportModal}
                actions={(
                    <>
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={closeDailyReportModal}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" form="daily-report-form" disabled={dailyReportSubmitting}>
                            {dailyReportSubmitting ? 'Saving...' : 'Save Report'}
                        </button>
                    </>
                )}
            >
                {dailyReportError && <div className="alert-error">{dailyReportError}</div>}
                {dailyReportMessage && <div className="alert-success">{dailyReportMessage}</div>}
                <form id="daily-report-form" onSubmit={handleDailyReportSubmit}>

                    <p className="form-required-note">
                        Fields marked with <span className="form-required-mark">*</span> are required.
                    </p>
                    <div className="dr-form">
                        {/* Building Selection */}
                        <div className="dr-section">
                            <div className="dr-section-title"><i className="bi bi-building"></i> Building</div>
                            <div className="modal-form-grid">
                                <div className="form-group">
                                    <FormLabel htmlFor="dr-building" required>Select Building</FormLabel>
                                    <select
                                        id="dr-building"
                                        className="form-control"
                                        value={dailyReportForm.building_id}
                                        onChange={(e) => setDailyReportForm((prev) => ({ ...prev, building_id: e.target.value }))}
                                        required
                                    >
                                        <option value="">-- Choose Building --</option>
                                        {activeBuildings.map((b) => (
                                            <option key={b.id} value={String(b.id)}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <FormLabel>Available Chickens</FormLabel>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={selectedBuildingFlock ? `${selectedBuildingFlock.quantity ?? 0} birds (${selectedBuildingFlock.batch_no || ''})` : '—'}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Cull, Mortality, Feed */}
                        <div className="dr-section">
                            <div className="dr-section-title"><i className="bi bi-clipboard2-pulse"></i> Operations</div>
                            <div className="modal-form-grid cols-4">
                                <div className="form-group">
                                    <FormLabel htmlFor="dr-cull">Cull</FormLabel>
                                    <input
                                        id="dr-cull"
                                        type="number"
                                        className="form-control"
                                        min="0"
                                        value={dailyReportForm.cull}
                                        onChange={(e) => setDailyReportForm((prev) => ({ ...prev, cull: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <FormLabel htmlFor="dr-mortality">Mortality</FormLabel>
                                    <input
                                        id="dr-mortality"
                                        type="number"
                                        className="form-control"
                                        min="0"
                                        value={dailyReportForm.mortality}
                                        onChange={(e) => setDailyReportForm((prev) => ({ ...prev, mortality: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <FormLabel htmlFor="dr-feed-type">Feed Type</FormLabel>
                                    <select
                                        id="dr-feed-type"
                                        className="form-control"
                                        value={dailyReportForm.feed_type}
                                        onChange={(e) => setDailyReportForm((prev) => ({ ...prev, feed_type: e.target.value, feed: '' }))}
                                    >
                                        <option value="">-- Select Type --</option>
                                        {availableFeedTypes.map((ft) => (
                                            <option key={ft.id} value={ft.category || ft.name}>
                                                {ft.category || ft.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <FormLabel htmlFor="dr-feed">Feed (kg){selectedFeedMaxStock != null ? ` — Available: ${selectedFeedMaxStock}kg` : ''}</FormLabel>
                                    <input
                                        id="dr-feed"
                                        type="number"
                                        className={`form-control${dailyReportForm.feed && selectedFeedMaxStock != null && Number(dailyReportForm.feed) > selectedFeedMaxStock ? ' is-invalid' : ''}`}
                                        min="0"
                                        max={selectedFeedMaxStock ?? undefined}
                                        value={dailyReportForm.feed}
                                        onChange={(e) => setDailyReportForm((prev) => ({ ...prev, feed: e.target.value }))}
                                    />
                                    {dailyReportForm.feed && selectedFeedMaxStock != null && Number(dailyReportForm.feed) > selectedFeedMaxStock && (
                                        <div className="invalid-feedback" style={{ display: 'block' }}>
                                            Feed amount exceeds available stock ({selectedFeedMaxStock}kg).
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Good Eggs */}
                        <div className="dr-section">
                            <div className="dr-section-title"><i className="bi bi-emoji-smile"></i> Good Eggs</div>
                            <div className="dr-egg-grid">
                                {goodEggTypes.map((egg) => (
                                    <div className="form-group" key={egg.key}>
                                        <FormLabel htmlFor={`dr-egg-${egg.key}`}>{egg.label}</FormLabel>
                                        <input
                                            id={`dr-egg-${egg.key}`}
                                            type="number"
                                            className="form-control"
                                            min="0"
                                            value={dailyReportForm.eggs[egg.key]}
                                            onChange={(e) => updateDailyReportEgg(egg.key, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Defective Eggs */}
                        <div className="dr-section">
                            <div className="dr-section-title"><i className="bi bi-exclamation-triangle"></i> Defective Eggs</div>
                            <div className="dr-egg-grid">
                                {defectiveEggTypes.map((egg) => (
                                    <div className="form-group" key={egg.key}>
                                        <FormLabel htmlFor={`dr-egg-${egg.key}`}>{egg.label}</FormLabel>
                                        <input
                                            id={`dr-egg-${egg.key}`}
                                            type="number"
                                            className="form-control"
                                            min="0"
                                            value={dailyReportForm.eggs[egg.key]}
                                            onChange={(e) => updateDailyReportEgg(egg.key, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            <Modal
                open={isCloseBatchOpen}
                title="Close Batch"
                size="landscape"
                onClose={closeCloseBatchModal}
                actions={(
                    <>
                        <button type="button" className="btn btn-outline" onClick={closeCloseBatchModal}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary btn-row-action--warn"
                            form="close-batch-form"
                            disabled={closeBatchSubmitting}
                        >
                            {closeBatchSubmitting ? 'Closing...' : 'Close Batch'}
                        </button>
                    </>
                )}
            >
                {closeBatchError && <div className="alert-error">{closeBatchError}</div>}
                {closeBatchItem && (
                    <form id="close-batch-form" onSubmit={handleCloseBatch}>
                        <p className="form-help-text">
                            Closing <strong>{closeBatchItem.batch_no}</strong> in{' '}
                            <strong>{closeBatchItem.building_name}</strong> will free this building for a new batch.
                            Final counts (quantity, mortality, cull) are kept in batch history.
                        </p>
                        <div className="modal-form-grid">
                            <div className="form-group">
                                <FormLabel htmlFor="close-batch-reason" required>Reason</FormLabel>
                                <select
                                    id="close-batch-reason"
                                    className="form-control"
                                    value={closeBatchForm.closed_reason}
                                    onChange={(e) => setCloseBatchForm({ closed_reason: e.target.value })}
                                    required
                                >
                                    {(resource.closeReasonOptions || []).map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <FormLabel>Current Quantity</FormLabel>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={`${closeBatchItem.quantity ?? 0} birds`}
                                    readOnly
                                />
                            </div>
                        </div>
                    </form>
                )}
            </Modal>

            <Modal
                open={isTransferOpen}
                title="Transfer Chicken to Layer Building"
                size="landscape"
                onClose={() => {
                    setTransferOpen(false);
                    setTransferForm({ flock_id: '', destination_building: '' });
                    setTransferError(null);
                }}
                actions={(
                    <>
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => {
                                setTransferOpen(false);
                                setTransferForm({ flock_id: '', destination_building: '' });
                                setTransferError(null);
                            }}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" form="transfer-form">
                            Transfer
                        </button>
                    </>
                )}
            >
                {transferError && <div className="alert-error">{transferError}</div>}
                <form id="transfer-form" onSubmit={handleTransfer}>
                    <div className="modal-form-grid">
                        <div className="form-group">
                            <FormLabel htmlFor="transfer-flock" required>Select Grower Flock (18+ weeks)</FormLabel>
                            <select
                                id="transfer-flock"
                                className="form-control"
                                value={transferForm.flock_id}
                                onChange={(e) => setTransferForm({ ...transferForm, flock_id: e.target.value })}
                                required
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
                            <FormLabel htmlFor="transfer-destination" required>Destination Layer Building (B-04 to B-11)</FormLabel>
                            <select
                                id="transfer-destination"
                                className="form-control"
                                value={transferForm.destination_building}
                                onChange={(e) => setTransferForm({ ...transferForm, destination_building: e.target.value })}
                                required
                            >
                                <option value="">Select a building</option>
                                {availableLayerBuildings.map((b) => (
                                    <option key={b.id} value={b.name}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </form>
            </Modal>

            <Modal
                open={isRestockOpen}
                title="Restock Feed"
                size="landscape"
                onClose={() => {
                    setRestockOpen(false);
                    setRestockForm({ feed_id: '', quantity: '', expiry_date: '' });
                    setRestockError(null);
                    setRestockMessage(null);
                }}
                actions={(
                    <>
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => {
                                setRestockOpen(false);
                                setRestockForm({ feed_id: '', quantity: '', expiry_date: '' });
                                setRestockError(null);
                                setRestockMessage(null);
                            }}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" form="restock-form">
                            Restock
                        </button>
                    </>
                )}
            >
                {restockError && <div className="alert-error">{restockError}</div>}
                {restockMessage && <div className="alert-success">{restockMessage}</div>}
                <form id="restock-form" onSubmit={handleRestockSubmit}>
                    <p className="form-required-note">
                        Fields marked with <span className="form-required-mark">*</span> are required.
                    </p>
                    <div className="modal-form-grid cols-3">
                        <div className="form-group">
                            <FormLabel htmlFor="restock-feed" required>Select Feed Item</FormLabel>
                            <select
                                id="restock-feed"
                                className="form-control"
                                value={restockForm.feed_id}
                                onChange={(e) => setRestockForm({ ...restockForm, feed_id: e.target.value })}
                                required
                            >
                                <option value="">-- Choose Feed --</option>
                                {(data?.items || []).map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.category || 'N/A'}) — Current: {item.stock}kg
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <FormLabel htmlFor="restock-qty" required>Quantity to Add (kg)</FormLabel>
                            <input
                                id="restock-qty"
                                type="number"
                                className="form-control"
                                min="0.01"
                                step="0.01"
                                value={restockForm.quantity}
                                onChange={(e) => setRestockForm({ ...restockForm, quantity: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <FormLabel htmlFor="restock-expiry">Expiry Date</FormLabel>
                            <input
                                id="restock-expiry"
                                type="date"
                                className="form-control"
                                value={restockForm.expiry_date}
                                onChange={(e) => setRestockForm({ ...restockForm, expiry_date: e.target.value })}
                            />
                        </div>
                    </div>
                </form>
            </Modal>

        </PageState>
    );
}
