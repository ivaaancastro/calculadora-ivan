import { useMemo } from 'react';
import {
    groupActivitiesByDate, indexPmcByDate, projectPmc, buildCalendarGrid,
} from '../utils/calendarEngine';

/** Datos derivados del Calendario: actividades por día, PMC (real + proyectado) y cuadrícula del mes. */
export function useCalendarData({ activities, plannedWorkouts, chartData, year, month }) {
    const activitiesByDate = useMemo(
        () => groupActivitiesByDate(activities, plannedWorkouts),
        [activities, plannedWorkouts]);

    const pmcByDate = useMemo(() => indexPmcByDate(chartData), [chartData]);

    const fullPmcByDate = useMemo(
        () => projectPmc(pmcByDate, plannedWorkouts),
        [pmcByDate, plannedWorkouts]);

    const calendarGrid = useMemo(() => buildCalendarGrid(year, month), [year, month]);

    return { activitiesByDate, pmcByDate, fullPmcByDate, calendarGrid };
}
