import { useMemo } from 'react';
import { formatPace, formatDuration } from '../utils/formatters';
import { calculateTrainingEffect } from '../utils/fitnessStatsEngine';

export const useActivityMetrics = (activity, streams, settings) => {
    const isPaceBased = useMemo(() => {
        if (!activity) return false;
        const t = String(activity.type).toLowerCase();
        return t.includes('carrera') || t.includes('run') || t.includes('correr') || t.includes('andar') || t.includes('walk') || t.includes('caminata');
    }, [activity]);

    const exactZoneAnalysis = useMemo(() => {
        if (!streams || !streams.heartrate || !streams.time) return null;
        const type = activity.type.toLowerCase();
        const isBike = type.includes('bici') || type.includes('ciclismo');
        const userZones = isBike ? settings.bike.zones : settings.run.zones;
        const hrData = streams.heartrate.data; const timeData = streams.time.data;
        let zoneSeconds = [0, 0, 0, 0, 0, 0, 0];

        for (let i = 1; i < hrData.length; i++) {
            const hr = hrData[i]; const dt = timeData[i] - timeData[i - 1];
            const zIndex = userZones.findIndex(z => hr >= z.min && hr <= z.max);
            if (zIndex !== -1) zoneSeconds[zIndex] += dt; else if (hr > userZones[userZones.length - 1].max) zoneSeconds[userZones.length - 1] += dt;
        }
        const totalSeconds = zoneSeconds.reduce((a, b) => a + b, 0);
        return zoneSeconds.map((sec, i) => {
            const zMin = userZones[i]?.min || 0;
            const zMax = userZones[i]?.max || '+';
            return {
                zone: i + 1,
                label: `Z${i + 1}`,
                minutes: Math.round(sec / 60),
                pct: totalSeconds > 0 ? (sec / totalSeconds) * 100 : 0,
                range: i === userZones.length - 1 ? `> ${zMin}` : `${zMin} - ${zMax}`
            };
        });
    }, [streams, activity, settings]);

    const exactPacePowerZoneAnalysis = useMemo(() => {
        if (!streams || !streams.time) return null;
        const timeData = streams.time.data;

        if (isPaceBased && streams.velocity_smooth) {
            const velData = streams.velocity_smooth.data;
            const paceZones = settings.run?.paceZones;
            if (!paceZones || paceZones.length === 0) return null;

            const tpPaceStr = settings.run.thresholdPace || '4:30';
            const [m, s] = tpPaceStr.split(':');
            const tpSecs = (parseInt(m) || 0) * 60 + (parseInt(s) || 0);
            const tpSpeedMs = 1000 / tpSecs;

            const pzMs = [
                { sMin: 0, sMax: 0.775 },
                { sMin: 0.785, sMax: 0.877 },
                { sMin: 0.887, sMax: 0.943 },
                { sMin: 0.953, sMax: 1.00 },
                { sMin: 1.01, sMax: 1.034 },
                { sMin: 1.044, sMax: 1.115 },
                { sMin: 1.125, sMax: 1.30 }
            ];

            let zoneSeconds = [0, 0, 0, 0, 0, 0, 0];
            for (let i = 1; i < velData.length; i++) {
                const vel = velData[i]; const dt = timeData[i] - timeData[i - 1];
                if (vel < 0.2) continue;
                const pct = vel / tpSpeedMs;
                const zIndex = pzMs.findIndex(z => pct >= z.sMin && pct <= z.sMax);
                if (zIndex !== -1) zoneSeconds[zIndex] += dt;
                else if (pct > pzMs[6].sMax) zoneSeconds[6] += dt;
                else if (pct < pzMs[0].sMin) zoneSeconds[0] += dt;
            }
            const totalSeconds = zoneSeconds.reduce((a, b) => a + b, 0);
            if (totalSeconds === 0) return null;

            const formatSpeedToPace = (speed) => {
                if (!speed || speed <= 0) return '∞';
                const secsPerKm = 1000 / speed;
                const min = Math.floor(secsPerKm / 60);
                const sec = Math.floor(secsPerKm % 60).toString().padStart(2, '0');
                return `${min}:${sec}`;
            };

            return zoneSeconds.map((sec, i) => {
                const zMinSpeed = pzMs[i].sMin * tpSpeedMs;
                const zMaxSpeed = pzMs[i].sMax * tpSpeedMs;
                const minPace = formatSpeedToPace(zMaxSpeed);
                const maxPace = formatSpeedToPace(zMinSpeed);

                let rangeStr = '';
                if (i === 0) rangeStr = `> ${minPace}`;
                else if (i === 6) rangeStr = `< ${maxPace}`;
                else rangeStr = `${minPace} - ${maxPace}`;

                return {
                    zone: i + 1,
                    minutes: Math.round(sec / 60),
                    pct: (sec / totalSeconds) * 100,
                    label: `Z${i + 1}`,
                    range: rangeStr
                };
            });
        }

        if (!isPaceBased && streams.watts) {
            const powerData = streams.watts.data;
            const ftp = settings.bike?.ftp || 200;
            const pz = [
                { pMin: 0, pMax: 0.55 },
                { pMin: 0.56, pMax: 0.75 },
                { pMin: 0.76, pMax: 0.90 },
                { pMin: 0.91, pMax: 1.05 },
                { pMin: 1.06, pMax: 1.20 },
                { pMin: 1.21, pMax: 1.50 },
                { pMin: 1.51, pMax: 2.00 },
            ];
            let zoneSeconds = [0, 0, 0, 0, 0, 0, 0];
            for (let i = 1; i < powerData.length; i++) {
                const w = powerData[i]; const dt = timeData[i] - timeData[i - 1];
                const pct = w / ftp;
                const zIndex = pz.findIndex(z => pct >= z.pMin && pct <= z.pMax);
                if (zIndex !== -1) zoneSeconds[zIndex] += dt;
                else if (pct > pz[6].pMax) zoneSeconds[6] += dt;
            }
            const totalSeconds = zoneSeconds.reduce((a, b) => a + b, 0);
            if (totalSeconds === 0) return null;
            const labels = ['Z1 Recovery', 'Z2 Endurance', 'Z3 Tempo', 'Z4 Threshold', 'Z5 VO2 Max', 'Z6 Anaerobic', 'Z7 Neuromusc'];
            return zoneSeconds.map((sec, i) => {
                const zMin = Math.round(pz[i].pMin * ftp);
                const zMax = Math.round(pz[i].pMax * ftp);
                let rangeStr = `${zMin}-${zMax}w`;
                if (i === 6) rangeStr = `> ${zMin}w`;
                if (i === 0) rangeStr = `< ${zMax}w`;
                return {
                    zone: i + 1,
                    label: labels[i],
                    minutes: Math.round(sec / 60),
                    pct: (sec / totalSeconds) * 100,
                    range: rangeStr
                };
            });
        }

        return null;
    }, [streams, isPaceBased, settings]);

    const proMetrics = useMemo(() => {
        if (!streams || !streams.time) return { cadenceAvg: 0, maxSpeedObj: null, decouplingObj: null, efObj: null, autoLaps: [], avgWatts: 0, maxWatts: 0, npWatts: 0, vi: 0, ifFactor: 0, workKj: 0, powerCurve: [], climbPro: [] };

        let cadenceAvg = 0; let decouplingObj = null; let efObj = null; const autoLaps = [];
        let avgWatts = 0; let maxWatts = 0; let npWatts = 0;

        if (streams.watts?.data?.length > 0) {
            const wData = streams.watts.data;
            const validWatts = wData.filter(w => w >= 0);
            if (validWatts.length > 0) {
                avgWatts = Math.round(validWatts.reduce((a, b) => a + b, 0) / validWatts.length);
                maxWatts = Math.max(...validWatts);

                if (wData.length > 30) {
                    let rollingSum = 0;
                    const rollingAvg4th = [];
                    for (let i = 0; i < wData.length; i++) {
                        rollingSum += wData[i];
                        if (i >= 30) {
                            rollingSum -= wData[i - 30];
                            const avg = rollingSum / 30;
                            rollingAvg4th.push(Math.pow(avg, 4));
                        }
                    }
                    if (rollingAvg4th.length > 0) {
                        const avg4th = rollingAvg4th.reduce((a, b) => a + b, 0) / rollingAvg4th.length;
                        npWatts = Math.round(Math.pow(avg4th, 0.25));
                    }
                }
            }
        }

        if (streams.cadence?.data?.length > 0) {
            const validCadences = streams.cadence.data.filter(c => c > 0);
            if (validCadences.length > 0) {
                const sum = validCadences.reduce((a, b) => a + b, 0);
                cadenceAvg = Math.round(sum / validCadences.length);
                if (isPaceBased) cadenceAvg *= 2;
            }
        }

        let maxSpeedObj = null;
        if (streams.velocity_smooth?.data?.length > 0) {
            const maxMs = Math.max(...streams.velocity_smooth.data);
            if (isPaceBased) {
                if (maxMs > 0.1) maxSpeedObj = { value: formatPace(16.6666667 / maxMs), unit: '/km', label: 'Ritmo Máx' };
            } else { maxSpeedObj = { value: (maxMs * 3.6).toFixed(1), unit: 'km/h', label: 'Vel. Máxima' }; }
        }

        if (streams.heartrate?.data && streams.time.data.length > 1200) {
            const hrData = streams.heartrate.data;
            const timeData = streams.time.data;
            const isPowerBased = !isPaceBased && streams.watts?.data;
            const workData = isPowerBased ? streams.watts.data : streams.velocity_smooth?.data;

            if (workData) {
                let startIndex = 0;
                while (startIndex < timeData.length && timeData[startIndex] < 600) { startIndex++; }

                if (startIndex < timeData.length - 600) {
                    const validLength = timeData.length - startIndex;
                    const midLength = Math.floor(validLength / 2);
                    const midIndex = startIndex + midLength;

                    let hrTotal = 0, workTotal = 0, countTotal = 0;
                    let hr1 = 0, work1 = 0, count1 = 0;
                    let hr2 = 0, work2 = 0, count2 = 0;

                    for (let i = startIndex; i < timeData.length; i++) {
                        if (hrData[i] > 80 && workData[i] > (isPowerBased ? 20 : 1)) {
                            hrTotal += hrData[i]; workTotal += workData[i]; countTotal++;
                            if (i < midIndex) { hr1 += hrData[i]; work1 += workData[i]; count1++; }
                            else { hr2 += hrData[i]; work2 += workData[i]; count2++; }
                        }
                    }

                    if (countTotal > 300) {
                        const efTotal = (workTotal / countTotal) / (hrTotal / countTotal);
                        const efVal = isPowerBased ? efTotal : (efTotal * 60);
                        efObj = { value: efVal.toFixed(2), unit: isPowerBased ? 'w/bpm' : 'm/bpm' };

                        if (count1 > 150 && count2 > 150) {
                            const ef1 = (work1 / count1) / (hr1 / count1);
                            const ef2 = (work2 / count2) / (hr2 / count2);
                            const decVal = (((ef1 - ef2) / ef1) * 100);

                            let color = 'text-green-500'; let label = 'Excelente';
                            if (decVal > 5) { color = 'text-yellow-500'; label = 'Aceptable'; }
                            if (decVal > 8) { color = 'text-red-500'; label = 'Alto'; }
                            if (decVal < -5) { color = 'text-slate-400'; label = 'Negativo'; }

                            decouplingObj = { value: decVal.toFixed(1), color, label };
                        }
                    }
                }
            }
        }

        if (streams.laps && streams.laps.length > 0) {
            streams.laps.forEach((lap, idx) => {
                const lapTimeMin = lap.moving_time / 60;
                const lapDistKm = lap.distance / 1000;
                const avgSpdMs = lap.average_speed || (lap.distance / (lap.moving_time || 1));

                autoLaps.push({
                    index: idx + 1,
                    name: lap.name,
                    timeStr: formatPace(lapTimeMin),
                    speedVal: isPaceBased ? formatPace(16.6666667 / avgSpdMs) : (avgSpdMs * 3.6).toFixed(1),
                    rawSpeed: avgSpdMs,
                    hrAvg: Math.round(lap.average_heartrate) || 0,
                    pwrAvg: lap.average_watts ? Math.round(lap.average_watts) : null,
                    cadAvg: lap.average_cadence ? Math.round(lap.average_cadence) : null,
                    elev: Math.round(lap.total_elevation_gain) || 0,
                    distanceKm: lapDistKm.toFixed(2)
                });
            });
        } else if (streams.distance?.data && streams.time.data && streams.heartrate?.data && streams.velocity_smooth?.data) {
            const distData = streams.distance.data;
            const hrData = streams.heartrate.data;
            const spdData = streams.velocity_smooth.data;
            const timeData = streams.time.data;
            const altData = streams.altitude?.data;
            const wattData = streams.watts?.data;
            const cadData = streams.cadence?.data;

            const lapDistance = isPaceBased ? 1000 : 5000;
            let currentLapTarget = lapDistance;
            let lapStartIndex = 0;

            for (let i = 0; i < distData.length; i++) {
                if (distData[i] >= currentLapTarget || i === distData.length - 1) {
                    if (i > lapStartIndex) {
                        let hrSum = 0, spdSum = 0, pwrSum = 0, cadSum = 0, count = 0;
                        for (let j = lapStartIndex; j <= i; j++) {
                            hrSum += hrData[j]; 
                            spdSum += spdData[j]; 
                            if (wattData) pwrSum += wattData[j];
                            if (cadData) cadSum += cadData[j];
                            count++;
                        }

                        const lapTimeSecs = timeData[i] - timeData[lapStartIndex];
                        const lapDistMeters = distData[i] - distData[lapStartIndex];
                        const elevGain = altData ? Math.max(0, altData[i] - altData[lapStartIndex]) : 0;
                        const avgSpdMs = spdSum / count;

                        if (lapDistMeters > lapDistance * 0.3) { 
                            autoLaps.push({
                                index: autoLaps.length + 1,
                                timeStr: formatPace(lapTimeSecs / 60),
                                speedVal: isPaceBased ? formatPace(16.6666667 / avgSpdMs) : (avgSpdMs * 3.6).toFixed(1),
                                rawSpeed: avgSpdMs,
                                hrAvg: Math.round(hrSum / count),
                                pwrAvg: wattData ? Math.round(pwrSum / count) : null,
                                cadAvg: cadData ? Math.round(cadSum / count) : null,
                                elev: Math.round(elevGain),
                                distanceKm: (lapDistMeters / 1000).toFixed(2)
                            });
                        }
                    }
                    lapStartIndex = i;
                    currentLapTarget += lapDistance;
                }
            }
        }

        let powerCurve = [];
        let vi = 0;
        let ifFactor = 0;
        let workKj = 0;

        if (streams.watts?.data?.length > 30) {
            const wData = streams.watts.data;
            let thresholdPower = 200;
            if (!isPaceBased) {
                thresholdPower = settings.bike?.ftp || 200;
            } else {
                const paceStr = settings.run?.thresholdPace || '4:30';
                const [m, s] = paceStr.split(':');
                const paceSecs = (parseInt(m) || 4) * 60 + (parseInt(s) || 30);
                const weight = Number(settings.weight) || 75;
                thresholdPower = (1000 / paceSecs) * weight * 1.05;
            }
            
            if (avgWatts > 0) vi = Number((npWatts / avgWatts).toFixed(2));
            ifFactor = Number((npWatts / thresholdPower).toFixed(2));
            const durationSecs = streams.time.data[streams.time.data.length - 1];
            workKj = Math.round((avgWatts * durationSecs) / 1000);

            const getBestPower = (seconds) => {
                if (wData.length < seconds) return 0;
                let maxAvg = 0;
                let currentSum = 0;
                for (let i = 0; i < wData.length; i++) {
                    currentSum += wData[i];
                    if (i >= seconds) {
                        currentSum -= wData[i - seconds];
                        const avg = currentSum / seconds;
                        if (avg > maxAvg) maxAvg = avg;
                    }
                }
                return Math.round(maxAvg);
            };

            powerCurve = [
                { label: '1s', value: getBestPower(1) },
                { label: '5s', value: getBestPower(5) },
                { label: '30s', value: getBestPower(30) },
                { label: '1m', value: getBestPower(60) },
                { label: '5m', value: getBestPower(300) },
                { label: '10m', value: getBestPower(600) },
                { label: '20m', value: getBestPower(1200) }
            ];
        }

        const climbPro = [];
        if (streams.altitude?.data && streams.distance?.data) {
            const altData = streams.altitude.data;
            const distData = streams.distance.data;
            const timeData = streams.time.data;
            
            let inClimb = false;
            let climbStartIdx = 0;
            
            for (let i = 10; i < distData.length; i += 5) {
                const dAlt = altData[i] - altData[i - 10];
                const dDist = distData[i] - distData[i - 10];
                const grade = dDist > 0 ? (dAlt / dDist) * 100 : 0;

                if (!inClimb && grade > 3.0) {
                    inClimb = true;
                    climbStartIdx = i - 10;
                } else if (inClimb && (grade < 0.5 || i === distData.length - 1)) {
                    const cDist = distData[i] - distData[climbStartIdx];
                    const cGain = altData[i] - altData[climbStartIdx];
                    const cTime = timeData[i] - timeData[climbStartIdx];
                    
                    if (cDist > 400 && cGain > 15) {
                        const avgGrade = (cGain / cDist) * 100;
                        const vam = Math.round((cGain / cTime) * 3600);
                        
                        const difficulty = cDist * avgGrade;
                        let category = "4";
                        if (difficulty > 64000) category = "HC";
                        else if (difficulty > 48000) category = "1";
                        else if (difficulty > 32000) category = "2";
                        else if (difficulty > 16000) category = "3";

                        climbPro.push({
                            index: climbPro.length + 1,
                            distance: (cDist / 1000).toFixed(2),
                            gain: Math.round(cGain),
                            avgGrade: avgGrade.toFixed(1),
                            vam: vam,
                            category: category,
                            timeStr: formatDuration(cTime)
                        });
                    }
                    inClimb = false;
                }
            }
        }

        return { cadenceAvg, maxSpeedObj, decouplingObj, efObj, autoLaps, avgWatts, maxWatts, npWatts, vi, ifFactor, workKj, powerCurve, climbPro };
    }, [streams, isPaceBased, settings]);

    const trainingEffect = useMemo(() => {
        if (!activity || !settings || !streams) return null;
        const result = calculateTrainingEffect({ ...activity, streams_data: streams }, settings);

        if (!result) return null;

        return {
            aerobic: result.aerobic.score,
            anaerobic: result.anaerobic.score,
            description: result.benefitDesc,
            aerobicLabel: result.aerobic.label,
            anaerobicLabel: result.anaerobic.label,
            primaryBenefit: result.primaryBenefit,
            benefitColor: result.aerobic.color,
            peakEpoc: result.peakEpoc
        };
    }, [streams, activity, settings]);

    const chartData = useMemo(() => {
        if (!streams || !streams.time) return [];
        const timeData = streams.time.data; 
        const distData = streams.distance?.data;
        const altData = streams.altitude?.data;
        const latlngStream = streams.latlng?.data;
        const step = Math.max(1, Math.floor(timeData.length / 600));
        const data = [];

        for (let i = 0; i < timeData.length; i += step) {
            const ms = streams.velocity_smooth ? streams.velocity_smooth.data[i] : null;
            let speed = null; let pace = null;
            if (ms !== null) {
                speed = Number((ms * 3.6).toFixed(1));
                if (ms > 0.1) { pace = Number((16.666666666667 / ms).toFixed(2)); if (pace > 20) pace = 20; }
                else { pace = 20; }
            }

            let slope = 0;
            if (i > 0 && distData && altData) {
                const prevIdx = Math.max(0, i - step);
                const dAlt = altData[i] - altData[prevIdx];
                const dDist = distData[i] - distData[prevIdx];
                if (dDist > 1) {
                    slope = (dAlt / dDist) * 100;
                    if (slope > 30) slope = 30;
                    if (slope < -30) slope = -30;
                }
            }

            data.push({
                time: Math.floor(timeData[i] / 60),
                rawTime: timeData[i],
                distanceKm: distData ? (distData[i] / 1000).toFixed(2) : null,
                grade: slope,
                hr: streams.heartrate ? streams.heartrate.data[i] : null,
                speed: speed,
                pace: pace,
                alt: altData ? Math.round(altData[i]) : null,
                watts: streams.watts ? streams.watts.data[i] : null,
                cadence: streams.cadence ? streams.cadence.data[i] : null,
                temp: streams.temp ? streams.temp.data[i] : null,
                latlng: latlngStream ? latlngStream[i] : null
            });
        }
        return data;
    }, [streams]);

    const maxHr = useMemo(() => streams?.heartrate?.data?.length > 0 ? Math.max(...streams.heartrate.data) : null, [streams]);

    const fitnessAnalysis = useMemo(() => {
        if (!trainingEffect || !proMetrics) return null;

        let title = "Análisis del Coach";
        let score = 50;
        let insights = [];
        let nextStep = "";

        const { ifFactor, decouplingObj, powerCurve, npWatts } = proMetrics;
        const { primaryBenefit } = trainingEffect;

        if (ifFactor >= 0.95) {
            insights.push(`Has trabajado a una intensidad altísima (${ifFactor}), prácticamente a nivel de competición. Este estímulo es excelente para mejorar tu techo de rendimiento, pero requiere una recuperación profunda.`);
            score += 20;
        } else if (ifFactor >= 0.85) {
            insights.push(`Sesión de intensidad sólida (${ifFactor}). Has pasado gran parte del tiempo en zonas exigentes, lo que fortalecerá tu resistencia específica.`);
            score += 15;
        } else if (ifFactor <= 0.70 && ifFactor > 0) {
            insights.push(`Buen control de la intensidad (${ifFactor}). Te has mantenido en niveles de base o recuperación, permitiendo sumar volumen sin quemarte.`);
            score += 10;
        }

        if (decouplingObj) {
            const drift = parseFloat(decouplingObj.value);
            if (drift > 10) {
                insights.push(`He detectado un desacople aeróbico alto (${drift}%). Tu pulso ha subido significativamente para mantener la misma potencia; esto sugiere fatiga acumulada, deshidratación o falta de adaptación al calor.`);
                score -= 15;
            } else if (drift > 5) {
                insights.push(`Desacople moderado (${drift}%). Hay algo de deriva cardiaca, normal en sesiones largas, pero indica que tu eficiencia aeróbica todavía tiene margen de mejora.`);
                score += 5;
            } else if (drift <= 5 && drift >= -5) {
                insights.push(`Eficiencia impecable. Tu pulso se ha mantenido estable respecto a la carga (${drift}%), lo que indica que tienes esta intensidad muy bien dominada.`);
                score += 25;
            }
        }

        if (primaryBenefit === "Umbral") {
            insights.push("El trabajo de hoy se ha centrado en el Umbral, clave para elevar tu potencia sostenible en esfuerzos de larga duración.");
        } else if (primaryBenefit === "VO2 Max") {
            insights.push("Has tocado el techo metabólico. Estas sesiones expanden tu capacidad de transporte de oxígeno y son las que más 'te hacen crecer'.");
        } else if (primaryBenefit === "Capacidad Anaeróbica") {
            insights.push("Sesión explosiva. Has trabajado la resistencia al lactato y la potencia neuromuscular.");
        } else if (primaryBenefit === "Base Aeróbica") {
            insights.push("Construcción de cimientos. Estás mejorando la capilarización y la eficiencia de las grasas como combustible.");
        }

        if (powerCurve && powerCurve.length > 0) {
            const best5m = powerCurve.find(p => p.label === '5m')?.value;
            if (best5m && best5m > npWatts * 1.1) {
                insights.push(`Destacable tu pico de 5 minutos (${best5m}w). Indica una buena capacidad de esfuerzo agudo por encima de tu media de hoy.`);
            }
        }

        const tss = activity.tss || 0;
        if (tss > 100) {
            nextStep = "Tras esta carga de +100 TSS, mañana es obligatorio un rodaje muy suave (Z1) o descanso total para no entrar en fatiga crónica.";
        } else if (tss > 50) {
            nextStep = "Carga moderada. Mañana puedes realizar un entrenamiento similar o de intensidad baja para seguir sumando.";
        } else {
            nextStep = "Sesión ligera. Estás listo para un bloque de intensidad mañana si el plan lo requiere.";
        }

        if (score >= 85) title = "Sesión de Máximo Rendimiento";
        else if (score >= 60) title = "Entrenamiento Productivo";
        else title = "Sesión de Rodaje / Mantenimiento";

        return { 
            title, 
            insights,
            description: insights.slice(0, 2).join(' '),
            conclusion: insights.slice(2).join(' ') + (nextStep ? `\n\nPróximo paso: ${nextStep}` : ''),
            score: Math.min(100, Math.max(0, score))
        };
    }, [trainingEffect, proMetrics, activity]);

    return {
        isPaceBased,
        exactZoneAnalysis,
        exactPacePowerZoneAnalysis,
        proMetrics,
        trainingEffect,
        chartData,
        maxHr,
        fitnessAnalysis
    };
};
