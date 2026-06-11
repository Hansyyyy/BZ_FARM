import { useCallback, useState } from 'react';
import axios from 'axios';
import useFetch from '../hooks/useFetch';
import { usePageSearch } from '../context/HeaderSearchContext';
import PageState from '../components/ui/PageState';
import PanelCard from '../components/ui/PanelCard';
import Modal from '../components/ui/Modal';
import ExportModal from '../components/ui/ExportModal';
import { exportTableData } from '../utils/exportData';

const reportColumns = [
    { key: 'report_name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'generated_at', label: 'Generated At', render: (report) => new Date(report.generated_at).toLocaleString() },
];

const reportTypeIcons = {
    Inventory: 'bi-box-seam',
    Production: 'bi-bar-chart-line',
    Sales: 'bi-cash-stack',
    Financial: 'bi-graph-up-arrow',
};

export default function ReportsPage() {
    const { data, loading, error, reload, setError } = useFetch('/api/reports');
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ report_name: '', category: '' });
    const [showCreate, setShowCreate] = useState(false);
    const [showExport, setShowExport] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        try {
            await axios.post('/api/reports/generate', form);
            setShowCreate(false);
            setForm({ report_name: '', category: '' });
            await reload();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSearchChange = useCallback((value) => {
        setSearch(value);
    }, []);

    usePageSearch('Search reports...', search, handleSearchChange);

    const filteredReports = data?.reports?.filter((report) => {
        if (!search.trim()) return true;
        const query = search.toLowerCase();
        return (
            String(report.report_name || '').toLowerCase().includes(query) ||
            String(report.category || '').toLowerCase().includes(query)
        );
    }) || [];

    return (
        <PageState loading={loading} error={error} loadingLabel="Loading reports...">
            <div className="grid-3 report-types">
                {data?.reportTypes?.map((type) => (
                    <PanelCard key={type.name} title={type.name} icon={reportTypeIcons[type.category] || 'bi-file-earmark-text'}>
                        <div className="report-type-meta">
                            <span className="report-type-icon">
                                <i className={`bi ${reportTypeIcons[type.category] || 'bi-file-earmark-text'}`}></i>
                            </span>
                            <p className="report-type-category">{type.category}</p>
                        </div>
                    </PanelCard>
                ))}
            </div>

            <div className="data-panel">
                <div className="data-panel-toolbar">
                    <div className="data-panel-filters">
                        <button type="button" className="btn btn-outline" onClick={() => setShowExport(true)}>
                            <i className="bi bi-printer"></i> Export
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
                            <i className="bi bi-plus-lg"></i> Generate
                        </button>
                    </div>
                </div>

                <div className="data-panel-title">Generated Reports</div>

                <div className="table-responsive">
                    <table className="data-table mockup-table">
                        <thead><tr><th>Name</th><th>Category</th><th>Generated At</th></tr></thead>
                        <tbody>
                            {filteredReports.length ? filteredReports.map((report) => (
                                <tr key={report.id}>
                                    <td>{report.report_name}</td>
                                    <td>{report.category}</td>
                                    <td>{new Date(report.generated_at).toLocaleString()}</td>
                                </tr>
                            )) : <tr><td colSpan="3">No reports generated yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal open={showCreate} title="Generate Report" size="landscape" onClose={() => setShowCreate(false)} actions={(
                <>
                    <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" form="report-form">Create</button>
                </>
            )}>
                <form id="report-form" onSubmit={submit}>
                    <div className="modal-form-grid">
                        <div className="form-group">
                            <label>Report Name</label>
                            <input className="form-control" value={form.report_name} onChange={(e) => setForm({ ...form, report_name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <input className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
                        </div>
                    </div>
                </form>
            </Modal>

            <ExportModal
                open={showExport}
                title="Export Reports"
                description="Choose how you want to export your generated reports."
                onClose={() => setShowExport(false)}
                onExport={(format) => exportTableData({ title: 'Generated Reports', columns: reportColumns, rows: filteredReports, format })}
            />
        </PageState>
    );
}
