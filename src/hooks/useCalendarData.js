import { useMemo } from 'react';
import {
    groupActivitiesByDate, indexPmcByDate, buildCalendarGrid,
} from '../utils/calendarEngine';

/** Datos derivados del Calendario: actividades por día, PMC por fecha y cuadrícula del mes. */
export function useCalendarData({ activities, plannedWorkouts, pmcSeries, year, month }) {
    const activitiesByDate = useMemo(
        () => groupActivitiesByDate(activities, plannedWorkouts),
        [activities, plannedWorkouts]);

    const fullPmcByDate = useMemo(() => indexPmcByDate(pmcSeries), [pmcSeries]);

    const calendarGrid = useMemo(() => buildCalendarGrid(year, month), [year, month]);

    return { activitiesByDate, fullPmcByDate, calendarGrid };
}
