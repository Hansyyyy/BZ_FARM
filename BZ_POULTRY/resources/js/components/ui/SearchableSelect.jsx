import { useEffect, useMemo, useRef, useState } from 'react';

export default function SearchableSelect({
    label,
    placeholder = 'Search and select...',
    options = [],
    value,
    onChange,
    getOptionLabel = (option) => option.name,
    getOptionValue = (option) => option.id,
    emptyMessage = 'No matches found.',
}) {
    const wrapRef = useRef(null);
    const panelRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [panelStyle, setPanelStyle] = useState({});

    const selected = useMemo(
        () => options.find((option) => String(getOptionValue(option)) === String(value)),
        [options, value, getOptionValue],
    );

    const filteredOptions = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return options;

        return options.filter((option) => getOptionLabel(option).toLowerCase().includes(normalized));
    }, [options, query, getOptionLabel]);

    const updatePanelPosition = () => {
        if (!wrapRef.current) return;

        const rect = wrapRef.current.getBoundingClientRect();
        setPanelStyle({
            top: rect.bottom + 6,
            left: rect.left,
            width: rect.width,
        });
    };

    useEffect(() => {
        if (!open) return undefined;

        updatePanelPosition();

        const handleReposition = () => updatePanelPosition();
        const handleClickOutside = (event) => {
            const clickedWrap = wrapRef.current?.contains(event.target);
            const clickedPanel = panelRef.current?.contains(event.target);
            if (!clickedWrap && !clickedPanel) {
                setOpen(false);
            }
        };

        window.addEventListener('resize', handleReposition);
        window.addEventListener('scroll', handleReposition, true);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('resize', handleReposition);
            window.removeEventListener('scroll', handleReposition, true);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open, filteredOptions.length]);

    const handleSelect = (option) => {
        onChange(getOptionValue(option));
        setQuery('');
        setOpen(false);
    };

    return (
        <div className={`searchable-select ${open ? 'is-open' : ''}`} ref={wrapRef}>
            {label && <label className="searchable-select-label">{label}</label>}
            <button
                type="button"
                className={`searchable-select-trigger ${open ? 'open' : ''}`}
                onClick={() => setOpen((current) => !current)}
            >
                <span className={selected ? 'searchable-select-value' : 'searchable-select-placeholder'}>
                    {selected ? getOptionLabel(selected) : placeholder}
                </span>
                <i className={`bi bi-chevron-${open ? 'up' : 'down'}`}></i>
            </button>

            {open && (
                <div
                    ref={panelRef}
                    className="searchable-select-panel searchable-select-panel-fixed"
                    style={panelStyle}
                >
                    <div className="searchable-select-search">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search..."
                            autoFocus
                        />
                    </div>
                    <div className="searchable-select-options">
                        {filteredOptions.length ? filteredOptions.map((option) => (
                            <button
                                key={getOptionValue(option)}
                                type="button"
                                className={`searchable-select-option ${String(getOptionValue(option)) === String(value) ? 'active' : ''}`}
                                onClick={() => handleSelect(option)}
                            >
                                {getOptionLabel(option)}
                            </button>
                        )) : (
                            <div className="searchable-select-empty">{emptyMessage}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
