import { getChartTheme } from '../charts/chartTheme';

export const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];


// Shared zone styling used in both planner and viewer
const ZONES = getChartTheme('light').zones.all;
export const zoneColors = {
    Z1: ZONES[0], R12: ZONES[1], Z2: ZONES[1], R23: ZONES[2],
    Z3: ZONES[2], R34: ZONES[3], Z4: ZONES[3], Z5: ZONES[4], Z6: ZONES[5], Z7: ZONES[6],
};
export const getZoneColor = (z) => zoneColors[z] || ZONES[0];
