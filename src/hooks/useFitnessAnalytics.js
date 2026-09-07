import { useMemo, useState, useEffect } from 'react';
import {
    estimateFTP, estimateCyclingVO2max, estimateRunningVO2max,
    analyzePowerProfile, getPowerProfileBenchmarks,
    getTrainingBalance, getTrainingStatus, getHRVAnalysis, predictRaceTimes
} from '../utils/fitnessStatsEngine';
import { useWellnessInfo } from './useWellnessInfo';

export const formatInterval = (secs) => {
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${secs / 60}m`;
    return `${secs / 3600}h`;
};

export const formatPace = (decimalMinutes) => {
    if (!decimalMinutes || decimalMinutes >= 20) return '>20:00';
    const mins = Math.floor(decimalMinutes);
    const secs = Math.round((decimalMinutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff)).toISOString().split('T')[0];
};

export const TIME_INTERVALS = [1, 5, 15, 30, 60, 180, 300, 600, 1200, 2400, 3600, 7200];
export const ZONE_COLORS = ['#94a3b8', '#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7'];
export const ZONE_LABELS = ['Z1 Recuperación', 'Z2 Aeróbico', 'Z3 Tempo', 'Z4 SubUmbral', 'Z5 SupraUmbral', 'Z6 VO2Max', 'Z7 Anaeróbico'];

export const useFitnessAnalytics = (activities, settings, options = {}) => {
    const {
        loadHistoricalStreams,
        isLoadingHistoricalStreams = false,
        hasLoadedHistoricalStreams = false
    } = options;

    const [vo2Sport, setVo2Sport] = useState('run');
    const [powerUnit, setPowerUnit] = useState('w'); // 'w' or 'wkg'
    const [selectedDurs, setSelectedDurs] = useState(new Set([5, 15, 30, 60, 300, 'eftp']));
    const [showPowerConfig, setShowPowerConfig] = useState(false);
    const [balanceDays, setBalanceDays] = useState(30);

    const [curveType, setCurveType] = useState('power');
    const [curveSport, setCurveSport] = useState('bike');
    const [mmpTimeframe, setMmpTimeframe] = useState('90d');
    const [intensityTimeframe, setIntensityTimeframe] = useState('28d');
    const [powerProfileTimeframe, setPowerProfileTimeframe] = useState('90d');
    const [peaksViewMode, setPeaksViewMode] = useState('period'); // 'period' | 'alltime'

    // Carga automática de telemetría histórica bajo demanda al seleccionar rangos amplios
    useEffect(() => {
        const needsHistorical = mmpTimeframe === '1y' || mmpTimeframe === 'all' ||
            powerProfileTimeframe === '1y' || powerProfileTimeframe === 'all' ||
            peaksViewMode === 'alltime';

        if (needsHistorical && loadHistoricalStreams && !hasLoadedHistoricalStreams && !isLoadingHistoricalStreams) {
            loadHistoricalStreams();
        }
    }, [mmpTimeframe, powerProfileTimeframe, peaksViewMode, loadHistoricalStreams, hasLoadedHistoricalStreams, isLoadingHistoricalStreams]);

    // Estadísticas de cobertura de telemetría
    const telemetryStats = useMemo(() => {
        if (!activities || activities.length === 0) {
            return { total: 0, withStreams: 0, percentage: 0 };
        }
        const total = activities.length;
        const withStreams = activities.filter(a => !!(a.streams_data?.time?.data || a.streams_data?.time)).length;
        const percentage = total > 0 ? Math.round((withStreams / total) * 100) : 0;
        return { total, withStreams, percentage };
    }, [activities]);

    // Call the wellness hook for real Garmin data
    const { wellnessMetrics } = useWellnessInfo(activities, settings);

    const stats = useMemo(() => {
        if (!activities || activities.length === 0) {
            return {
                vo2: { run: { vo2max: 0 }, bike: { vo2max: 0 } },
                ftp: {}, profile: null, powerProfile: null, balance: null,
                trainingStatus: null, hrv: null, racePredictions: null
            };
        }

        const runVo2Result = estimateRunningVO2max(activities, settings);
        const bikeVo2Result = estimateCyclingVO2max(activities, settings);

        const ftp = estimateFTP(activities, settings);
        const profile = analyzePowerProfile(ftp);

        const ppDays = powerProfileTimeframe === '90d' ? 90 : (powerProfileTimeframe === '1y' ? 365 : null);
        const powerProfile = getPowerProfileBenchmarks(activities, settings, ftp.eFTP, { days: ppDays });

        const balance = getTrainingBalance(activities, settings, balanceDays);
        const trainingStatus = getTrainingStatus(activities);

        const hrv = getHRVAnalysis(activities, wellnessMetrics);
        const racePredictions = predictRaceTimes(runVo2Result.vo2max, activities);

        return {
            vo2: { run: runVo2Result, bike: bikeVo2Result },
            ftp, profile, powerProfile, balance, trainingStatus, hrv, racePredictions
        };
    }, [activities, settings, balanceDays, wellnessMetrics, powerProfileTimeframe]);

    const currentVo2Obj = vo2Sport === 'run' ? stats.vo2.run : stats.vo2.bike;
    const currentVo2 = currentVo2Obj.vo2max;
    const vo2Level = currentVo2 <= 0 ? { l: '--', c: '#94a3b8' } :
        currentVo2 < 35 ? { l: 'Pobre', c: '#ef4444' } :
        currentVo2 < 42 ? { l: 'Regular', c: '#f97316' } :
        currentVo2 < 50 ? { l: 'Bueno', c: '#22c55e' } :
        currentVo2 < 60 ? { l: 'Excelente', c: '#3b82f6' } :
        { l: 'Superior', c: '#8b5cf6' };

    // ── ZONA 3 y ZONA 4 ANALYTICS ──
    const analytics = useMemo(() => {
        if (!activities || activities.length === 0) {
            return {
                zonesChart: [], focusChart: [], weeklyChart: [],
                curves: { all: { spd: [], hr: [], pwr: [] }, bike: { spd: [], hr: [], pwr: [] }, run: { spd: [], hr: [], pwr: [] } },
                allTimeCurves: { all: { spd: [], hr: [], pwr: [] }, bike: { spd: [], hr: [], pwr: [] }, run: { spd: [], hr: [], pwr: [] } },
                efData: { bike: [], run: [] },
                periodPeaks: { all: { hr: {}, spd: {}, pwr: {} }, bike: { hr: {}, spd: {}, pwr: {} }, run: { hr: {}, spd: {}, pwr: {} } },
                allTimePeaks: { all: { hr: {}, spd: {}, pwr: {} }, bike: { hr: {}, spd: {}, pwr: {} }, run: { hr: {}, spd: {}, pwr: {} } },
                peaksRecord: { all: { hr: {}, spd: {}, pwr: {} }, bike: { hr: {}, spd: {}, pwr: {} }, run: { hr: {}, spd: {}, pwr: {} } }
            };
        }

        const today = new Date();
        const date90DaysAgo = new Date(today);
        date90DaysAgo.setDate(today.getDate() - 90);

        let dateMmp = null;
        if (mmpTimeframe === '90d') {
            dateMmp = new Date(today);
            dateMmp.setDate(today.getDate() - 90);
        } else if (mmpTimeframe === '1y') {
            dateMmp = new Date(today);
            dateMmp.setDate(today.getDate() - 365);
        }

        const dateIntensity = new Date(today);
        if (intensityTimeframe === '28d') dateIntensity.setDate(today.getDate() - 28);
        else if (intensityTimeframe === '90d') dateIntensity.setDate(today.getDate() - 90);
        else if (intensityTimeframe === '1y') dateIntensity.setDate(today.getDate() - 365);
        else dateIntensity.setFullYear(2000);

        const zonesData = [0, 0, 0, 0, 0, 0, 0];
        const sortedActivities = [...activities].sort((a, b) => new Date(a.date) - new Date(b.date));
        const weeklyMap = new Map();

        const getPeakByTime = (data, timeData, windowSecs) => {
            if (!data || !timeData || data.length === 0) return 0;
            let maxAvg = 0;
            let startIdx = 0;
            let currentSum = 0;
            let currentCount = 0;
            for (let endIdx = 0; endIdx < timeData.length; endIdx++) {
                currentSum += data[endIdx];
                currentCount++;
                while (timeData[endIdx] - timeData[startIdx] > windowSecs) {
                    currentSum -= data[startIdx];
                    currentCount--;
                    startIdx++;
                }
                if (timeData[endIdx] - timeData[startIdx] >= windowSecs * 0.95) {
                    const avg = currentSum / currentCount;
                    if (avg > maxAvg) maxAvg = avg;
                }
            }
            return maxAvg;
        };

        const initPeaks = () => {
            const p = {};
            TIME_INTERVALS.forEach(i => {
                p[i] = { value: 0, actId: null, actName: '', actDate: '' };
            });
            return p;
        };

        const periodPeaks = {
            all: { hr: initPeaks(), spd: initPeaks(), pwr: initPeaks() },
            bike: { hr: initPeaks(), spd: initPeaks(), pwr: initPeaks() },
            run: { hr: initPeaks(), spd: initPeaks(), pwr: initPeaks() }
        };

        const allTimePeaks = {
            all: { hr: initPeaks(), spd: initPeaks(), pwr: initPeaks() },
            bike: { hr: initPeaks(), spd: initPeaks(), pwr: initPeaks() },
            run: { hr: initPeaks(), spd: initPeaks(), pwr: initPeaks() }
        };

        const efData = { bike: [], run: [] };

        const updatePeak = (targetPeaks, sport, metric, window, value, act) => {
            if (value > targetPeaks[sport][metric][window].value) {
                targetPeaks[sport][metric][window] = { value, actId: act.id, actName: act.name, actDate: act.date };
            }
        };

        sortedActivities.forEach(act => {
            const actDate = new Date(act.date);
            const actTss = act.tss || 0;

            if (actDate >= date90DaysAgo) {
                const weekStart = getMonday(act.date);
                if (!weeklyMap.has(weekStart)) weeklyMap.set(weekStart, { week: weekStart, tss: 0, hours: 0 });
                const wData = weeklyMap.get(weekStart);
                wData.tss += actTss;
                wData.hours += (act.duration || 0) / 60;
            }

            const typeLower = String(act.type).toLowerCase();
            const isBike = typeLower.includes('bici') || typeLower.includes('ciclismo') || typeLower.includes('ride');
            const isRun = typeLower.includes('run') || typeLower.includes('carrera');

            if (actDate >= date90DaysAgo && (isBike || isRun) && act.hr_avg > 80 && act.duration >= 20) {
                const speedMs = act.speed_avg || 0;
                const baseDateLabel = actDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                if (isBike && act.watts_avg > 40) {
                    efData.bike.push({
                        date: act.date,
                        dateLabel: baseDateLabel,
                        ef: Number((act.watts_avg / act.hr_avg).toFixed(2)),
                        name: act.name,
                        id: act.id,
                        hr: Math.round(act.hr_avg),
                        watts: Math.round(act.watts_avg)
                    });
                }
                if (isRun && speedMs > 2) {
                    efData.run.push({
                        date: act.date,
                        dateLabel: baseDateLabel,
                        ef: Number(((speedMs * 60) / act.hr_avg).toFixed(2)),
                        name: act.name,
                        id: act.id,
                        hr: Math.round(act.hr_avg),
                        pace: formatPace((16.6666667 / speedMs))
                    });
                }
            }

            if (act.streams_data?.time) {
                const timeData = act.streams_data.time.data;
                const inPeriod = !dateMmp || actDate >= dateMmp;

                if (act.streams_data.heartrate) {
                    const hrData = act.streams_data.heartrate.data;
                    if (actDate >= dateIntensity) {
                        const userZones = isBike ? settings.bike.zones : settings.run.zones;
                        for (let i = 1; i < hrData.length; i++) {
                            const hr = hrData[i];
                            const dt = timeData[i] - timeData[i - 1];
                            const zIndex = userZones.findIndex(z => hr >= z.min && hr <= z.max);
                            if (zIndex !== -1 && zIndex < 7) zonesData[zIndex] += dt;
                            else if (hr > userZones[userZones.length - 1].max) zonesData[6] += dt;
                        }
                    }

                    TIME_INTERVALS.forEach(w => {
                        const peak = getPeakByTime(hrData, timeData, w);
                        if (peak > 0) {
                            // Récords absolutos (histórico de siempre)
                            updatePeak(allTimePeaks, 'all', 'hr', w, peak, act);
                            if (isBike) updatePeak(allTimePeaks, 'bike', 'hr', w, peak, act);
                            if (isRun) updatePeak(allTimePeaks, 'run', 'hr', w, peak, act);

                            // Récords del periodo seleccionado
                            if (inPeriod) {
                                updatePeak(periodPeaks, 'all', 'hr', w, peak, act);
                                if (isBike) updatePeak(periodPeaks, 'bike', 'hr', w, peak, act);
                                if (isRun) updatePeak(periodPeaks, 'run', 'hr', w, peak, act);
                            }
                        }
                    });
                }

                if (act.streams_data.velocity_smooth) {
                    const spdData = act.streams_data.velocity_smooth.data;
                    TIME_INTERVALS.forEach(w => {
                        const peak = getPeakByTime(spdData, timeData, w);
                        if (peak > 0) {
                            // Récords absolutos
                            updatePeak(allTimePeaks, 'all', 'spd', w, peak, act);
                            if (isBike) updatePeak(allTimePeaks, 'bike', 'spd', w, peak, act);
                            if (isRun) updatePeak(allTimePeaks, 'run', 'spd', w, peak, act);

                            // Récords del periodo
                            if (inPeriod) {
                                updatePeak(periodPeaks, 'all', 'spd', w, peak, act);
                                if (isBike) updatePeak(periodPeaks, 'bike', 'spd', w, peak, act);
                                if (isRun) updatePeak(periodPeaks, 'run', 'spd', w, peak, act);
                            }
                        }
                    });
                }

                if (act.streams_data.watts) {
                    const pwrData = act.streams_data.watts.data;
                    TIME_INTERVALS.forEach(w => {
                        const peak = getPeakByTime(pwrData, timeData, w);
                        if (peak > 0) {
                            // Récords absolutos
                            updatePeak(allTimePeaks, 'all', 'pwr', w, peak, act);
                            if (isBike) updatePeak(allTimePeaks, 'bike', 'pwr', w, peak, act);
                            if (isRun) updatePeak(allTimePeaks, 'run', 'pwr', w, peak, act);

                            // Récords del periodo
                            if (inPeriod) {
                                updatePeak(periodPeaks, 'all', 'pwr', w, peak, act);
                                if (isBike) updatePeak(periodPeaks, 'bike', 'pwr', w, peak, act);
                                if (isRun) updatePeak(periodPeaks, 'run', 'pwr', w, peak, act);
                            }
                        }
                    });
                }
            }
        });

        const weeklyChart = Array.from(weeklyMap.values()).map(w => ({
            dateLabel: new Date(w.week).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
            tss: Math.round(w.tss),
            hours: Number(w.hours.toFixed(1))
        }));
        const zonesChart = zonesData.map((secs, i) => ({
            name: ZONE_LABELS[i],
            hours: Number((secs / 3600).toFixed(1)),
            fill: ZONE_COLORS[i]
        }));
        const totalFocus = zonesData.reduce((a, b) => a + b, 0);
        const focusChart = totalFocus > 0 ? [
            { name: 'Aeróbico', value: Math.round(((zonesData[0] + zonesData[1]) / totalFocus) * 100), color: '#3b82f6' },
            { name: 'Tempo/Umbral', value: Math.round(((zonesData[2] + zonesData[3]) / totalFocus) * 100), color: '#eab308' },
            { name: 'Anaeróbico', value: Math.round(((zonesData[4] + zonesData[5] + zonesData[6]) / totalFocus) * 100), color: '#ef4444' }
        ] : [];

        // Curvas para el periodo seleccionado
        const curves = { all: { spd: [], hr: [], pwr: [] }, bike: { spd: [], hr: [], pwr: [] }, run: { spd: [], hr: [], pwr: [] } };
        ['all', 'bike', 'run'].forEach(sport => {
            curves[sport].spd = TIME_INTERVALS.map(i => {
                const pk = periodPeaks[sport].spd[i];
                if (sport === 'run' && pk.value > 0.1) {
                    return { name: formatInterval(i), value: Number((16.6666667 / pk.value).toFixed(2)), rawSpeed: pk.value, actId: pk.actId, actName: pk.actName, actDate: pk.actDate };
                }
                return { name: formatInterval(i), value: Number((pk.value * 3.6).toFixed(1)), rawSpeed: pk.value, actId: pk.actId, actName: pk.actName, actDate: pk.actDate };
            }).filter(d => sport === 'run' ? (d.value > 0 && d.value < 20) : d.value > 0);

            curves[sport].hr = TIME_INTERVALS.map(i => {
                const pk = periodPeaks[sport].hr[i];
                return { name: formatInterval(i), value: Math.round(pk.value), actId: pk.actId, actName: pk.actName, actDate: pk.actDate };
            }).filter(d => d.value > 0);

            curves[sport].pwr = TIME_INTERVALS.map(i => {
                const pk = periodPeaks[sport].pwr[i];
                return { name: formatInterval(i), value: Math.round(pk.value), actId: pk.actId, actName: pk.actName, actDate: pk.actDate };
            }).filter(d => d.value > 0);
        });

        // Curvas históricas absolutas
        const allTimeCurves = { all: { spd: [], hr: [], pwr: [] }, bike: { spd: [], hr: [], pwr: [] }, run: { spd: [], hr: [], pwr: [] } };
        ['all', 'bike', 'run'].forEach(sport => {
            allTimeCurves[sport].spd = TIME_INTERVALS.map(i => {
                const pk = allTimePeaks[sport].spd[i];
                if (sport === 'run' && pk.value > 0.1) {
                    return { name: formatInterval(i), value: Number((16.6666667 / pk.value).toFixed(2)), rawSpeed: pk.value, actId: pk.actId, actName: pk.actName, actDate: pk.actDate };
                }
                return { name: formatInterval(i), value: Number((pk.value * 3.6).toFixed(1)), rawSpeed: pk.value, actId: pk.actId, actName: pk.actName, actDate: pk.actDate };
            }).filter(d => sport === 'run' ? (d.value > 0 && d.value < 20) : d.value > 0);

            allTimeCurves[sport].hr = TIME_INTERVALS.map(i => {
                const pk = allTimePeaks[sport].hr[i];
                return { name: formatInterval(i), value: Math.round(pk.value), actId: pk.actId, actName: pk.actName, actDate: pk.actDate };
            }).filter(d => d.value > 0);

            allTimeCurves[sport].pwr = TIME_INTERVALS.map(i => {
                const pk = allTimePeaks[sport].pwr[i];
                return { name: formatInterval(i), value: Math.round(pk.value), actId: pk.actId, actName: pk.actName, actDate: pk.actDate };
            }).filter(d => d.value > 0);
        });

        return {
            zonesChart,
            focusChart,
            weeklyChart,
            curves,
            allTimeCurves,
            efData,
            periodPeaks,
            allTimePeaks,
            peaksRecord: peaksViewMode === 'alltime' ? allTimePeaks : periodPeaks
        };
    }, [activities, settings, mmpTimeframe, intensityTimeframe, peaksViewMode]);

    const currentCurve = useMemo(() => {
        if (!analytics?.curves) return [];
        if (curveType === 'power') return analytics.curves[curveSport]?.pwr || [];
        if (curveType === 'speed') return analytics.curves[curveSport]?.spd || [];
        return analytics.curves[curveSport]?.hr || [];
    }, [analytics, curveSport, curveType]);

    const isPace = curveSport === 'run' && curveType === 'speed';
    const curveColor = curveType === 'hr' ? '#ef4444' : (curveType === 'power' ? '#fbbf24' : (isPace ? '#ea580c' : '#2563eb'));
    const curveUnit = curveType === 'power' ? 'w' : (isPace ? '/km' : (curveType === 'speed' ? 'km/h' : 'ppm'));

    // Merge actual + modeled power curve for chart
    const curveChartData = useMemo(() => {
        if (!stats.ftp.powerCurve?.length) return [];
        const durations = [...new Set([...stats.ftp.powerCurve.map(p => p.secs), ...stats.ftp.modeledCurve.map(p => p.secs)])].sort((a, b) => a - b);
        return durations.map(s => {
            const actual = stats.ftp.powerCurve.find(p => p.secs === s);
            const modeled = stats.ftp.modeledCurve.find(p => p.secs === s);
            return { name: formatInterval(s), secs: s, actual: actual?.power || null, modeled: modeled?.power || null };
        });
    }, [stats.ftp]);

    // Pre-process Power Profile Chart Data based on selection
    const ppChartData = useMemo(() => {
        if (!stats.powerProfile) return [];
        const { userPoints, references, weight, eFTP } = stats.powerProfile;

        const data = userPoints.filter(p => selectedDurs.has(p.duration)).map(p => {
            const factor = powerUnit === 'w' ? weight : 1;
            const entry = {
                name: p.label,
                duration: p.duration,
                'Usuario': powerUnit === 'w' ? p.power : p.wKg
            };

            references.forEach(ref => {
                const key = p.duration === 5 ? '5s' : p.duration === 15 ? '15s' : p.duration === 30 ? '30s' :
                    p.duration === 60 ? '60s' : formatInterval(p.duration);
                entry[ref.category] = Number((ref[key] * factor).toFixed(powerUnit === 'w' ? 0 : 2));
            });
            return entry;
        });

        if (selectedDurs.has('eftp')) {
            const entry = { name: 'eFTP', duration: 3601 };
            const factor = powerUnit === 'w' ? weight : 1;
            entry['Usuario'] = powerUnit === 'w' ? eFTP : Number((eFTP / weight).toFixed(2));

            references.forEach(ref => {
                entry[ref.category] = Number((ref['60m'] * factor).toFixed(powerUnit === 'w' ? 0 : 2));
            });
            data.push(entry);
        }

        return data.sort((a, b) => a.duration - b.duration);
    }, [stats.powerProfile, powerUnit, selectedDurs]);

    const toggleDur = (d) => {
        const next = new Set(selectedDurs);
        if (next.has(d)) next.delete(d);
        else next.add(d);
        setSelectedDurs(next);
    };

    const configFTP = Number(settings?.bike?.ftp) || 0;
    const ftpDiff = stats.ftp.eFTP && configFTP ? stats.ftp.eFTP - configFTP : null;

    return {
        // UI states & setters
        vo2Sport, setVo2Sport,
        powerUnit, setPowerUnit,
        selectedDurs, toggleDur,
        showPowerConfig, setShowPowerConfig,
        balanceDays, setBalanceDays,
        curveType, setCurveType,
        curveSport, setCurveSport,
        mmpTimeframe, setMmpTimeframe,
        intensityTimeframe, setIntensityTimeframe,
        powerProfileTimeframe, setPowerProfileTimeframe,
        peaksViewMode, setPeaksViewMode,

        // Telemetry & historical loading
        telemetryStats,
        isLoadingHistoricalStreams,
        hasLoadedHistoricalStreams,

        // Computed stats & engine results
        stats,
        currentVo2,
        vo2Level,
        analytics,
        currentCurve,
        isPace,
        curveColor,
        curveUnit,
        curveChartData,
        ppChartData,
        configFTP,
        ftpDiff
    };
};
