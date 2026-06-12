import { useEffect, useMemo, useRef, useState } from 'react';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function padMonth(value) {
    return String(value).padStart(2, '0');
}

function toDateKey(year, month, day) {
    return `${year}-${padMonth(month + 1)}-${padMonth(day)}`;
}

function formatDisplayDate(value) {
    if (!value) return '';
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatMonthLabel(year, month) {
    return new Date(year, month, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });
}

function buildCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let index = 0; index < 42; index += 1) {
        const dayNumber = index - startOffset + 1;
        let cellYear = year;
        let cellMonth = month;
        let cellDay = dayNumber;

        if (dayNumber < 1) {
            cellMonth = month - 1;
            if (cellMonth < 0) {
                cellMonth = 11;
                cellYear = year - 1;
            }
            const prevMonthDays = new Date(cellYear, cellMonth + 1, 0).getDate();
            cellDay = prevMonthDays + dayNumber;
        } else if (dayNumber > daysInMonth) {
            cellMonth = month + 1;
            if (cellMonth > 11) {
                cellMonth = 0;
                cellYear = year + 1;
            }
            cellDay = dayNumber - daysInMonth;
        }

        cells.push({
            key: toDateKey(cellYear, cellMonth, cellDay),
            day: cellDay,
            isCurrentMonth: cellMonth === month && cellYear === year,
        });
    }

    return cells;
}

function getInitialViewDate(value) {
    if (value) {
        const [year, month] = value.split('-').map(Number);
        return new Date(year, month - 1, 1);
    }

    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
}

export default function AnimatedDatePicker({
    value,
    onChange,
    placeholder = 'All Dates',
    allowClear = true,
    className = '',
}) {
    const wrapRef = useRef(null);
    const panelRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => getInitialViewDate(value));
    const [slideDirection, setSlideDirection] = useState('');

    const today = new Date();
    const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    const calendarDays = useMemo(
        () => buildCalendarDays(viewDate.getFullYear(), viewDate.getMonth()),
        [viewDate]
    );

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

    useEffect(() => {
        if (open) {
            setViewDate(getInitialViewDate(value));
            setSlideDirection('');
        }
    }, [open, value]);

    const shiftMonth = (direction) => {
        setSlideDirection(direction > 0 ? 'next' : 'prev');
        setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    };

    const handleSelect = (dateKey) => {
        onChange(dateKey);
        setOpen(false);
    };

    const handleToday = () => {
        onChange(todayKey);
        setOpen(false);
    };

    const handleClear = () => {
        onChange('');
        setOpen(false);
    };

    const toggleOpen = () => {
        setOpen((current) => !current);
    };

    return (
        <div className={`animated-select animated-date-picker ${open ? 'is-open' : ''} ${className}`.trim()} ref={wrapRef}>
            <button
                type="button"
                className={`animated-select-trigger ${open ? 'open' : ''} ${value ? 'has-value' : ''}`}
                onClick={toggleOpen}
            >
                <span className={value ? 'animated-select-value' : 'animated-select-placeholder'}>
                    {value ? formatDisplayDate(value) : placeholder}
                </span>
                <i className="bi bi-calendar3 animated-date-icon" aria-hidden="true"></i>
            </button>

            {open && (
                <div ref={panelRef} className="animated-select-panel animated-date-panel">
                    <div className="animated-date-calendar">
                        <div className="animated-date-calendar-header">
                            <button
                                type="button"
                                className="animated-date-nav-btn"
                                onClick={() => shiftMonth(-1)}
                                aria-label="Previous month"
                            >
                                <i className="bi bi-chevron-left" aria-hidden="true"></i>
                            </button>
                            <span className="animated-date-month-label">
                                {formatMonthLabel(viewDate.getFullYear(), viewDate.getMonth())}
                            </span>
                            <button
                                type="button"
                                className="animated-date-nav-btn"
                                onClick={() => shiftMonth(1)}
                                aria-label="Next month"
                            >
                                <i className="bi bi-chevron-right" aria-hidden="true"></i>
                            </button>
                        </div>

                        <div className="animated-date-weekdays">
                            {WEEKDAYS.map((day) => (
                                <span key={day} className="animated-date-weekday">{day}</span>
                            ))}
                        </div>

                        <div
                            key={`${viewDate.getFullYear()}-${viewDate.getMonth()}`}
                            className={`animated-date-grid ${slideDirection ? `slide-${slideDirection}` : ''}`}
                        >
                            {calendarDays.map((cell) => (
                                <button
                                    key={cell.key}
                                    type="button"
                                    className={[
                                        'animated-date-day',
                                        cell.isCurrentMonth ? '' : 'animated-date-day-outside',
                                        cell.key === todayKey ? 'animated-date-day-today' : '',
                                        cell.key === value ? 'animated-date-day-selected' : '',
                                    ].filter(Boolean).join(' ')}
                                    onClick={() => handleSelect(cell.key)}
                                >
                                    {cell.day}
                                </button>
                            ))}
                        </div>

                        <div className="animated-date-footer">
                            <button type="button" className="animated-date-today-btn" onClick={handleToday}>
                                Today
                            </button>
                            {allowClear && value && (
                                <button type="button" className="animated-date-clear-btn" onClick={handleClear}>
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
