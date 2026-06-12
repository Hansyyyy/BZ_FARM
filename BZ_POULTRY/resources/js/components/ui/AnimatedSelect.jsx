import { useEffect, useRef, useState } from 'react';

export default function AnimatedSelect({
    value,
    onChange,
    options = [],
    placeholder = 'Select...',
    label,
}) {
    const wrapRef = useRef(null);
    const panelRef = useRef(null);
    const [open, setOpen] = useState(false);

    const selectedOption = options.find((option) => String(option.value) === String(value));

    useEffect(() => {
        if (!open) return undefined;

        const handleClickOutside = (event) => {
            const clickedWrap = wrapRef.current?.contains(event.target);
            const clickedPanel = panelRef.current?.contains(event.target);
            if (!clickedWrap && !clickedPanel) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    const handleSelect = (option) => {
        onChange(option.value);
        setOpen(false);
    };

    return (
        <div className={`animated-select ${open ? 'is-open' : ''}`} ref={wrapRef}>
            {label && <span className="animated-select-label">{label}</span>}
            <button
                type="button"
                className={`animated-select-trigger ${open ? 'open' : ''}`}
                onClick={() => setOpen((current) => !current)}
            >
                <span className={selectedOption ? 'animated-select-value' : 'animated-select-placeholder'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <i className={`bi bi-chevron-${open ? 'up' : 'down'}`}></i>
            </button>

            {open && (
                <div
                    ref={panelRef}
                    className="animated-select-panel"
                >
                    <div className="animated-select-options">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={`animated-select-option ${String(option.value) === String(value) ? 'active' : ''}`}
                                onClick={() => handleSelect(option)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
