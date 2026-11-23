/**
 * Resumen narrativo y KPI del héroe de Rendimiento (v2).
 * Función pura sobre datos ya calculados. Spec: docs/branches/feat/premium-rendimiento/spec.md §3.2.
 */

const tone = (n, goodWhenPositive = true) => {
    if (n == null || n === 0) return 'neutral';
    return (n > 0) === goodWhenPositive ? 'up' : 'down';
};

export function buildStatsNarrative({ trainingStatus, hrv, ftpDiff, eFTP } = {}) {
    const sentences = [];
    const kpis = [];

    if (trainingStatus) {
        const tsb = Number(trainingStatus.tsb);
        sentences.push(`Tu estado de entreno es ${String(trainingStatus.status || '').toLowerCase()}.`);
        if (Number.isFinite(tsb)) {
            if (tsb > 10) sentences.push('Llegas fresco: buen momento para una sesión de calidad.');
            else if (tsb < -10) sentences.push('Arrastras fatiga: conviene priorizar la recuperación.');
            else sentences.push('Tu forma está equilibrada entre carga y descanso.');
        }
        kpis.push({
            id: 'load', label: 'Carga 7d', value: trainingStatus.load7, unit: '',
            context: 'Estrés acumulado de la semana', tone: 'neutral',
        });
        if (Number.isFinite(tsb)) {
            kpis.push({
                id: 'tsb', label: 'Forma (TSB)', value: `${tsb > 0 ? '+' : ''}${tsb}`, unit: '',
                context: tsb > 10 ? 'Fresco' : tsb < -10 ? 'Fatigado' : 'Equilibrado', tone: tone(tsb),
            });
        }
    }

    if (hrv && Number.isFinite(hrv.rmssd)) {
        const base = Number(hrv.baseline);
        const diff = Number.isFinite(base) ? hrv.rmssd - Math.round(base) : null;
        if (diff != null && diff !== 0) {
            sentences.push(`Tu VFC está ${diff > 0 ? 'por encima' : 'por debajo'} de tu línea base.`);
        }
        kpis.push({
            id: 'hrv', label: 'VFC', value: hrv.rmssd, unit: 'ms',
            context: diff == null ? (hrv.state || '') : `${diff > 0 ? '+' : ''}${diff} ms vs base`, tone: tone(diff),
        });
    }

    if (Number.isFinite(eFTP) && eFTP > 0) {
        const hasDiff = Number.isFinite(ftpDiff) && ftpDiff !== 0;
        if (hasDiff) {
            sentences.push(`Tu FTP estimado es ${Math.abs(ftpDiff)} W ${ftpDiff > 0 ? 'superior' : 'inferior'} al configurado.`);
        }
        kpis.push({
            id: 'eftp', label: 'eFTP', value: Math.round(eFTP), unit: 'W',
            context: hasDiff ? `${ftpDiff > 0 ? '+' : ''}${ftpDiff} W vs configurado` : 'En línea con tu FTP', tone: tone(hasDiff ? ftpDiff : 0),
        });
    }

    return { text: sentences.join(' '), kpis: kpis.slice(0, 4) };
}
