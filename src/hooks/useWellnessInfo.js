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
                            const calcSleepScore = sleepHours ? Math.min(100, Math.round((sleepHours / 8) * 100)) : null;

                            return {
                                date: d.id || d.date,
                                dateLabel: !isNaN(dateObj) ? dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : (d.id || d.date),
                                hrv: d.hrv || null,
                                sleep: sleepHours,
                                sleepScore: d.sleepScore || calcSleepScore || null,
                                rhr: d.restingHR || null,
                                stress: d.stress || null,
                                soreness: d.soreness || null,
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
                    const simSleep = Math.max(4, Number((baseSleep - (fatigueImpact * 1.5) + randomSleepNoise).toFixed(1)));
                    const simSleepScore = Math.min(100, Math.round((simSleep / 8) * 100));
                    const simStress = Math.min(100, Math.max(0, Math.round(20 + (fatigueImpact * 50) + (Math.random() * 20 - 10))));
                    const simSoreness = Math.round(fatigueImpact * 3);

                    simData.push({
                        date: dateStr,
                        dateLabel: !isNaN(dateObj) ? dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : dateStr,
                        hrv: Math.max(20, Math.round(baseHrv - (baseHrv * 0.2 * Math.max(0, fatigueImpact)) + randomHrvNoise)),
                        sleep: simSleep,
                        sleepScore: simSleepScore,
                        stress: simStress,
                        soreness: simSoreness,
                        rhr: Math.round(baseRhr + (fatigueImpact * 5) - (randomHrvNoise * 0.2)),
                        isSimulated: true
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

    // MOTOR MATEMÁTICO DE SALUD AVANZADO (EWMA & Puntuación Ponderada)
    const wellnessMetrics = useMemo(() => {
        if (!wellnessData || wellnessData.length === 0 || error) return null;

        // Variables for Exponentially Weighted Moving Average (EWMA) ~30 days
        const alpha = 2 / (30 + 1);
        let ewmaHrv = null;
        let ewmaRhr = null;

        const finalChartData = wellnessData.map((d, index, arr) => {
            // Update EWMA dynamically day by day to simulate how your baseline adapts over time
            if (d.hrv > 0) {
                if (ewmaHrv === null) ewmaHrv = d.hrv;
                else ewmaHrv = (d.hrv * alpha) + (ewmaHrv * (1 - alpha));
            }
            if (d.rhr > 0) {
                if (ewmaRhr === null) ewmaRhr = d.rhr;
                else ewmaRhr = (d.rhr * alpha) + (ewmaRhr * (1 - alpha));
            }

            // 7-day Trailing Averages
            const startIdx7 = Math.max(0, index - 6);
            const window7 = arr.slice(startIdx7, index + 1);

            const validHrvWindow = window7.filter(w => w.hrv > 0);
            const rollHrv = validHrvWindow.length > 0 ? Math.round(validHrvWindow.reduce((sum, curr) => sum + curr.hrv, 0) / validHrvWindow.length) : null;

            const validSleepWindow = window7.filter(w => w.sleep > 0);
            const rollSleep = validSleepWindow.length > 0 ? Number((validSleepWindow.reduce((sum, curr) => sum + curr.sleep, 0) / validSleepWindow.length).toFixed(1)) : null;

            const validRhrWindow = window7.filter(w => w.rhr > 0);
            const rollRhr = validRhrWindow.length > 0 ? Math.round(validRhrWindow.reduce((sum, curr) => sum + curr.rhr, 0) / validRhrWindow.length) : null;

            // 30-day Trailing Standard Deviation for the Normal Range
            const startIdx30 = Math.max(0, index - 29);
            const window30 = arr.slice(startIdx30, index + 1);
            const valid30Hrv = window30.filter(w => w.hrv > 0);
            let stdevHrv = ewmaHrv ? ewmaHrv * 0.05 : 5; // Default 5% variation if not enough data

            if (valid30Hrv.length > 5 && ewmaHrv !== null) {
                const variance = valid30Hrv.reduce((acc, val) => acc + Math.pow(val.hrv - ewmaHrv, 2), 0) / valid30Hrv.length;
                stdevHrv = Math.max(Math.sqrt(variance), ewmaHrv * 0.05); // Minimum 5% breathing room
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
                ewmaHrv,
                ewmaRhr
            };
        });

        const todayData = finalChartData[finalChartData.length - 1];

        // Final Baselines
        const baselineHrv = todayData.ewmaHrv;
        const baselineRhr = todayData.ewmaRhr;
        const normalHrvRange = [todayData.baselineBottom, todayData.baselineTop];

        const avgHrv7d = todayData.hrv7dAvg !== null ? todayData.hrv7dAvg : '--';
        const avgSleep7d = todayData.sleep7dAvg !== null ? todayData.sleep7dAvg : '--';
        const avgRhr7d = todayData.rhr7dAvg !== null ? todayData.rhr7dAvg : '--';

        const yesterdayData = finalChartData.length > 1 ? finalChartData[finalChartData.length - 2] : null;
        let yesterdayTSS = yesterdayData ? (dailyTSS.get(yesterdayData.date) || 0) : 0;

        // Let's add today's activities TSS if user ran today
        const todayTSS = dailyTSS.get(todayData.date) || 0;
        const activeTSS = yesterdayTSS + todayTSS;

        // ==========================================
        // READINESS ALGORITHM (Weighted Score 0-100)
        // Inspired by advanced recovery systems
        // Weights: 45% HRV, 35% Sleep, 20% RHR
        // ==========================================
        const insights = [];
        let scoreHRV = 0;
        let scoreSleep = 0;
        let scoreRHR = 0;

        const latestDailyHrv = todayData.hrv !== null ? todayData.hrv : avgHrv7d;

        // 1. HRV Score (0-45 points)
        let hrvStatus = { label: 'Adaptado', color: 'text-emerald-500', id: 'balanced' };
        if (latestDailyHrv !== '--' && baselineHrv > 0) {
            // Compare daily HRV to baseline range
            if (latestDailyHrv >= normalHrvRange[0] && latestDailyHrv <= normalHrvRange[1]) {
                scoreHRV = 45; // Optimal
                insights.push({ type: 'success', label: 'VFC Óptima', desc: 'Tu corazón indica máxima adaptación al entrenamiento y bajo estrés.' });
            } else if (latestDailyHrv > normalHrvRange[1]) {
                // Hyper-recovery (parasympathetic dominance due to accumulated fatigue)
                scoreHRV = 35; // Still decent, but warning
                hrvStatus = { label: 'Hiper-Recuperado', color: 'text-amber-500', id: 'unbalanced' };
                insights.push({ type: 'warning', label: 'Fatiga Parasimpática', desc: 'VFC inusualmente alta. Puede denotar una respuesta protectora ante el sobreentrenamiento.' });
            } else {
                // Suppressed HRV
                const dropRatio = Math.max(0, latestDailyHrv / normalHrvRange[0]); // 0 to 1
                scoreHRV = Math.round(45 * dropRatio);
                hrvStatus = { label: 'Suprimido', color: 'text-red-500', id: 'unbalanced' };
                insights.push({ type: 'danger', label: 'VFC Suprimida', desc: 'Sistema nervioso simpático activado. Prioriza descanso o recuperación activa.' });
            }
        } else {
            scoreHRV = 22; // Unknown, give middle ground
            hrvStatus = { label: 'Desconocido', color: 'text-slate-400', id: 'unknown' };
        }

        // 2. Sleep Score (0-35 points)
        const dailySleepScore = todayData.sleepScore !== null ? todayData.sleepScore :
            (todayData.sleep ? Math.min(100, Math.round((todayData.sleep / 8) * 100)) : 70);

        if (dailySleepScore) {
            scoreSleep = (dailySleepScore / 100) * 35;
            if (dailySleepScore < 60) {
                insights.push({ type: 'danger', label: 'Deuda de Sueño', desc: `Tu sueño (${todayData.sleep}h) no fue suficiente para limpiar la fatiga del sistema nervioso.` });
            } else if (dailySleepScore >= 85) {
                insights.push({ type: 'success', label: 'Descanso Profundo', desc: 'Patrón de sueño excelente. Gran pico de secreción hormonal.' });
            }
        }

        // 3. Resting HR Score (0-20 points)
        const dailyRHR = todayData.rhr !== null ? todayData.rhr : avgRhr7d;
        if (dailyRHR !== '--' && baselineRhr > 0) {
            // Lower is better. If RHR is below or equal to baseline + 2bpm -> 20pts
            // If it's elevated, we lose points rapidly.
            const diff = dailyRHR - baselineRhr;
            if (diff <= 2) {
                scoreRHR = 20;
            } else if (diff > 2 && diff <= 8) {
                scoreRHR = 10;
                insights.push({ type: 'warning', label: 'Pulsaciones Elevadas', desc: `Tu FC Mínima está ${diff} lpm por encima de la media. Tu cuerpo está combatiendo estrés o fatiga metabólica.` });
            } else {
                scoreRHR = 0;
                insights.push({ type: 'danger', label: 'Alerta Cardiovascular', desc: `RHR significativamente elevado (+${diff} lpm). Riesgo inminente de sobreentrenamiento o enfermedad.` });
            }
        } else {
            scoreRHR = 10; // Unknown
        }

        const todayReadiness = (avgHrv7d === '--' && avgSleep7d === '--') ? '--' : Math.max(1, Math.min(100, Math.round(scoreHRV + scoreSleep + scoreRHR)));

        // Miscellaneous TSB factor (Just add an insight, doesn't directly hit Readiness unless it affects HRV/RHR)
        if (currentTsb < -30) {
            insights.push({ type: 'danger', label: 'Carga Extrema (TSB)', desc: 'Acumulación de fatiga crónica altísima. Riesgo de estancamiento asegurado sin descanso.' });
        } else if (currentTsb > 10) {
            insights.push({ type: 'warning', label: 'Desentrenamiento', desc: 'Riesgo de perder estado de forma general. TSB indicando infra-carga.' });
        }

        // ==========================================
        // EFFORT / STRAIN ALGORITHM (0-100)
        // Logarithmic Curve targeting 0-100 scale
        // ==========================================
        let effortScore = 0;
        let effortLabel = "Recuperación";
        let effortColor = "text-blue-500";

        if (activeTSS > 0) {
            // Un TSS de 100 equivale aprox a un 60% de strain, 150 = 75%, 300 = 95%
            effortScore = Math.min(100, Math.round(100 * (1 - Math.exp(-activeTSS / 110))));

            if (effortScore > 85) { effortLabel = "Extremo"; effortColor = "text-purple-500"; }
            else if (effortScore > 65) { effortLabel = "Alto"; effortColor = "text-red-500"; }
            else if (effortScore > 40) { effortLabel = "Moderado"; effortColor = "text-amber-500"; }
            else { effortLabel = "Ligero"; effortColor = "text-emerald-500"; }
        } else {
            effortColor = "text-slate-400";
            effortLabel = "Día Base";
        }

        // Synthesize Stress if Missing
        let finalStress = todayData.stress !== null && todayData.stress !== undefined ? todayData.stress : '--';
        if (finalStress === '--' && baselineHrv > 0 && dailyRHR !== '--') {
            // Rough approximation if sensor didn't provide stress directly
            let calc = 20; // base
            if (dailyRHR > baselineRhr) calc += (dailyRHR - baselineRhr) * 3;
            if (activeTSS > 0) calc += activeTSS * 0.2;
            calc = Math.max(10, Math.min(95, calc));
            finalStress = Math.round(calc);
        }

        return {
            avgHrv7d, avgSleep7d, avgRhr7d, normalHrvRange,
            baselineHrv: Math.round(baselineHrv), baselineRhr: Math.round(baselineRhr),
            todayReadiness,
            hrvStatus: hrvStatus.id, hrvStatusObj: hrvStatus,
            insights, chartData: finalChartData,
            isSimulated: wellnessData[0]?.isSimulated || false,
            latestHrv: todayData.hrv !== null ? todayData.hrv : '--',
            latestSleep: todayData.sleep !== null ? todayData.sleep : '--',
            latestSleepScore: todayData.sleepScore !== null ? todayData.sleepScore : '--',
            latestRhr: todayData.rhr !== null ? todayData.rhr : '--',
            latestStress: finalStress,
            latestSoreness: todayData.soreness !== null ? todayData.soreness : '--',
            effort: { score: effortScore, label: effortLabel, color: effortColor, tss: activeTSS },
            currentTsb
        };
    }, [wellnessData, currentTsb, dailyTSS, error]);

    return { wellnessMetrics, loading, error };
};
