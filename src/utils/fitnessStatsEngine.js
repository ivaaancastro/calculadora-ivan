/**
 * fitnessStatsEngine.js — Motor de Estadísticas de Rendimiento
 *
 * 1. eFTP — Ratio-table approach (FastFitness.Tips / intervals.icu style)
 * 2. VO2max ciclismo — Usando pico 5min (MAP) en vez de media de actividad
 * 3. Pronóstico de carrera (Daniels VDOT, ajustado)
 * 4. Training Effect
 * 5. Perfil de potencia
 */

// ════════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════════

function getPeakPower(wattsData, timeData, windowSecs) {
    if (!wattsData || !timeData || wattsData.length === 0) return 0;
    let maxAvg = 0, startIdx = 0, currentSum = 0, currentCount = 0;
    for (let endIdx = 0; endIdx < timeData.length; endIdx++) {
        currentSum += wattsData[endIdx]; currentCount++;
        while (timeData[endIdx] - timeData[startIdx] > windowSecs) {
            currentSum -= wattsData[startIdx]; currentCount--; startIdx++;
        }
        if (timeData[endIdx] - timeData[startIdx] >= windowSecs * 0.90) {
            const avg = currentSum / currentCount;
            if (avg > maxAvg) maxAvg = avg;
        }
    }
    return maxAvg;
}

// ════════════════════════════════════════════════════════════════════════════════
// 1. eFTP — FastFitness.Tips Ratio Table (intervals.icu approach)
//
//    How intervals.icu works:
//    - Finds your best maximal effort (3min–30min range by default)
//    - Looks up the FastFitness.Tips CP curve that passes through that power at that duration
//    - Reads the 1-hour power from that curve = eFTP
//
//    We approximate this with empirically derived power-duration ratios.
//    For each duration, ratio = typical(power_at_duration / FTP).
//    Given peak power P at duration d:  eFTP ≈ P / ratio(d)
//    The HIGHEST estimate across all durations is used (= the most maximal effort).
// ════════════════════════════════════════════════════════════════════════════════

// Empirical power/FTP ratios from FastFitness.Tips mean curves.
// These represent average power at duration d, divided by the athlete's FTP.
const FTP_RATIO_TABLE = [
    { secs: 1,    ratio: 5.60 },   // Not used for eFTP (too short / too anaerobic)
    { secs: 5,    ratio: 4.20 },
    { secs: 10,   ratio: 3.20 },
    { secs: 30,   ratio: 2.10 },
    { secs: 60,   ratio: 1.70 },
    { secs: 120,  ratio: 1.45 },
    { secs: 180,  ratio: 1.35 },   // ← eFTP estimation starts here (3min)
    { secs: 300,  ratio: 1.22 },   // 5 min — most common test duration
    { secs: 480,  ratio: 1.15 },   // 8 min
    { secs: 600,  ratio: 1.12 },   // 10 min
    { secs: 900,  ratio: 1.08 },   // 15 min
    { secs: 1200, ratio: 1.05 },   // 20 min (classic FTP test × 0.95 → ratio = 1/0.95 ≈ 1.053)
    { secs: 1800, ratio: 1.02 },   // 30 min
    { secs: 3600, ratio: 1.00 },   // 60 min = FTP by definition
];

function interpolateRatio(secs) {
    const table = FTP_RATIO_TABLE;
    if (secs <= table[0].secs) return table[0].ratio;
    if (secs >= table[table.length - 1].secs) return table[table.length - 1].ratio;
    for (let i = 0; i < table.length - 1; i++) {
        if (secs >= table[i].secs && secs <= table[i + 1].secs) {
            const t = (Math.log(secs) - Math.log(table[i].secs)) / (Math.log(table[i + 1].secs) - Math.log(table[i].secs));
            return table[i].ratio + t * (table[i + 1].ratio - table[i].ratio);
        }
    }
    return 1.0;
}

// Durations used for building power curve
const CURVE_DURATIONS = [1, 3, 5, 10, 15, 30, 60, 120, 180, 300, 480, 600, 900, 1200, 1800, 2400, 3600, 5400, 7200];

// Durations considered for eFTP estimation (3min – 30min, intervals.icu default)
const EFTP_MIN_SECS = 180;
const EFTP_MAX_SECS = 1800;

export function estimateFTP(activities, settings) {
    const today = new Date();
    const d90 = new Date(today); d90.setDate(today.getDate() - 90);
    const weight = Number(settings?.weight) || 70;

    const bikeActivities = activities.filter(act => {
        const t = String(act.type).toLowerCase();
        return (t.includes('bici') || t.includes('ciclismo') || t.includes('ride'))
            && new Date(act.date) >= d90
            && act.streams_data?.watts?.data
            && act.streams_data?.time?.data;
    });

    if (bikeActivities.length === 0) {
        return { eFTP: null, method: 'none', description: 'Sin datos de potencia', powerCurve: [], modeledCurve: [], model: null };
    }

    // Build full MMP power curve
    const actualCurve = [];
    CURVE_DURATIONS.forEach(secs => {
        let bestPower = 0, bestAct = null;
        bikeActivities.forEach(act => {
            const peak = getPeakPower(act.streams_data.watts.data, act.streams_data.time.data, secs);
            if (peak > bestPower) { bestPower = peak; bestAct = { id: act.id, name: act.name, date: act.date }; }
        });
        if (bestPower > 0) actualCurve.push({ secs, power: Math.round(bestPower), activity: bestAct });
    });

    // ── eFTP from ratio table ────────────────────────────────────────────
    // For each MMP point in the 3min–30min range, estimate what FTP would be.
    // The HIGHEST estimate wins (= the most maximal effort).
    let bestEFTP = 0;
    let bestEstimate = null;

    actualCurve
        .filter(p => p.secs >= EFTP_MIN_SECS && p.secs <= EFTP_MAX_SECS)
        .forEach(p => {
            const ratio = interpolateRatio(p.secs);
            const eFTP = p.power / ratio;
            if (eFTP > bestEFTP) {
                bestEFTP = eFTP;
                bestEstimate = {
                    secs: p.secs,
                    power: p.power,
                    ratio,
                    activity: p.activity,
                };
            }
        });

    // Fallback if no efforts in the target range
    if (!bestEstimate) {
        const longestEffort = actualCurve.filter(p => p.secs >= 60).sort((a, b) => b.secs - a.secs)[0];
        if (longestEffort) {
            const ratio = interpolateRatio(longestEffort.secs);
            bestEFTP = longestEffort.power / ratio;
            bestEstimate = { secs: longestEffort.secs, power: longestEffort.power, ratio, activity: longestEffort.activity };
        }
    }

    const eFTP = bestEstimate ? Math.round(bestEFTP) : null;

    // ── Derive CP/W' model from eFTP for visualization ───────────────────
    // Use eFTP (at 3600s) and a shorter-duration point to derive W' via 2-parameter CP model
    let model = null;
    let modeledCurve = [];
    if (eFTP && actualCurve.length >= 2) {
        // Find the shortest effort with power above eFTP (prefer ≤ 60s for max spread)
        const shortEfforts = actualCurve
            .filter(p => p.power > eFTP * 1.01) // Must be clearly above eFTP
            .sort((a, b) => a.secs - b.secs);   // Sort by shortest first

        const shortEffort = shortEfforts[0];

        if (shortEffort) {
            // 2-parameter CP model: P(t) = CP + W'/t
            // System:  eFTP = CP + W'/3600  and  P_short = CP + W'/t_short
            // Solving: W' = (P_short - eFTP) * 3600 * t_short / (3600 - t_short)
            const wPrime = (shortEffort.power - eFTP) * 3600 * shortEffort.secs / (3600 - shortEffort.secs);
            const cp = eFTP - wPrime / 3600;

            if (cp > 0 && wPrime > 1000 && wPrime < 80000) {
                const pMax = cp + wPrime / 1;
                model = { cp: Math.round(cp), wPrime: Math.round(wPrime / 1000), wPrimeRaw: Math.round(wPrime), pMax: Math.round(pMax), eFTP };
                modeledCurve = CURVE_DURATIONS.filter(t => t >= 1).map(t => ({
                    secs: t,
                    power: Math.round(cp + wPrime / t),
                }));
            }
        }
    }

    const durationLabel = bestEstimate ? (bestEstimate.secs < 60 ? `${bestEstimate.secs}s` : bestEstimate.secs < 3600 ? `${bestEstimate.secs / 60}min` : `${bestEstimate.secs / 3600}h`) : '';

    return {
        eFTP,
        wPerKg: eFTP ? (eFTP / weight).toFixed(2) : null,
        method: eFTP ? 'ratio' : 'none',
        description: eFTP ? `Mejor esfuerzo de ${durationLabel}: ${bestEstimate.power}W → eFTP ${eFTP}W` : 'Sin datos suficientes',
        anchorDuration: durationLabel,
        anchorPower: bestEstimate?.power || 0,
        anchorActivity: bestEstimate?.activity || null,
        powerCurve: actualCurve,
        modeledCurve,
        model,
    };
}


// ════════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════════
// 2. VO2max CICLISMO — Garmin/Firstbeat Style (HR/Power Relationship)
//
//    Garmin uses the oxygen cost of power vs. heart rate reserve percentage.
//    1. VO2 (ml/kg/min) ≈ (Power * 10.8 / Mass) + 7
//    2. %HRR (Heart Rate Reserve) ≈ %VO2max
//    3. VO2max = VO2 / %HRR
//
//    We analyze submaximal steady-state segments to find the most consistent ratio.
// ════════════════════════════════════════════════════════════════════════════════

export function estimateCyclingVO2max(activities, settings) {
    const today = new Date();
    const d45 = new Date(today); d45.setDate(today.getDate() - 45);
    const weight = Number(settings?.weight) || 70;
    const hrRest = Number(settings?.fcReposo) || 50;
    const hrMax = Number(settings?.bike?.max || settings?.run?.max) || 190;
    const hrRange = hrMax - hrRest;

    if (hrRange <= 0) return { vo2max: 0, method: 'error', description: 'FC Max/Reposo no configuradas' };

    const candidates = [];

    activities.forEach(act => {
        const t = String(act.type).toLowerCase();
        const isBike = t.includes('bici') || t.includes('ciclismo') || t.includes('ride');
        if (!isBike || new Date(act.date) < d45) return;

        const streams = act.streams_data;
        if (streams?.watts?.data && streams?.heartrate?.data && streams?.time?.data) {
            const watts = streams.watts.data;
            const hr = streams.heartrate.data;
            const time = streams.time.data;

            // STRATEGY 1: Best efforts (Learning from Peaks) - Most reliable
            // Garmin ignores efforts under 5 mins for VO2Max to avoid anaerobic/W' inflation.
            [300, 480, 600, 900, 1200].forEach(duration => {
                const peak = getPeakPowerWithHR(watts, hr, time, duration);
                if (peak && peak.avgW > 100 && peak.avgHR > hrRest + hrRange * 0.70) {
                    const pctHRR = (peak.avgHR - hrRest) / hrRange;
                    const vo2Cost = (peak.avgW * 10.8) / weight + 7;
                    const estVO2max = vo2Cost / pctHRR;
                    if (estVO2max > 20 && estVO2max < 85) {
                        candidates.push({ 
                            vo2: estVO2max, 
                            quality: pctHRR, 
                            method: 'peak_effort',
                            actId: act.id,
                            actName: act.name,
                            description: 'Basado en mejores esfuerzos aeróbicos (5-20min)'
                        });
                    }
                }
            });

            // STRATEGY 2: Steady state windows (Firstbeat style)
            // Firstbeat requires HR to be fully stabilized. 30s is too short (HR lag produces fake high VO2max).
            // We use 180s (3 min) rolling windows to ensure true steady-state oxygen consumption.
            const windowSize = 180;
            const thresholdHR = hrRest + hrRange * 0.65; // At least 65% HRR to ensure aerobic system is taxed
            
            for (let i = 0; i < time.length - windowSize; i += windowSize / 2) {
                let sW = 0, sH = 0, c = 0, minH = 999, maxH = 0;
                for (let j = i; j < i + windowSize && j < time.length; j++) {
                    sW += watts[j]; sH += hr[j];
                    if (hr[j] < minH) minH = hr[j];
                    if (hr[j] > maxH) maxH = hr[j];
                    c++;
                }
                const avgW = sW / c; const avgH = sH / c;
                
                // Pure steady state requirement: HR must not drift more than 5 bpm over 3 minutes.
                if (avgW > 120 && avgH > thresholdHR && (maxH - minH) <= 6) {
                    const pctHRR = (avgH - hrRest) / hrRange;
                    const estVO2max = ((avgW * 10.8) / weight + 7) / pctHRR;
                    if (estVO2max > 20 && estVO2max < 85) {
                        candidates.push({ 
                            vo2: estVO2max, 
                            quality: pctHRR * 0.9,  // High quality because it's stable
                            method: 'steady_state',
                            description: 'Basado en estado estable (Garmin Firstbeat)'
                        });
                    }
                }
            }
        }
    });

    // Pick the most reliable candidate (highest Quality/pctHRR)
    if (candidates.length > 0) {
        // We pick the top 3 and average them to avoid single-point glitches, 
        // prioritizing the ones with highest HRR % (closer to max effort = more reliable)
        candidates.sort((a, b) => b.quality - a.quality);
        const top = candidates.slice(0, 5);
        const avgVo2 = top.reduce((a, b) => a + b.vo2, 0) / top.length;
        const best = top[0]; // For Metadata
        
        return {
            vo2max: Number(avgVo2.toFixed(1)),
            method: best.method,
            description: best.description,
            activity: best.actId ? { id: best.actId, name: best.actName } : null
        };
    }

    // Fallback 1: MAP 5m (No HR telemetry)
    let bestMAP = 0;
    activities.forEach(act => {
        const t = String(act.type).toLowerCase();
        if ((t.includes('bici') || t.includes('ciclismo') || t.includes('ride')) && new Date(act.date) >= d45) {
            if (act.streams_data?.watts?.data && act.streams_data?.time?.data) {
                const map5 = getPeakPower(act.streams_data.watts.data, act.streams_data.time.data, 300);
                if (map5 > bestMAP) bestMAP = map5;
            }
        }
    });

    if (bestMAP > 0) {
        return {
            vo2max: Number(((bestMAP * 12.35) / weight + 7).toFixed(1)),
            method: 'map_fallback',
            description: 'Basado en potencia máxima (sin pulso)',
            activity: null
        };
    }

    // Fallback 2: Physiological
    if (hrRest > 30 && hrMax > 120) {
        return {
            vo2max: Number((15.3 * (hrMax / hrRest) * 0.95).toFixed(1)),
            method: 'physiological_fallback',
            description: 'Estimado por frecuencia cardíaca (Uth-Sørensen)',
            activity: null
        };
    }

    return { vo2max: 0, method: 'none', description: 'Sin datos suficientes' };
}

// Helper for peak efforts with HR
function getPeakPowerWithHR(watts, hr, time, windowSecs) {
    let bestW = 0; let correspondingHR = 0;
    for (let i = 0; i < time.length; i++) {
        let sumW = 0, sumH = 0, count = 0;
        const endTime = time[i] + windowSecs;
        let j = i;
        while(j < time.length && time[j] <= endTime) {
            sumW += watts[j]; sumH += hr[j]; count++; j++;
        }
        if (count > windowSecs * 0.8) {
            const avgW = sumW / count;
            if (avgW > bestW) {
                bestW = avgW;
                correspondingHR = sumH / count;
            }
        }
    }
    return bestW > 0 ? { avgW: bestW, avgHR: correspondingHR } : null;
}


// ════════════════════════════════════════════════════════════════════════════════
// 3. VO2max CARRERA — HR/Pace Extrapolation
//
//    Similar to cycling but using ACSM running formula:
//    1. VO2 cost (ml/kg/min) ≈ (Speed_m_min * 0.2) + 3.5
//    2. VO2max = VO2 / %HRR
// ════════════════════════════════════════════════════════════════════════════════

export function estimateRunningVO2max(activities, settings) {
    const today = new Date();
    const d45 = new Date(today); d45.setDate(today.getDate() - 45);
    const hrRest = Number(settings?.fcReposo) || 50;
    const hrMax = Number(settings?.run?.max || settings?.bike?.max) || 190;
    const hrRange = hrMax - hrRest;

    if (hrRange <= 0) return { vo2max: 0, method: 'error' };

    const candidates = [];

    activities.forEach(act => {
        const t = String(act.type).toLowerCase();
        const isRun = t.includes('run') || t.includes('carrera');
        if (!isRun || new Date(act.date) < d45 || (act.duration || 0) < 10) return;

        const streams = act.streams_data;
        if (streams?.velocity_smooth?.data && streams?.heartrate?.data && streams?.time?.data) {
            const speed = streams.velocity_smooth.data;
            const hr = streams.heartrate.data;
            const time = streams.time.data;

            // STRATEGY 1: Best efforts (Learning from Peaks)
            [300, 600, 900, 1200].forEach(duration => {
                const peak = getPeakSpeedWithHR(speed, hr, time, duration);
                if (peak && peak.avgS > 2.5 && peak.avgHR > hrRest + hrRange * 0.70) {
                    const pctHRR = (peak.avgHR - hrRest) / hrRange;
                    const vo2Cost = (peak.avgS * 60 * 0.2) + 3.5;
                    const estVO2max = vo2Cost / pctHRR;
                    if (estVO2max > 25 && estVO2max < 85) {
                        candidates.push({ 
                            vo2: estVO2max, 
                            quality: pctHRR, 
                            method: 'peak_effort',
                            actId: act.id, actName: act.name,
                            description: 'Basado en mejores esfuerzos de ritmo (5-20min)'
                        });
                    }
                }
            });

            // STRATEGY 2: Steady state windows
            const windowSize = 180;
            const thresholdHR = hrRest + hrRange * 0.65;
            
            for (let i = 0; i < time.length - windowSize; i += windowSize / 2) {
                let sS = 0, sH = 0, c = 0, minH = 999, maxH = 0;
                for (let j = i; j < i + windowSize && j < time.length; j++) {
                    sS += speed[j]; sH += hr[j];
                    if (hr[j] < minH) minH = hr[j];
                    if (hr[j] > maxH) maxH = hr[j];
                    c++;
                }
                const avgS = sS / c; const avgH = sH / c;
                if (avgS > 2.2 && avgH > thresholdHR && (maxH - minH) <= 6) {
                    const pctHRR = (avgH - hrRest) / hrRange;
                    const estVO2max = ((avgS * 60 * 0.2) + 3.5) / pctHRR;
                    if (estVO2max > 25 && estVO2max < 85) {
                        candidates.push({ 
                            vo2: estVO2max, 
                            quality: pctHRR * 0.9, 
                            method: 'steady_state',
                            description: 'Basado en estado estable (Garmin Firstbeat)'
                        });
                    }
                }
            }
        } else {
            // Fallback for activities without streams: use summary data ONLY if it's a long continuous run
            const avgSpeed = act.speed_avg || 0;
            const avgHR = act.hr_avg || 0;
            if (act.duration >= 20 && avgSpeed > 2.2 && avgHR > hrRest + hrRange * 0.6) {
                const estVO2max = ((avgSpeed * 60 * 0.2) + 3.5) / ((avgHR - hrRest) / hrRange);
                if (estVO2max > 25 && estVO2max < 80) {
                    candidates.push({ vo2: estVO2max, quality: 0.4, method: 'summary', description: 'Basado en resumen de actividad' });
                }
            }
        }
    });

    if (candidates.length > 0) {
        candidates.sort((a, b) => b.quality - a.quality);
        const top = candidates.slice(0, 5);
        const avgVo2 = top.reduce((a, b) => a + b.vo2, 0) / top.length;
        const best = top[0];
        return {
            vo2max: Number(avgVo2.toFixed(1)),
            method: best.method,
            description: best.description,
            activity: best.actId ? { id: best.actId, name: best.actName } : null
        };
    }

    // FINAL FALLBACK: Uth-Sørensen
    if (hrRest > 30 && hrMax > 120) {
        return {
            vo2max: Number((15.3 * (hrMax / hrRest)).toFixed(1)),
            method: 'physiological_fallback',
            description: 'Estimado por frecuencia cardíaca (Uth-Sørensen)',
            activity: null
        };
    }

    return { vo2max: 0, method: 'none', description: 'Sin datos para estimar VO2max' };
}

// Helper for peak speed with HR
function getPeakSpeedWithHR(speed, hr, time, windowSecs) {
    let bestS = 0; let correspondingHR = 0;
    for (let i = 0; i < time.length; i++) {
        let sumS = 0, sumH = 0, count = 0;
        const endTime = time[i] + windowSecs;
        let j = i;
        while(j < time.length && time[j] <= endTime) {
            sumS += speed[j]; sumH += hr[j]; count++; j++;
        }
        if (count > windowSecs * 0.8) {
            const avgS = sumS / count;
            if (avgS > bestS) {
                bestS = avgS;
                correspondingHR = sumH / count;
            }
        }
    }
    return bestS > 0 ? { avgS: bestS, avgHR: correspondingHR } : null;
}


// ════════════════════════════════════════════════════════════════════════════════
// 4. PRONÓSTICO DE CARRERA (Daniels VDOT, derating 3%)
// ════════════════════════════════════════════════════════════════════════════════

function vo2ToSpeed(vo2) {
    const a = 0.000104, b = 0.182258, c = -(vo2 + 4.6);
    const disc = b * b - 4 * a * c;
    if (disc < 0) return 0;
    return (-b + Math.sqrt(disc)) / (2 * a);
}

function sustainableFraction(t) {
    return 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t);
}

function estimateRaceTime(vo2max, distKm) {
    if (!vo2max || vo2max <= 0) return null;
    const dM = distKm * 1000;
    let tG = dM / (vo2ToSpeed(vo2max * 0.85));
    for (let i = 0; i < 50; i++) {
        const v = vo2ToSpeed(vo2max * sustainableFraction(tG));
        if (v <= 0) return null;
        const tC = dM / v;
        if (Math.abs(tC - tG) < 0.1) { tG = tC; break; }
        tG += (tC - tG) * 0.5;
    }
    // Apply 3% derating for real-world conditions (pacing, terrain, fatigue)
    return tG * 1.03;
}

function fmtTime(m) {
    if (!m || m <= 0) return '--';
    const h = Math.floor(m / 60), mi = Math.floor(m % 60), s = Math.round((m % 1) * 60);
    return h > 0 ? `${h}:${mi.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${mi}:${s.toString().padStart(2, '0')}`;
}

function fmtPace(d) { if (!d || d >= 20) return '>20:00'; const m = Math.floor(d), s = Math.round((d - m) * 60); return `${m}:${s.toString().padStart(2, '0')}`; }

export function predictRaceTimes(vo2max) {
    if (!vo2max || vo2max <= 0) return null;
    return [
        { name: '5K', distance: 5, emoji: '🏃' },
        { name: '10K', distance: 10, emoji: '🏃‍♂️' },
        { name: 'Media', distance: 21.0975, emoji: '🏅' },
        { name: 'Maratón', distance: 42.195, emoji: '🏆' },
    ].map(r => {
        const t = estimateRaceTime(vo2max, r.distance);
        return { ...r, time: fmtTime(t), timeMinutes: t, pace: t ? fmtPace(t / r.distance) : '--' };
    });
}


// ════════════════════════════════════════════════════════════════════════════════
// 4. TRAINING EFFECT
// ════════════════════════════════════════════════════════════════════════════════
export function calculateTrainingEffect(activities, settings) {
    if (!activities || activities.length === 0) return null;
    const d7 = new Date(); d7.setDate(d7.getDate() - 7);
    const recent = activities
        .filter(a => {
            const t = String(a.type).toLowerCase();
            return (t.includes('run') || t.includes('carrera') || t.includes('bici') || t.includes('ciclismo') || t.includes('ride'))
                && new Date(a.date) >= d7 && a.duration >= 10;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!recent.length) return null;

    const act = recent[0];
    const t = String(act.type).toLowerCase();
    const isBike = t.includes('bici') || t.includes('ciclismo') || t.includes('ride');
    const maxHr = Number((isBike ? settings.bike : settings.run)?.max) || 190;

    let aerobic = 0, anaerobic = 0;
    if (act.streams_data?.heartrate?.data && act.streams_data?.time?.data) {
        const hr = act.streams_data.heartrate.data, tm = act.streams_data.time.data;
        const totalT = tm[tm.length - 1] - tm[0];
        let tLow = 0, tMid = 0, tHigh = 0;
        for (let i = 1; i < hr.length; i++) { const dt = tm[i] - tm[i - 1]; if (dt > 10) continue; const p = hr[i] / maxHr; if (p < 0.7) tLow += dt; else if (p < 0.85) tMid += dt; else tHigh += dt; }
        const df = Math.min(act.duration / 90, 1), af = totalT > 0 ? (tLow + tMid) / totalT : 0;
        aerobic = Math.min(5, df * 2.5 + af * 2.5);
        anaerobic = Math.min(5, Math.min((totalT > 0 ? tHigh / totalT : 0) * 5, 2.5) + Math.min((act.tss || 0) / 150, 2.5));
    } else {
        const p = (act.hr_avg || 0) / maxHr, df = Math.min(act.duration / 90, 1);
        aerobic = Math.min(5, df * 3 + (p < 0.85 ? p * 2 : 1));
        anaerobic = Math.min(5, p > 0.85 ? (p - 0.7) * 10 : Math.max(0, (p - 0.5) * 3));
    }

    const lbl = s => s >= 4 ? { label: 'Altamente Impactante', color: '#8b5cf6' } : s >= 3 ? { label: 'Alto Beneficio', color: '#3b82f6' } : s >= 2 ? { label: 'Beneficio Moderado', color: '#10b981' } : s >= 1 ? { label: 'Beneficio Ligero', color: '#f59e0b' } : { label: 'Sin impacto', color: '#94a3b8' };
    return {
        activity: { id: act.id, name: act.name, date: act.date, type: act.type },
        aerobic: { score: Number(aerobic.toFixed(1)), ...lbl(aerobic) },
        anaerobic: { score: Number(anaerobic.toFixed(1)), ...lbl(anaerobic) },
    };
}


// ════════════════════════════════════════════════════════════════════════════════
// 5. PERFIL DE POTENCIA
// ════════════════════════════════════════════════════════════════════════════════
export function analyzePowerProfile(ftpResult) {
    if (!ftpResult?.model || !ftpResult.powerCurve?.length) return null;
    const { eFTP, pMax, wPrime } = ftpResult.model;
    if (!eFTP || eFTP <= 0) return null;

    const sprint = pMax / eFTP;
    const anaerobic = (wPrime * 1000) / eFTP;
    const strengths = [];

    if (sprint > 7) strengths.push({ area: 'Sprint', desc: 'Excelente potencia explosiva', level: 'elite' });
    else if (sprint > 5.5) strengths.push({ area: 'Sprint', desc: 'Buena potencia explosiva', level: 'good' });
    else strengths.push({ area: 'Sprint', desc: 'Sprint por debajo de la media', level: 'weak' });

    if (anaerobic > 200) strengths.push({ area: 'Anaeróbico', desc: 'Gran capacidad anaeróbica (W\' alto)', level: 'elite' });
    else if (anaerobic > 120) strengths.push({ area: 'Anaeróbico', desc: 'Buena capacidad anaeróbica', level: 'good' });
    else strengths.push({ area: 'Anaeróbico', desc: 'Capacidad anaeróbica limitada', level: 'weak' });

    return { sprint: sprint.toFixed(1), anaerobic: Math.round(anaerobic), strengths };
}


// ════════════════════════════════════════════════════════════════════════════════
// 6. RITMOS DE ENTRENAMIENTO DANIELS (VDOT)
//    E = Easy, M = Marathon, T = Threshold, I = Interval, R = Repetition
// ════════════════════════════════════════════════════════════════════════════════
export function calculateDanielsPaces(vo2max) {
    if (!vo2max || vo2max <= 0) return null;

    // %VO2max for each training zone (Daniels Running Formula)
    const zones = [
        { name: 'E', label: 'Easy', pctVo2: 0.65, desc: 'Recuperación y base aeróbica' },
        { name: 'M', label: 'Maratón', pctVo2: 0.79, desc: 'Ritmo específico maratón' },
        { name: 'T', label: 'Umbral', pctVo2: 0.88, desc: 'Umbral de lactato (~60min race pace)' },
        { name: 'I', label: 'Intervalos', pctVo2: 0.98, desc: 'VO2max (3-5min esfuerzos)' },
        { name: 'R', label: 'Repeticiones', pctVo2: 1.05, desc: 'Velocidad y economía (<2min)' },
    ];

    return zones.map(z => {
        const effectiveVo2 = vo2max * z.pctVo2;
        const speed = vo2ToSpeed(effectiveVo2); // m/min
        const paceMinPerKm = speed > 0 ? 1000 / speed : 0;
        return {
            ...z,
            pace: fmtPace(paceMinPerKm),
            paceDecimal: paceMinPerKm,
            speedKmh: speed > 0 ? Number((speed * 60 / 1000).toFixed(1)) : 0,
        };
    });
}


// ════════════════════════════════════════════════════════════════════════════════
// 7. RITMO UMBRAL ESTIMADO (Threshold Pace desde VO2max)
// ════════════════════════════════════════════════════════════════════════════════
export function estimateThresholdPace(vo2max, settings) {
    if (!vo2max || vo2max <= 0) return null;

    // Threshold pace ≈ 88% VO2max
    const thresholdVo2 = vo2max * 0.88;
    const speed = vo2ToSpeed(thresholdVo2); // m/min
    const paceMinPerKm = speed > 0 ? 1000 / speed : 0;

    const configuredPace = settings?.run?.thresholdPace;
    let configPaceMinPerKm = null;
    if (configuredPace) {
        // Parse "M:SS" or "MM:SS" format
        const parts = String(configuredPace).split(':');
        if (parts.length === 2) configPaceMinPerKm = Number(parts[0]) + Number(parts[1]) / 60;
    }

    return {
        pace: fmtPace(paceMinPerKm),
        paceDecimal: paceMinPerKm,
        speedKmh: speed > 0 ? Number((speed * 60 / 1000).toFixed(1)) : 0,
        configuredPace: configuredPace || null,
        configPaceDecimal: configPaceMinPerKm,
        diff: configPaceMinPerKm ? Number((configPaceMinPerKm - paceMinPerKm).toFixed(2)) : null,
    };
}


// ════════════════════════════════════════════════════════════════════════════════
// 8. ZONAS DE POTENCIA (Coggan / 7 zonas desde eFTP)
// ════════════════════════════════════════════════════════════════════════════════
export function calculatePowerZones(eFTP) {
    if (!eFTP || eFTP <= 0) return null;

    return [
        { zone: 1, name: 'Recuperación activa', pctMin: 0, pctMax: 0.55, min: 0, max: Math.round(eFTP * 0.55), color: '#94a3b8' },
        { zone: 2, name: 'Resistencia', pctMin: 0.56, pctMax: 0.75, min: Math.round(eFTP * 0.56), max: Math.round(eFTP * 0.75), color: '#3b82f6' },
        { zone: 3, name: 'Tempo', pctMin: 0.76, pctMax: 0.90, min: Math.round(eFTP * 0.76), max: Math.round(eFTP * 0.90), color: '#22c55e' },
        { zone: 4, name: 'Umbral', pctMin: 0.91, pctMax: 1.05, min: Math.round(eFTP * 0.91), max: Math.round(eFTP * 1.05), color: '#f59e0b' },
        { zone: 5, name: 'VO2max', pctMin: 1.06, pctMax: 1.20, min: Math.round(eFTP * 1.06), max: Math.round(eFTP * 1.20), color: '#ef4444' },
        { zone: 6, name: 'Anaeróbica', pctMin: 1.21, pctMax: 1.50, min: Math.round(eFTP * 1.21), max: Math.round(eFTP * 1.50), color: '#a855f7' },
        { zone: 7, name: 'Neuromuscular', pctMin: 1.50, pctMax: null, min: Math.round(eFTP * 1.50), max: null, color: '#ec4899' },
    ];
}


// ════════════════════════════════════════════════════════════════════════════════
// 9. EVOLUCIÓN DEL eFTP (últimos meses)
// ════════════════════════════════════════════════════════════════════════════════
export function calculateFTPHistory(activities, settings) {
    const weight = Number(settings?.weight) || 70;
    const today = new Date();

    // Calcular eFTP para ventanas de 90 días, retrocediendo mes a mes (últimos 6 meses)
    const history = [];
    for (let monthsAgo = 0; monthsAgo <= 5; monthsAgo++) {
        const windowEnd = new Date(today);
        windowEnd.setMonth(windowEnd.getMonth() - monthsAgo);
        const windowStart = new Date(windowEnd);
        windowStart.setDate(windowStart.getDate() - 90);

        const windowActivities = activities.filter(act => {
            const t = String(act.type).toLowerCase();
            const isBike = t.includes('bici') || t.includes('ciclismo') || t.includes('ride');
            const d = new Date(act.date);
            return isBike && d >= windowStart && d <= windowEnd && act.streams_data?.watts?.data && act.streams_data?.time?.data;
        });

        if (windowActivities.length === 0) continue;

        // Build MMP for this window and estimate eFTP
        let bestEFTP = 0;
        [180, 300, 480, 600, 900, 1200, 1800].forEach(secs => {
            let bestPower = 0;
            windowActivities.forEach(act => {
                const peak = getPeakPower(act.streams_data.watts.data, act.streams_data.time.data, secs);
                if (peak > bestPower) bestPower = peak;
            });
            if (bestPower > 0) {
                const ratio = interpolateRatio(secs);
                const eFTP = bestPower / ratio;
                if (eFTP > bestEFTP) bestEFTP = eFTP;
            }
        });

        if (bestEFTP > 0) {
            const label = windowEnd.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
            history.push({
                label,
                date: windowEnd.toISOString(),
                eFTP: Math.round(bestEFTP),
                wPerKg: Number((bestEFTP / weight).toFixed(2)),
            });
        }
    }

    return history.reverse(); // Oldest first
}


// ════════════════════════════════════════════════════════════════════════════════
// 10. FITNESS SCORE GLOBAL (0-100)
//     Combina VO2max, eFTP W/kg, CTL, y normaliza a un score
// ════════════════════════════════════════════════════════════════════════════════
export function calculateFitnessScore(vo2max, eFTPwPerKg, ctl) {
    if (!vo2max && !eFTPwPerKg && !ctl) return null;

    // Normalizar cada métrica a 0-100 usando rangos de población
    // VO2max: 25 (pobre) → 70+ (élite) para hombres
    const vo2Score = vo2max ? Math.min(100, Math.max(0, (vo2max - 25) / (70 - 25) * 100)) : null;

    // eFTP W/kg: 1.5 (novato) → 5.5+ (elite pro)
    const ftpScore = eFTPwPerKg ? Math.min(100, Math.max(0, (eFTPwPerKg - 1.5) / (5.5 - 1.5) * 100)) : null;

    // CTL: 0 (sedentario) → 120+ (pro)
    const ctlScore = ctl != null ? Math.min(100, Math.max(0, ctl / 120 * 100)) : null;

    // Weighted average (VO2 más importante, luego FTP, luego CTL)
    const scores = [];
    if (vo2Score !== null) scores.push({ value: vo2Score, weight: 0.40 });
    if (ftpScore !== null) scores.push({ value: ftpScore, weight: 0.35 });
    if (ctlScore !== null) scores.push({ value: ctlScore, weight: 0.25 });

    if (scores.length === 0) return null;

    const totalWeight = scores.reduce((s, x) => s + x.weight, 0);
    const score = Math.round(scores.reduce((s, x) => s + x.value * (x.weight / totalWeight), 0));

    const getLevel = (s) => {
        if (s >= 85) return { label: 'Élite', color: '#8b5cf6', emoji: '🏆' };
        if (s >= 70) return { label: 'Excelente', color: '#3b82f6', emoji: '💪' };
        if (s >= 55) return { label: 'Bueno', color: '#22c55e', emoji: '✅' };
        if (s >= 40) return { label: 'Medio', color: '#f59e0b', emoji: '📊' };
        if (s >= 25) return { label: 'En desarrollo', color: '#f97316', emoji: '🔧' };
        return { label: 'Principiante', color: '#94a3b8', emoji: '🌱' };
    };

    return {
        score,
        ...getLevel(score),
        breakdown: {
            vo2: vo2Score !== null ? Math.round(vo2Score) : null,
            ftp: ftpScore !== null ? Math.round(ftpScore) : null,
            ctl: ctlScore !== null ? Math.round(ctlScore) : null,
        },
    };
}


// ════════════════════════════════════════════════════════════════════════════════
// 11. DISTRIBUCIÓN DE INTENSIDAD (últimos 90 días)
//     Clasifica el tiempo en zonas: Z1-Z2 (easy), Z3, Z4, Z5+ (hard)
//     Indica si el patrón es polarizado, piramidal, o threshold-heavy
// ════════════════════════════════════════════════════════════════════════════════
export function analyzeIntensityDistribution(activities, settings) {
    const today = new Date();
    const d90 = new Date(today); d90.setDate(today.getDate() - 90);

    let totalTime = 0;
    let timeZ12 = 0, timeZ3 = 0, timeZ4 = 0, timeZ5 = 0;

    activities.forEach(act => {
        if (new Date(act.date) < d90 || act.duration < 10) return;
        const t = String(act.type).toLowerCase();
        const isCardio = t.includes('run') || t.includes('carrera') || t.includes('bici') || t.includes('ciclismo') || t.includes('ride');
        if (!isCardio) return;

        const isBike = t.includes('bici') || t.includes('ciclismo') || t.includes('ride');
        const maxHr = Number((isBike ? settings.bike : settings.run)?.max) || 190;

        if (act.streams_data?.heartrate?.data && act.streams_data?.time?.data) {
            const hr = act.streams_data.heartrate.data;
            const tm = act.streams_data.time.data;

            for (let i = 1; i < hr.length; i++) {
                const dt = tm[i] - tm[i - 1];
                if (dt > 10 || dt <= 0) continue;
                totalTime += dt;
                const pct = hr[i] / maxHr;
                if (pct < 0.72) timeZ12 += dt;
                else if (pct < 0.82) timeZ3 += dt;
                else if (pct < 0.90) timeZ4 += dt;
                else timeZ5 += dt;
            }
        } else if (act.hr_avg) {
            // Fallback: use avg HR to approximate
            const durSecs = act.duration * 60;
            totalTime += durSecs;
            const pct = act.hr_avg / maxHr;
            if (pct < 0.72) timeZ12 += durSecs;
            else if (pct < 0.82) timeZ3 += durSecs;
            else if (pct < 0.90) timeZ4 += durSecs;
            else timeZ5 += durSecs;
        }
    });

    if (totalTime === 0) return null;

    const pZ12 = (timeZ12 / totalTime) * 100;
    const pZ3 = (timeZ3 / totalTime) * 100;
    const pZ4 = (timeZ4 / totalTime) * 100;
    const pZ5 = (timeZ5 / totalTime) * 100;

    // Determine training pattern
    let pattern, patternDesc, patternColor;
    if (pZ12 >= 75 && (pZ4 + pZ5) >= 10) {
        pattern = 'Polarizado';
        patternDesc = 'Mucho volumen fácil + sesiones intensas. Distribución óptima.';
        patternColor = '#22c55e';
    } else if (pZ12 >= 60 && pZ3 >= 15 && pZ3 > (pZ4 + pZ5)) {
        pattern = 'Piramidal';
        patternDesc = 'Base amplia con intensidad decreciente por zona. Buena distribución.';
        patternColor = '#3b82f6';
    } else if (pZ3 + pZ4 >= 40) {
        pattern = 'Threshold-heavy';
        patternDesc = 'Demasiado tiempo en zona media. Riesgo de estancamiento.';
        patternColor = '#f59e0b';
    } else {
        pattern = 'Mixto';
        patternDesc = 'Distribución sin patrón definido.';
        patternColor = '#94a3b8';
    }

    return {
        zones: [
            { name: 'Z1-Z2', label: 'Fácil', pct: Number(pZ12.toFixed(1)), hours: Number((timeZ12 / 3600).toFixed(1)), color: '#3b82f6' },
            { name: 'Z3', label: 'Tempo', pct: Number(pZ3.toFixed(1)), hours: Number((timeZ3 / 3600).toFixed(1)), color: '#22c55e' },
            { name: 'Z4', label: 'Umbral', pct: Number(pZ4.toFixed(1)), hours: Number((timeZ4 / 3600).toFixed(1)), color: '#f59e0b' },
            { name: 'Z5+', label: 'Alta', pct: Number(pZ5.toFixed(1)), hours: Number((timeZ5 / 3600).toFixed(1)), color: '#ef4444' },
        ],
        totalHours: Number((totalTime / 3600).toFixed(1)),
        pattern,
        patternDesc,
        patternColor,
    };
}
