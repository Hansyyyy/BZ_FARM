import { useMemo, useState } from 'react';
import axios from 'axios';
import useFetch from '../../hooks/useFetch';
import Modal from './Modal';
import FormLabel from '../forms/FormLabel';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function padMonth(value) {
    return String(value).padStart(2, '0');
}

function toDateKey(year, month, day) {
    return `${year}-${padMonth(month + 1)}-${padMonth(day)}`;
}

function formatMonthLabel(year, month) {
    return new Date(year, month, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });
}

function formatModalDate(dateKey) {
    return new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
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
            month: cellMonth,
            year: cellYear,
            isCurrentMonth: cellMonth === month && cellYear === year,
        });
    }

    return cells;
}

function truncateText(text, max = 18) {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max)}...` : text;
}

export default function FarmCalendar() {
    const today = new Date();
    const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(null);
    const [noteText, setNoteText] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const monthParam = `${viewDate.getFullYear()}-${padMonth(viewDate.getMonth() + 1)}`;
    const { data, reload } = useFetch(`/api/calendar-notes?month=${monthParam}`);

    const notesByDate = useMemo(() => {
        const map = {};
        (data?.notes || []).forEach((note) => {
            const dateKey = note.note_date?.slice?.(0, 10) || note.note_date;
            map[dateKey] = note;
        });
        return map;
    }, [data?.notes]);

    const holidaysByDate = useMemo(() => {
        const map = {};
        (data?.holidays || []).forEach((holiday) => {
            map[holiday.date] = holiday;
        });
        return map;
    }, [data?.holidays]);

    const calendarDays = useMemo(
        () => buildCalendarDays(viewDate.getFullYear(), viewDate.getMonth()),
        [viewDate]
    );

    const openDateModal = (dateKey) => {
        const existing = notesByDate[dateKey];
        setSelectedDate(dateKey);
        setNoteText(existing?.content || '');
        setError(null);
    };

    const closeModal = () => {
        setSelectedDate(null);
        setNoteText('');
        setError(null);
    };

    const goToToday = () => {
        setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    };

    const goToPreviousMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const saveNote = async (event) => {
        event.preventDefault();
        if (!selectedDate || !noteText.trim()) {
            setError('Please enter a note.');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const existing = notesByDate[selectedDate];
            if (existing?.id) {
                await axios.put(`/api/calendar-notes/${existing.id}`, { content: noteText.trim() });
            } else {
                await axios.post('/api/calendar-notes', {
                    note_date: selectedDate,
                    content: noteText.trim(),
                });
            }
            await reload();
            closeModal();
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to save note.');
        } finally {
            setSaving(false);
        }
    };

    const deleteNote = async () => {
        const existing = notesByDate[selectedDate];
        if (!existing?.id) {
            closeModal();
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await axios.delete(`/api/calendar-notes/${existing.id}`);
            await reload();
            closeModal();
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to delete note.');
        } finally {
            setSaving(false);
        }
    };

    const selectedNote = selectedDate ? notesByDate[selectedDate] : null;
    const selectedHoliday = selectedDate ? holidaysByDate[selectedDate] : null;

    return (
        <div className="farm-calendar">
            <div className="farm-calendar-toolbar">
                <button type="button" className="farm-calendar-today-btn" onClick={goToToday}>
                    Today
                </button>
                <div className="farm-calendar-nav">
                    <button type="button" className="farm-calendar-nav-btn" onClick={goToPreviousMonth} aria-label="Previous month">
                        <i className="bi bi-chevron-left"></i>
                    </button>
                    <button type="button" className="farm-calendar-nav-btn" onClick={goToNextMonth} aria-label="Next month">
                        <i className="bi bi-chevron-right"></i>
                    </button>
                    <h4 className="farm-calendar-month-label">
                        {formatMonthLabel(viewDate.getFullYear(), viewDate.getMonth())}
                    </h4>
                </div>
            </div>

            <div className="farm-calendar-grid">
                {WEEKDAYS.map((day) => (
                    <div key={day} className="farm-calendar-weekday">{day}</div>
                ))}

                {calendarDays.map((cell) => {
                    const note = notesByDate[cell.key];
                    const holiday = holidaysByDate[cell.key];
                    const isToday = cell.key === todayKey;

                    return (
                        <button
                            key={cell.key}
                            type="button"
                            className={[
                                'farm-calendar-day',
                                cell.isCurrentMonth ? '' : 'farm-calendar-day-outside',
                                isToday ? 'farm-calendar-day-today' : '',
                                note ? 'farm-calendar-day-has-note' : '',
                                holiday ? 'farm-calendar-day-has-holiday' : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => openDateModal(cell.key)}
                        >
                            <span className="farm-calendar-day-number">{cell.day}</span>
                            <div className="farm-calendar-day-events">
                                {holiday && (
                                    <span className="farm-calendar-holiday-badge" title={holiday.name}>
                                        {truncateText(holiday.name)}
                                    </span>
                                )}
                                {note && (
                                    <span className="farm-calendar-note-badge" title={note.content}>
                                        {truncateText(note.content)}
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="farm-calendar-footer">
                <span className="farm-calendar-footer-label">
                    <i className="bi bi-calendar-event"></i>
                    Holidays from Google Calendar
                </span>
            </div>

            <Modal
                open={Boolean(selectedDate)}
                title={selectedNote ? 'Edit Note' : 'Add Note'}
                onClose={closeModal}
                actions={(
                    <>
                        {selectedNote && (
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={deleteNote}
                                disabled={saving}
                            >
                                Delete
                            </button>
                        )}
                        <button type="button" className="btn btn-outline" onClick={closeModal} disabled={saving}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" form="calendar-note-form" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Note'}
                        </button>
                    </>
                )}
            >
                <form id="calendar-note-form" onSubmit={saveNote}>
                    <p className="farm-calendar-modal-date">{selectedDate ? formatModalDate(selectedDate) : ''}</p>
                    {selectedHoliday && (
                        <div className="farm-calendar-modal-holiday">
                            <i className="bi bi-calendar-event"></i>
                            <span>{selectedHoliday.name}</span>
                        </div>
                    )}
                    <p className="form-required-note">
                        Fields marked with <span className="form-required-mark">*</span> are required.
                    </p>
                    <div className="form-group">
                        <FormLabel htmlFor="calendar-note-content" required>Note</FormLabel>
                        <textarea
                            id="calendar-note-content"
                            className="form-control"
                            rows={4}
                            value={noteText}
                            onChange={(event) => setNoteText(event.target.value)}
                            placeholder="Enter a reminder or event for this date..."
                            maxLength={500}
                            required
                        />
                    </div>
                    {error && <p className="form-error">{error}</p>}
                </form>
            </Modal>
        </div>
    );
}
