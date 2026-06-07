import { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';

export default function ReportsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ report_name: '', category: '' });
    const [showCreate, setShowCreate] = useState(false);
    const [showExport, setShowExport] = useState(false);

    useEffect(() => {
        axios.get('/api/reports').then((response) => setData(response.data)).catch((err) => setError(err.message)).finally(() => setLoading(false));
    }, []);

    const submit = async (event) => {
        event.preventDefault();
        try {
            await axios.post('/api/reports/generate', form);
            setShowCreate(false);
            const response = await axios.get('/api/reports');
            setData(response.data);
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <p>Loading reports...</p>;
    if (error) return <div className="alert-error">{error}</div>;

    const filteredReports = data?.reports?.filter((report) => {
        if (!search.trim()) return true;
        const query = search.toLowerCase();
        return (
            String(report.report_name || '').toLowerCase().includes(query) ||
            String(report.category || '').toLowerCase().includes(query)
        );
    }) || [];

    return (
        <>
            <div className="card">
                <div className="card-header"><h3>Reports</h3></div>
                <div className="card-body">
                    <div className="table-toolbar" style={{ marginBottom: '1rem' }}>
                        <div className="search-box"><i className="bi bi-search"></i><input type="text" placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                        <div>
                            <button className="btn btn-outline" onClick={() => setShowExport(true)}><i className="bi bi-printer"></i> Export</button>
                            <button className="btn btn-success" onClick={() => setShowCreate(true)}><i className="bi bi-plus-lg"></i> Generate</button>
                        </div>
                    </div>
                    <div className="grid-3">
                        {data.reportTypes.map((type) => (
                            <div className="card" key={type.name}><div className="card-body"><div className="label">{type.name}</div><div className="sub">{type.category}</div></div></div>
                        ))}
                    </div>
                    <div className="card"><div className="card-header"><h3>Generated Reports</h3></div>
                        <div className="card-body">
                            <table className="data-table">
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
                </div>
            </div>

            <Modal open={showCreate} title="Generate Report" onClose={() => setShowCreate(false)} actions={(
                <>
                    <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                    <button type="submit" className="btn btn-success" form="report-form">Create</button>
                </>
            )}>
                <form id="report-form" onSubmit={submit}>
                    <div className="form-group"><label>Report Name</label><input className="form-control" value={form.report_name} onChange={(e) => setForm({ ...form, report_name: e.target.value })} required /></div>
                    <div className="form-group"><label>Category</label><input className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></div>
                </form>
            </Modal>

            <Modal open={showExport} title="Export Reports" onClose={() => setShowExport(false)} actions={(
                <>
                    <button type="button" className="btn btn-outline" onClick={() => setShowExport(false)}>Cancel</button>
                    <button type="button" className="btn btn-success" onClick={() => { window.alert('Export request submitted.'); setShowExport(false); }}>Export</button>
                </>
            )}>
                <div className="form-group"><label>Format</label><select className="form-control"><option value="pdf">PDF</option><option value="csv">CSV</option></select></div>
                <p>Choose a file format for the report export.</p>
            </Modal>
        </>
    );
}
