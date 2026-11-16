import { useState, useEffect } from 'react';
import { loadSavedCalendarDate } from '../utils/calendarEngine';

/** Fecha visible del Calendario (persistida en sessionStorage) y navegación por meses. */
export function useCalendarDate() {
    const [currentDate, setCurrentDate] = useState(() => loadSavedCalendarDate());

    useEffect(() => {
        sessionStorage.setItem('forma_calendar_date', currentDate.toISOString());
    }, [currentDate]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => setCurrentDate(new Date());

    return { currentDate, setCurrentDate, year, month, prevMonth, nextMonth, goToday };
}
