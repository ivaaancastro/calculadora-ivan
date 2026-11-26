import { formatPace, formatNumber } from '../../../utils/formatters';
import { sportOf } from '../../../utils/sport';

/** Picos (FC, potencia, velocidad, ritmo, altitud) de la serie de la gráfica. */
export const computePeaks = (chartData) => {
    if (!chartData || chartData.length === 0) return null;
    let maxSpeedPt = null;
    let bestPacePt = null;
    let maxHrPt = null;
    let maxWattsPt = null;
    let maxAltPt = null;

    chartData.forEach(pt => {
        if (pt.speed !== null && (!maxSpeedPt || pt.speed > maxSpeedPt.speed)) maxSpeedPt = pt;
        if (pt.pace !== null && pt.pace > 0 && (!bestPacePt || pt.pace < bestPacePt.pace)) bestPacePt = pt;
        if (pt.hr !== null && (!maxHrPt || pt.hr > maxHrPt.hr)) maxHrPt = pt;
        if (pt.watts !== null && (!maxWattsPt || pt.watts > maxWattsPt.watts)) maxWattsPt = pt;
        if (pt.alt !== null && (!maxAltPt || pt.alt > maxAltPt.alt)) maxAltPt = pt;
    });

    return { maxSpeedPt, bestPacePt, maxHrPt, maxWattsPt, maxAltPt };
};

/** Velocidad media (km/h) o ritmo medio (/km) según el deporte. */
export const getSpeedOrPace = (activity, isPaceBased) => {
    const speedMs = activity.speed_avg || 0; if (speedMs === 0) return null;
    if (!isPaceBased) return { value: formatNumber(speedMs * 3.6, 1), unit: 'km/h', label: 'Vel. Media' };
    const minPerKm = 16.666666666667 / speedMs;
    return { value: formatPace(minPerKm), unit: '/km', label: 'Ritmo Medio' };
};

/** Color del deporte según el tipo de actividad. */
export const getSportTheme = (type, ct) => {
    return ct.sports[sportOf(type)] || ct.sports.other;
};
