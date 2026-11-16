export const getPeakByTime = (hrData, timeData, windowSeconds) => {
    if (!hrData || !timeData || hrData.length < 2) return 0;
    let maxAvg = 0; let currentSum = 0; let count = 0; let left = 0;
    for (let right = 0; right < timeData.length; right++) {
        currentSum += hrData[right]; count++;
        while (timeData[right] - timeData[left] > windowSeconds) {
            currentSum -= hrData[left]; count--; left++;
        }
        if (timeData[right] - timeData[left] >= windowSeconds * 0.9) {
            if (count > 0) { let avg = currentSum / count; if (avg > maxAvg) maxAvg = avg; }
        }
    }
    return maxAvg;
};

// Zone labels for profile display (matches LTHR_ZONE_PCT order)
export const ZONE_LABELS = ['Recovery', 'Aerobic', 'Tempo', 'SubThreshold', 'SuperThreshold', 'Aerobic Capacity', 'Anaerobic'];

export const FCMAX_PCT = [
    { label: 'Recovery', pMin: 0, pMax: 0.59 },
    { label: 'Aerobic', pMin: 0.59, pMax: 0.74 },
    { label: 'Tempo', pMin: 0.74, pMax: 0.84 },
    { label: 'SubThreshold', pMin: 0.84, pMax: 0.90 },
    { label: 'SuperThreshold', pMin: 0.90, pMax: 0.94 },
    { label: 'Aerobic Capacity', pMin: 0.94, pMax: 0.97 },
    { label: 'Anaerobic', pMin: 0.97, pMax: 1.00 },
];

export const calcZonesFromFCMax = (maxHr) =>
    FCMAX_PCT.map((z, i) => ({
        min: i === 0 ? 0 : Math.round(maxHr * z.pMin),
        max: i === 6 ? maxHr : Math.round(maxHr * z.pMax),
    }));

// --- Pace zones (intervals.icu style: % of threshold speed) ---
export const paceToSec = (p) => { if (!p) return 270; const [m, s] = p.split(':'); return (parseInt(m) || 0) * 60 + (parseInt(s) || 0); };
export const secToPace = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

export const PACE_ZONES = [
    { label: 'Zone 1', sMin: 0, sMax: 0.775 },
    { label: 'Zone 2', sMin: 0.785, sMax: 0.877 },
    { label: 'Zone 3', sMin: 0.887, sMax: 0.943 },
    { label: 'Zone 4', sMin: 0.953, sMax: 1.00 },
    { label: 'Zone 5a', sMin: 1.01, sMax: 1.034 },
    { label: 'Zone 5b', sMin: 1.044, sMax: 1.115 },
    { label: 'Zone 5c', sMin: 1.125, sMax: 1.30 },
];

export const calcPaceZones = (thresholdPace) => {
    const tp = paceToSec(thresholdPace);
    return PACE_ZONES.map(z => ({
        label: z.label,
        pctMin: z.sMin, pctMax: z.sMax,
        // speed% → pace is inverse: higher speed% = lower pace
        min: z.sMax > 0 ? secToPace(tp / z.sMax) : '',
        max: z.sMin > 0 ? secToPace(tp / z.sMin) : '∞',
    }));
};

// --- Power zones (intervals.icu style: 7 zones + Sweet Spot) ---
export const POWER_ZONES = [
    { label: 'Active Recovery', pMin: 0, pMax: 0.55 },
    { label: 'Endurance', pMin: 0.56, pMax: 0.75 },
    { label: 'Tempo', pMin: 0.76, pMax: 0.90 },
    { label: 'Threshold', pMin: 0.91, pMax: 1.05 },
    { label: 'VO2 Max', pMin: 1.06, pMax: 1.20 },
    { label: 'Anaerobic', pMin: 1.21, pMax: 1.50 },
    { label: 'Neuromuscular', pMin: 1.51, pMax: 2.00 },
];
export const SWEET_SPOT = { label: 'Sweet Spot', pMin: 0.84, pMax: 0.97 };

export const ZONE_COLORS = ['#94a3b8', '#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7'];
export const HR_LABELS = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7'];
