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

/** Etiqueta del pico más cercano al punto activo (o null). */
export const getActivePeakType = (activePayload, peaks, isPaceBased) => {
    if (!activePayload || !peaks) return null;
    if (peaks.maxHrPt && activePayload.hr && activePayload.hr >= peaks.maxHrPt.hr - 2) {
        return { label: 'Pico FC', value: `${peaks.maxHrPt.hr} bpm`, color: 'text-hr-ink bg-hr/10 border-hr/30' };
    }
    if (peaks.maxWattsPt && activePayload.watts && activePayload.watts >= peaks.maxWattsPt.watts - 15) {
        return { label: 'Pico Potencia', value: `${peaks.maxWattsPt.watts} W`, color: 'text-power-ink bg-power/10 border-power/30' };
    }
    if (isPaceBased && peaks.bestPacePt && activePayload.pace && activePayload.pace <= peaks.bestPacePt.pace + 0.1) {
        return { label: 'Ritmo Máx', value: formatPace(peaks.bestPacePt.pace), color: 'text-pace-ink bg-pace/10 border-pace/30' };
    }
    if (!isPaceBased && peaks.maxSpeedPt && activePayload.speed && activePayload.speed >= peaks.maxSpeedPt.speed - 1) {
        return { label: 'Velocidad Máx', value: `${peaks.maxSpeedPt.speed} km/h`, color: 'text-speed-ink bg-speed/10 border-speed/30' };
    }
    if (peaks.maxAltPt && activePayload.alt && activePayload.alt >= peaks.maxAltPt.alt - 3) {
        return { label: 'Cima', value: `${peaks.maxAltPt.alt} m`, color: 'text-body-2 bg-fill-2 border-line-strong' };
    }
    return null;
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
