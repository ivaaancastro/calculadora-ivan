import { useState, useEffect, useMemo } from 'react';

export const useWellnessInfo = (activities, settings, chartData) => {
    const [wellnessData, setWellnessData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Reconstruct daily TSS for the simulator if needed
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
        return chartData[chartData.length - 1].tsb || 0;
    }, [chartData]);

    // OBTENCIÓN DE DATOS
    useEffect(() => {
        const fetchWellness = async () => {
            setLoading(true);
            setError(null);

            try {
                // 1. INTENTO REAL API INTERVALS
                if (settings?.intervalsId && settings?.intervalsKey) {
                    const end = new Date().toISOString().split('T')[0];
                    const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                    const authString = 'Basic ' + btoa(`API_KEY:${settings.intervalsKey}`);

                    const res = await fetch(`https://intervals.icu/api/v1/athlete/${settings.intervalsId}/wellness?oldest=${start}&newest=${end}`, {
                        method: 'GET', headers: { 'Authorization': authString, 'Accept': 'application/json' }
                    });

                    if (!res.ok) throw new Error(`API Error ${res.status}: Revisa tu Athlete ID y API Key.`);

                    const data = await res.json();

                    if (Array.isArray(data) && data.length > 0) {
                        const realData = data.map(d => {
                            let dateObj = new Date(d.id || d.date);
                            if (d.id && typeof d.id === 'string' && d.id.includes('-')) {
                                dateObj = new Date(d.id + 'T00:00:00');
                            }
                            const sleepHours = d.sleepSecs ? Number((d.sleepSecs / 3600).toFixed(1)) : (d.sleep || null);

                            return {
                                date: d.id || d.date,
                                dateLabel: !isNaN(dateObj) ? dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : (d.id || d.date),
                                hrv: d.hrv || null,
                                sleep: sleepHours,
                                rhr: d.restingHR || null,
                                isSimulated: false
                            };
                        }).sort((a, b) => new Date(a.date + "T00:00:00") - new Date(b.date + "T00:00:00"));

                        setWellnessData(realData);
                        setLoading(false);
                        return;
                    } else {
                        throw new Error("Intervals devolvió datos vacíos. Verifica tus sincronizaciones allí.");
                    }
                }

                // 2. SIMULADOR (Si no hay claves)
                const simData = [];
                const baseHrv = 65; const baseSleep = 7.5; const baseRhr = settings?.fcReposo || 50;
                const today = new Date();
                for (let i = 90; i >= 0; i--) {
                    const d = new Date(today); d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    const prevDate = new Date(d); prevDate.setDate(d.getDate() - 1);
                    const yesterdayTSS = dailyTSS.get(prevDate.toISOString().split('T')[0]) || 0;

                    const fatigueImpact = Math.min(yesterdayTSS / 150, 1);
                    const randomHrvNoise = (Math.random() * 10) - 5;
                    const randomSleepNoise = (Math.random() * 1.5) - 0.75;

                    const dateObj = new Date(dateStr + "T00:00:00");

                    simData.push({
                        date: dateStr,
                        dateLabel: !isNaN(dateObj) ? dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : dateStr,
                        hrv: Math.max(20, Math.round(baseHrv - (baseHrv * 0.2 * fatigueImpact) + randomHrvNoise)),
                        sleep: Math.max(4, Number((baseSleep - (fatigueImpact * 1.5) + randomSleepNoise).toFixed(1))),
                        rhr: Math.round(baseRhr + (fatigueImpact * 5) - (randomHrvNoise * 0.2)), isSimulated: true
                    });
                }
                setWellnessData(simData);

            } catch (err) {
                console.error("Fetch Wellness Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchWellness();
    }, [settings, dailyTSS]);

    // MOTOR MATEMÁTICO DE SALUD (Desviación Estándar)
    const wellnessMetrics = useMemo(() => {
        if (!wellnessData || wellnessData.length === 0 || error) return null;

        const validHrv = wellnessData.filter(d => d.hrv > 0);
        const baselineHrv = validHrv.length > 0 ? validHrv.reduce((acc, val) => acc + val.hrv, 0) / validHrv.length : 0;

        const hrvVariance = validHrv.length > 0 ? validHrv.reduce((acc, val) => acc + Math.pow(val.hrv - baselineHrv, 2), 0) / validHrv.length : 0;
        const hrvStdDev = Math.max(Math.sqrt(hrvVariance), baselineHrv * 0.05);
        const normalHrvRange = [Math.round(baselineHrv - hrvStdDev), Math.round(baselineHrv + hrvStdDev)];

        const validRhr = wellnessData.filter(d => d.rhr > 0);
        const baselineRhr = validRhr.length > 0 ? Math.round(validRhr.reduce((acc, val) => acc + val.rhr, 0) / validRhr.length) : 50;

        const finalChartData = wellnessData.map((d, index, arr) => {
            const startIdx = Math.max(0, index - 6);
            const window = arr.slice(startIdx, index + 1);

            const validHrvWindow = window.filter(w => w.hrv > 0);
            const rollHrv = validHrvWindow.length > 0 ? Math.round(validHrvWindow.reduce((sum, curr) => sum + curr.hrv, 0) / validHrvWindow.length) : null;

            const validSleepWindow = window.filter(w => w.sleep > 0);
            const rollSleep = validSleepWindow.length > 0 ? Number((validSleepWindow.reduce((sum, curr) => sum + curr.sleep, 0) / validSleepWindow.length).toFixed(1)) : null;

            const validRhrWindow = window.filter(w => w.rhr > 0);
            const rollRhr = validRhrWindow.length > 0 ? Math.round(validRhrWindow.reduce((sum, curr) => sum + curr.rhr, 0) / validRhrWindow.length) : null;

            return {
                ...d,
                baselineTop: normalHrvRange[1],
                baselineBottom: normalHrvRange[0],
                baselineMid: Math.round(baselineHrv),
                hrv7dAvg: rollHrv,
                sleep7dAvg: rollSleep,
                rhr7dAvg: rollRhr
            };
        });

        const todayData = finalChartData[finalChartData.length - 1];
        const avgHrv7d = todayData.hrv7dAvg !== null ? todayData.hrv7dAvg : '--';
        const avgSleep7d = todayData.sleep7dAvg !== null ? todayData.sleep7dAvg : '--';
        const avgRhr7d = todayData.rhr7dAvg !== null ? todayData.rhr7dAvg : '--';

        let score = 100;
        const insights = [];

        // 1. Fatiga Acumulada (TSB)
        if (currentTsb < -25) {
            score -= 20;
            insights.push({ type: 'danger', label: 'Sobrecarga Alta', desc: 'Fatiga muy elevada por entrenamiento reciente.' });
        } else if (currentTsb < -10) {
            score -= 10;
            insights.push({ type: 'warning', label: 'Fatiga Moderada', desc: 'Cuerpo cansado por la carga reciente.' });
        } else if (currentTsb > 5) {
            insights.push({ type: 'success', label: 'Fresco', desc: 'Nivel óptimo de recuperación muscular.' });
        }

        // 2. Sueño
        if (avgSleep7d !== '--') {
            if (avgSleep7d < 6) {
                score -= 20;
                insights.push({ type: 'danger', label: 'Déficit de Sueño', desc: `Durmiendo ${avgSleep7d}h media (Meta: 8h).` });
            } else if (avgSleep7d < 7) {
                score -= 10;
                insights.push({ type: 'warning', label: 'Sueño Insuficiente', desc: 'Descanso por debajo de lo óptimo.' });
            } else if (avgSleep7d >= 8) {
                insights.push({ type: 'success', label: 'Sueño Óptimo', desc: 'Excelente recuperación nocturna.' });
            }
        }

        // 3. VFC
        let hrvStatus = { label: 'Equilibrado', color: 'text-emerald-500', id: 'balanced' };
        if (baselineHrv > 0 && avgHrv7d !== '--') {
            if (avgHrv7d < normalHrvRange[0]) {
                score -= 25;
                hrvStatus = { label: 'Tensión Simpática', color: 'text-red-500', id: 'unbalanced' };
                insights.push({ type: 'danger', label: 'VFC Suprimida', desc: 'Sistema nervioso estresado.' });
            } else if (avgHrv7d > normalHrvRange[1]) {
                score -= 5;
                hrvStatus = { label: 'Hiper-Recuperación', color: 'text-blue-500', id: 'unbalanced' };
                insights.push({ type: 'warning', label: 'Hiper-Recuperación', desc: 'Posible fatiga parasimpática.' });
            } else {
                insights.push({ type: 'success', label: 'VFC Equilibrada', desc: 'Sistema nervioso adaptado.' });
            }
        } else if (avgHrv7d === '--') {
            hrvStatus = { label: 'Sin Datos Recientes', color: 'text-slate-400', id: 'unknown' };
        }

        const todayReadiness = (avgHrv7d === '--' && avgSleep7d === '--') ? '--' : Math.max(0, Math.min(100, score));

        return {
            avgHrv7d, avgSleep7d, avgRhr7d, normalHrvRange,
            baselineHrv: Math.round(baselineHrv), baselineRhr, todayReadiness,
            hrvStatus: hrvStatus.id, hrvStatusObj: hrvStatus,
            insights, chartData: finalChartData,
            isSimulated: wellnessData[0]?.isSimulated || false,
            latestHrv: todayData.hrv !== null ? todayData.hrv : '--',
            latestSleep: todayData.sleep !== null ? todayData.sleep : '--',
            latestRhr: todayData.rhr !== null ? todayData.rhr : '--'
        };
    }, [wellnessData, currentTsb, error]);

    return { wellnessMetrics, loading, error };
};
