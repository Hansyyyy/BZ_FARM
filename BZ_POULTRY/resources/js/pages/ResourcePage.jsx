import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';

export default function ResourcePage({ config }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({});
    const [isAddOpen, setAddOpen] = useState(false);
    const [isExportOpen, setExportOpen] = useState(false);

    const heading = config.title;

    useEffect(() => {
        setLoading(true);
        axios.get(config.endpoint).then((response) => {
            setData(response.data);
            setForm({});
        }).catch((err) => {
            setError(err.message);
        }).finally(() => setLoading(false));
    }, [config.endpoint]);

    const items = useMemo(() => {
        const allItems = data?.items || [];
        if (!search.trim()) return allItems;
        const query = search.toLowerCase();
        return allItems.filter((item) => {
            return config.columns.some((col) => {
                const value = col.render ? col.render(item) : item[col.key] ?? '';
                return String(value).toLowerCase().includes(query);
            });
        });
    }, [data, search, config]);
    const summary = useMemo(() => data?.summary || {}, [data]);

    const submit = async (event) => {
        event.preventDefault();
        try {
            const payload = new FormData();
            Object.entries(form).forEach(([key, value]) => payload.append(key, value));
            await axios.post(config.endpoint, payload);
            setAddOpen(false);
            setLoading(true);
            const response = await axios.get(config.endpoint);
            setData(response.data);
        } catch (err) {
            setError(err.message);
        }
    };

    const remove = async (id) => {
        if (!window.confirm('Delete this item?')) return;
        try {
            await axios.delete(`${config.endpoint}/${id}`);
            setData((previous) => ({
                ...previous,
                items: previous.items.filter((item) => item.id !== id),
            }));
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return <p>Loading {heading}...</p>;
    }

    if (error) {
        return <div className="alert-error">{error}</div>;
    }

    return (
        <>
            <div className="card">
                <div className="card-header"><h3>{heading}</h3></div>
                <div className="card-body">
                    <div className="table-toolbar" style={{ marginBottom: '1rem' }}>
                        <div className="search-box"><i className="bi bi-search"></i><input type="text" placeholder={`Search ${heading.toLowerCase()}...`} value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                        <div>
                            <button className="btn btn-outline" onClick={() => setExportOpen(true)}><i className="bi bi-printer"></i> Export</button>
                            <button className="btn btn-success" onClick={() => setAddOpen(true)}><i className="bi bi-plus-lg"></i> Add New</button>
                        </div>
                    </div>
                    <div className="stat-cards">
                        {config.summaryFields.map((field) => (
                            <div className="stat-card" key={field.key}>
                                <div className="label">{field.label}</div>
                                <div className="value">{summary[field.key] ?? 0}</div>
                            </div>
                        ))}
                    </div>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {config.columns.map((col) => <th key={col.key}>{col.label}</th>)}
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length ? items.map((item) => (
                                    <tr key={item.id || item.batch_no || item.item_code || item.name}>
                                        {config.columns.map((col) => {
                                            const value = col.render ? col.render(item) : item[col.key] ?? '';
                                            return <td key={col.key}>{value}</td>;
                                        })}
                                        <td>
                                            <button className="action-btn delete" onClick={() => remove(item.id ?? item.id)}><i className="bi bi-trash"></i></button>
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan={config.columns.length + 1}>No records found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal open={isAddOpen} title={`Add ${heading}`} onClose={() => setAddOpen(false)} actions={(
                <>
                    <button type="button" className="btn btn-outline" onClick={() => setAddOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-success" form="add-form">Save</button>
                </>
            )}>
                <form id="add-form" onSubmit={submit}>
                    {config.formFields.map((field) => (
                        <div className="form-group" key={field.key}>
                            <label>{field.label}</label>
                            {field.type === 'select' ? (
                                <select className="form-control" value={form[field.key] || ''} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}>
                                    <option value="">Select {field.label}</option>
                                    {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                                </select>
                            ) : (
                                <input
                                    className="form-control"
                                    type={field.type}
                                    value={form[field.key] || ''}
                                    onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                                    required={field.type !== 'date'}
                                />
                            )}
                        </div>
                    ))}
                </form>
            </Modal>

            <Modal open={isExportOpen} title={`Export ${heading}`} onClose={() => setExportOpen(false)} actions={(
                <>
                    <button type="button" className="btn btn-outline" onClick={() => setExportOpen(false)}>Cancel</button>
                    <button type="button" className="btn btn-success" onClick={() => {
                        window.alert('Export request submitted.');
                        setExportOpen(false);
                    }}>Export</button>
                </>
            )}>
                <div className="form-group">
                    <label>Format</label>
                    <select className="form-control">
                        <option value="pdf">PDF</option>
                        <option value="csv">CSV</option>
                    </select>
                </div>
                <p>Select the file format for this module export.</p>
            </Modal>
        </>
    );
}
