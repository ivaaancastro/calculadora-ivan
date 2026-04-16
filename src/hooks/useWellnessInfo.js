import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';

// ─── Direct Supabase read (no hook import to avoid circular dependencies) ────
async function fetchWellnessDB(days = 180) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return [];

        const since = new Date();
        since.setDate(since.getDate() - days);
        const sinceStr = since.toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('wellness_data')
            .select('*')
            .eq('user_id', session.user.id)
            .gte('date', sinceStr)
            .order('date', { ascending: true });

        if (error) {
            // 42P01 = table not found (migration not run yet) — silent fallback
            if (error.code === '42P01' || error.message?.includes('does not exist')) {
                console.info('[wellness] wellness_data table not created yet — using simulator');
                return [];
            }
            console.error('[wellness] fetchWellnessDB:', error);
            return [];
        }
        return data || [];
    } catch (e) {
        console.error('[wellness] fetchWellnessDB exception:', e);
        return [];
    }
}

export const useWellnessInfo = (activities, settings, chartData) => {
    const [wellnessData, setWellnessData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Reconstruct daily TSS for the simulator & effort score
    const dailyTSS = useMemo(() => {
        const map = new Map();
        if (!activities) return map;
        activities.forEach(act => {
            const dateKey = new Date(act.date).toISOString().split('T')[0];
            map.set(dateKey, (map.get(dateKey) || 0) + (act.tss || 0));
        });
        return map;
    }, [activities]);

    const currentTsb = useMemo(() => {
        if (!chartData || chartData.length === 0) return 0;
        const last = chartData[chartData.length - 1];
        return last?.tsb ?? last?.tcb ?? 0;
    }, [chartData]);

    // ─── DATA FETCHING ──────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        const fetchWellness = async () => {
            setLoading(true);
            setError(null);

            try {
                // ── PRIORITY 1: Supabase wellness_data (synced from Intervals.icu) ──
                const dbRows = await fetchWellnessDB(180);

                if (dbRows && dbRows.length > 0) {
                    if (cancelled) return;

                    const realData = dbRows.map(d => {
                        const dateObj = new Date(d.date + 'T00:00:00');
                        const sleepHours = d.sleep_secs
                            ? Number((d.sleep_secs / 3600).toFixed(1))
                            : null;

                        return {
                            date: d.date,
                            dateLabel: !isNaN(dateObj)
                                ? dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                                : d.date,
                            hrv: d.hrv ?? null,
                            hrvSdnn: d.hrv_sdnn ?? null,
                            sleep: sleepHours,
                            sleepScore: d.sleep_score ?? null,
                            rhr: d.resting_hr ?? null,
                            weight: d.weight ?? null,
                            bodyFat: d.body_fat ?? null,
                            vo2max: d.vo2max ?? null,
                            readiness: d.readiness ?? null,    // Intervals.icu native readiness score
                            ctl: d.ctl ?? null,                // Intervals.icu native CTL
                            atl: d.atl ?? null,                // Intervals.icu native ATL
                            steps: d.steps ?? null,
                            spo2: d.spo2 ?? null,
                            respiration: d.respiration ?? null,
                            stress: d.stress ?? null,
                            soreness: d.soreness ?? null,
                            isSimulated: false,
                            source: 'intervals',
                        };
                    });

                    setWellnessData(realData);
                    setLoading(false);
                    return;
                }

                // ── PRIORITY 2: Direct Intervals.icu API (if CORS allows in dev) ──
                if (settings?.intervalsId && settings?.intervalsKey) {
                    const end = new Date().toISOString().split('T')[0];
                    const startIcu = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    const authString = 'Basic ' + btoa(`API_KEY:${settings.intervalsKey}`);

                    try {
                        const res = await fetch(
                            `https://intervals.icu/api/v1/athlete/${settings.intervalsId}/wellness?oldest=${startIcu}&newest=${end}`,
                            { headers: { Authorization: authString, Accept: 'application/json' } }
                        );

                        if (res.ok) {
                            const data = await res.json();
                            if (cancelled) return;

                            if (Array.isArray(data) && data.length > 0) {
                                const realData = data.map(d => {
                                    const dateObj = new Date((d.id || d.date) + 'T00:00:00');
                                    const sleepHours = d.sleepSecs
                                        ? Number((d.sleepSecs / 3600).toFixed(1))
                                        : (d.sleep ?? null);

                                    return {
                                        date: d.id || d.date,
                                        dateLabel: !isNaN(dateObj)
                                            ? dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                                            : (d.id || d.date),
                                        hrv: d.hrv ?? null,
                                        hrvSdnn: d.hrvSDNN ?? null,
                                        sleep: sleepHours,
                                        sleepScore: d.sleepScore ?? null,
                                        rhr: d.restingHR ?? null,
                                        weight: d.weight ?? null,
                                        bodyFat: d.bodyFat ?? null,
                                        vo2max: d.vo2max ?? null,
                                        readiness: d.readiness ?? null,
                                        ctl: d.ctl ?? null,
                                        atl: d.atl ?? null,
                                        steps: d.steps ?? null,
                                        spo2: d.spO2 ?? null,
                                        respiration: d.respiration ?? null,
                                        stress: null,
                                        soreness: d.soreness ?? null,
                                        isSimulated: false,
                                        source: 'intervals_direct',
                                    };
                                }).sort((a, b) => new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00'));

                                setWellnessData(realData);
                                setLoading(false);
                                return;
                            }
                        }
                    } catch (corsError) {
                        // CORS blocked in production — will use simulator
                        console.warn('Direct Intervals fetch blocked (CORS), falling back to simulator. Use "Sync Intervals" button to load data.');
                    }
                }

                // ── PRIORITY 3: Simulator (fallback when no real data) ──────────────
                if (cancelled) return;
                const simData = buildSimulatedWellness(settings, dailyTSS);
                setWellnessData(simData);

            } catch (err) {
                console.error('Fetch Wellness Error:', err);
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchWellness();
        return () => { cancelled = true; };
    }, [settings, dailyTSS]);

    // ─── SIMULATOR ─────────────────────────────────────────────────────────────
    function buildSimulatedWellness(settings, dailyTSS) {
        const simData = [];
        const baseHrv = 65;
        const baseSleep = 7.5;
        const baseRhr = settings?.fcReposo || 50;
        const baseWeight = settings?.weight || 70;
        const today = new Date();

        for (let i = 180; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const prevDate = new Date(d);
            prevDate.setDate(d.getDate() - 1);
            const yesterdayTSS = dailyTSS.get(prevDate.toISOString().split('T')[0]) || 0;

            const fatigueImpact = Math.min(yesterdayTSS / 150, 1);
            const randomHrvNoise = (Math.random() * 10) - 5;
            const randomSleepNoise = (Math.random() * 1.5) - 0.75;
            const dateObj = new Date(dateStr + 'T00:00:00');

            const simSleep = Math.max(4, Number((baseSleep - (fatigueImpact * 1.5) + randomSleepNoise).toFixed(1)));
            const simSleepScore = Math.min(100, Math.round((simSleep / 8) * 100));
            const simStress = Math.min(100, Math.max(0, Math.round(20 + (fatigueImpact * 50) + (Math.random() * 20 - 10))));
            const simSoreness = Math.round(fatigueImpact * 3);

            simData.push({
                date: dateStr,
                dateLabel: !isNaN(dateObj)
                    ? dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                    : dateStr,
                hrv: Math.max(20, Math.round(baseHrv - (baseHrv * 0.2 * Math.max(0, fatigueImpact)) + randomHrvNoise)),
                hrvSdnn: null,
                sleep: simSleep,
                sleepScore: simSleepScore,
                rhr: Math.round(baseRhr + (fatigueImpact * 5) - (randomHrvNoise * 0.2)),
                weight: baseWeight,
                bodyFat: null,
                vo2max: null,
                readiness: null,
                ctl: null,
                atl: null,
                steps: null,
                spo2: null,
                respiration: null,
                stress: simStress,
                soreness: simSoreness,
                isSimulated: true,
                source: 'simulated',
            });
        }

        return simData;
    }

    // ─── ANALYTICS ENGINE ────────────────────────────────────────────────────────
    const wellnessMetrics = useMemo(() => {
        if (!wellnessData || wellnessData.length === 0 || error) return null;

        // EWMA baselines (~30 days, alpha = 2/(30+1))
        const alpha = 2 / (30 + 1);
        let ewmaHrv = null;
        let ewmaRhr = null;

        const finalChartData = wellnessData.map((d, index, arr) => {
            if (d.hrv > 0) {
                ewmaHrv = ewmaHrv === null ? d.hrv : (d.hrv * alpha) + (ewmaHrv * (1 - alpha));
            }
            if (d.rhr > 0) {
                ewmaRhr = ewmaRhr === null ? d.rhr : (d.rhr * alpha) + (ewmaRhr * (1 - alpha));
            }

            // 7-day trailing averages
            const startIdx7 = Math.max(0, index - 6);
            const window7 = arr.slice(startIdx7, index + 1);

            const validHrvW = window7.filter(w => w.hrv > 0);
            const rollHrv = validHrvW.length > 0
                ? Math.round(validHrvW.reduce((s, c) => s + c.hrv, 0) / validHrvW.length)
                : null;

            const validSleepW = window7.filter(w => w.sleep > 0);
            const rollSleep = validSleepW.length > 0
                ? Number((validSleepW.reduce((s, c) => s + c.sleep, 0) / validSleepW.length).toFixed(1))
                : null;

            const validRhrW = window7.filter(w => w.rhr > 0);
            const rollRhr = validRhrW.length > 0
                ? Math.round(validRhrW.reduce((s, c) => s + c.rhr, 0) / validRhrW.length)
                : null;

            const validWeightW = window7.filter(w => w.weight > 0);
            const rollWeight = validWeightW.length > 0
                ? Number((validWeightW.reduce((s, c) => s + c.weight, 0) / validWeightW.length).toFixed(1))
                : null;

            // 30-day HRV standard deviation for normal range
            const startIdx30 = Math.max(0, index - 29);
            const window30 = arr.slice(startIdx30, index + 1);
            const valid30Hrv = window30.filter(w => w.hrv > 0);
            let stdevHrv = ewmaHrv ? ewmaHrv * 0.05 : 5;

            if (valid30Hrv.length > 5 && ewmaHrv !== null) {
                const variance = valid30Hrv.reduce((acc, val) => acc + Math.pow(val.hrv - ewmaHrv, 2), 0) / valid30Hrv.length;
                stdevHrv = Math.max(Math.sqrt(variance), ewmaHrv * 0.05);
            }

            const rangeBottom = Math.round(ewmaHrv - stdevHrv);
            const rangeTop = Math.round(ewmaHrv + stdevHrv);

            return {
                ...d,
                baselineTop: rangeTop,
                baselineBottom: rangeBottom,
                baselineMid: Math.round(ewmaHrv),
                hrv7dAvg: rollHrv,
                sleep7dAvg: rollSleep,
                rhr7dAvg: rollRhr,
                weight7dAvg: rollWeight,
                ewmaHrv,
                ewmaRhr,
            };
        });

        const todayData = finalChartData[finalChartData.length - 1];
        const baselineHrv = todayData.ewmaHrv;
        const baselineRhr = todayData.ewmaRhr;
        const normalHrvRange = [todayData.baselineBottom, todayData.baselineTop];

        const avgHrv7d = todayData.hrv7dAvg ?? '--';
        const avgSleep7d = todayData.sleep7dAvg ?? '--';
        const avgRhr7d = todayData.rhr7dAvg ?? '--';
        const avgWeight7d = todayData.weight7dAvg ?? '--';

        const yesterdayData = finalChartData.length > 1 ? finalChartData[finalChartData.length - 2] : null;
        const yesterdayTSS = yesterdayData ? (dailyTSS.get(yesterdayData.date) || 0) : 0;
        const todayTSS = dailyTSS.get(todayData.date) || 0;
        const activeTSS = yesterdayTSS + todayTSS;

        // ─── READINESS SCORE ────────────────────────────────────────────────────
        // Use Intervals.icu native readiness if available, otherwise calculate
        const nativeReadiness = todayData.readiness;

        const insights = [];
        let scoreHRV = 0;
        let scoreSleep = 0;
        let scoreRHR = 0;

        const latestDailyHrv = todayData.hrv ?? avgHrv7d;

        // 1. HRV Score (0-45 pts)
        let hrvStatus = { label: 'Adaptado', color: 'text-emerald-500', id: 'balanced' };
        if (latestDailyHrv !== '--' && baselineHrv > 0) {
            if (latestDailyHrv >= normalHrvRange[0] && latestDailyHrv <= normalHrvRange[1]) {
                scoreHRV = 45;
                insights.push({ type: 'success', label: 'VFC Óptima', desc: 'Tu corazón indica máxima adaptación al entrenamiento y bajo estrés.' });
            } else if (latestDailyHrv > normalHrvRange[1]) {
                scoreHRV = 35;
                hrvStatus = { label: 'Hiper-Recuperado', color: 'text-amber-500', id: 'unbalanced' };
                insights.push({ type: 'warning', label: 'Fatiga Parasimpática', desc: 'VFC inusualmente alta. Puede denotar una respuesta protectora ante el sobreentrenamiento.' });
            } else {
                const dropRatio = Math.max(0, latestDailyHrv / normalHrvRange[0]);
                scoreHRV = Math.round(45 * dropRatio);
                hrvStatus = { label: 'Suprimido', color: 'text-red-500', id: 'unbalanced' };
                insights.push({ type: 'danger', label: 'VFC Suprimida', desc: 'Sistema nervioso simpático activado. Prioriza descanso o recuperación activa.' });
            }
        } else {
            scoreHRV = 22;
            hrvStatus = { label: 'Desconocido', color: 'text-slate-400', id: 'unknown' };
        }

        // 2. Sleep Score (0-35 pts)
        const dailySleepScore = todayData.sleepScore ??
            (todayData.sleep ? Math.min(100, Math.round((todayData.sleep / 8) * 100)) : 70);
        if (dailySleepScore) {
            scoreSleep = (dailySleepScore / 100) * 35;
            if (dailySleepScore < 60) {
                insights.push({ type: 'danger', label: 'Deuda de Sueño', desc: `Tu sueño (${todayData.sleep}h) no fue suficiente para limpiar la fatiga del sistema nervioso.` });
            } else if (dailySleepScore >= 85) {
                insights.push({ type: 'success', label: 'Descanso Profundo', desc: 'Patrón de sueño excelente. Gran pico de secreción hormonal.' });
            }
        }

        // 3. Resting HR Score (0-20 pts)
        const dailyRHR = todayData.rhr ?? avgRhr7d;
        if (dailyRHR !== '--' && baselineRhr > 0) {
            const diff = dailyRHR - baselineRhr;
            if (diff <= 2) {
                scoreRHR = 20;
            } else if (diff <= 8) {
                scoreRHR = 10;
                insights.push({ type: 'warning', label: 'Pulsaciones Elevadas', desc: `Tu FC Mínima está ${diff} lpm por encima de la media. Tu cuerpo está combatiendo estrés o fatiga metabólica.` });
            } else {
                scoreRHR = 0;
                insights.push({ type: 'danger', label: 'Alerta Cardiovascular', desc: `RHR significativamente elevado (+${diff} lpm). Riesgo inminente de sobreentrenamiento o enfermedad.` });
            }
        } else {
            scoreRHR = 10;
        }

        // Final readiness: use native Intervals score if available, else calculate
        const calculatedReadiness = Math.max(1, Math.min(100, Math.round(scoreHRV + scoreSleep + scoreRHR)));
        const todayReadiness = nativeReadiness != null
            ? Math.round(nativeReadiness)
            : ((avgHrv7d === '--' && avgSleep7d === '--') ? '--' : calculatedReadiness);

        // TSB alerts
        if (currentTsb < -30) {
            insights.push({ type: 'danger', label: 'Carga Extrema (TSB)', desc: 'Acumulación de fatiga crónica altísima. Riesgo de estancamiento asegurado sin descanso.' });
        } else if (currentTsb > 10) {
            insights.push({ type: 'warning', label: 'Desentrenamiento', desc: 'Riesgo de perder estado de forma general. TSB indicando infra-carga.' });
        }

        // ─── EFFORT / STRAIN ────────────────────────────────────────────────────
        let effortScore = 0;
        let effortLabel = 'Recuperación';
        let effortColor = 'text-blue-500';

        if (activeTSS > 0) {
            effortScore = Math.min(100, Math.round(100 * (1 - Math.exp(-activeTSS / 110))));
            if (effortScore > 85) { effortLabel = 'Extremo'; effortColor = 'text-purple-500'; }
            else if (effortScore > 65) { effortLabel = 'Alto'; effortColor = 'text-red-500'; }
            else if (effortScore > 40) { effortLabel = 'Moderado'; effortColor = 'text-amber-500'; }
            else { effortLabel = 'Ligero'; effortColor = 'text-emerald-500'; }
        } else {
            effortColor = 'text-slate-400';
            effortLabel = 'Día Base';
        }

        // Synthesize stress if missing
        let finalStress = todayData.stress ?? '--';
        if (finalStress === '--' && baselineHrv > 0 && dailyRHR !== '--') {
            let calc = 20;
            if (dailyRHR > baselineRhr) calc += (dailyRHR - baselineRhr) * 3;
            if (activeTSS > 0) calc += activeTSS * 0.2;
            finalStress = Math.round(Math.max(10, Math.min(95, calc)));
        }

        // ─── WEIGHT TREND ──────────────────────────────────────────────────────
        const weightData = finalChartData.filter(d => d.weight > 0);
        let weightTrend = null;
        if (weightData.length >= 7) {
            const first7Avg = weightData.slice(0, 7).reduce((s, d) => s + d.weight, 0) / 7;
            const last7Avg = weightData.slice(-7).reduce((s, d) => s + d.weight, 0) / 7;
            weightTrend = Number((last7Avg - first7Avg).toFixed(1));
        }

        // Latest individual values
        // Find last non-null row for each metric
        const findLast = (field) => {
            for (let i = finalChartData.length - 1; i >= 0; i--) {
                if (finalChartData[i][field] != null) return finalChartData[i][field];
            }
            return null;
        };

        return {
            avgHrv7d, avgSleep7d, avgRhr7d, avgWeight7d, normalHrvRange,
            baselineHrv: Math.round(baselineHrv), baselineRhr: Math.round(baselineRhr),
            todayReadiness,
            readinessSource: nativeReadiness != null ? 'intervals' : 'calculated',
            hrvStatus: hrvStatus.id, hrvStatusObj: hrvStatus,
            insights, chartData: finalChartData,
            isSimulated: wellnessData[0]?.isSimulated || false,
            source: wellnessData[0]?.source || 'simulated',

            // Latest metrics (most recent available day)
            latestHrv: findLast('hrv') ?? '--',
            latestHrvSdnn: findLast('hrvSdnn') ?? '--',
            latestSleep: findLast('sleep') ?? '--',
            latestSleepScore: findLast('sleepScore') ?? '--',
            latestRhr: findLast('rhr') ?? '--',
            latestStress: finalStress,
            latestSoreness: findLast('soreness') ?? '--',
            latestWeight: findLast('weight') ?? '--',
            latestBodyFat: findLast('bodyFat') ?? '--',
            latestVo2max: findLast('vo2max') ?? '--',
            latestReadiness: nativeReadiness != null ? Math.round(nativeReadiness) : '--',
            latestSteps: findLast('steps') ?? '--',
            latestSpo2: findLast('spo2') ?? '--',
            latestRespiration: findLast('respiration') ?? '--',
            weightTrend,

            effort: { score: effortScore, label: effortLabel, color: effortColor, tss: activeTSS },
            currentTsb,
        };
    }, [wellnessData, currentTsb, dailyTSS, error]);

    return { wellnessMetrics, loading, error };
};
