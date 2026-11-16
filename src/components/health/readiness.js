// Helper para calcular la recuperación de cualquier día
export const computeDayReadiness = (day, baselineRhr = 50) => {
    if (!day) return { score: '--', label: 'Sin datos', color: 'text-slate-400', dot: 'bg-slate-400', badge: 'bg-surface-2 text-body-soft' };

    let score = day.readiness;
    if (score == null) {
        let sHrv = 25;
        if (day.hrv && day.baselineBottom && day.baselineTop) {
            if (day.hrv >= day.baselineBottom && day.hrv <= day.baselineTop) sHrv = 45;
            else if (day.hrv > day.baselineTop) sHrv = 35;
            else sHrv = Math.round(45 * Math.max(0, day.hrv / day.baselineBottom));
        }
        let sSleep = 25;
        if (day.sleepScore) sSleep = (day.sleepScore / 100) * 35;
        else if (day.sleep) sSleep = Math.min(35, (day.sleep / 8) * 35);

        let sRhr = 15;
        if (day.rhr) {
            const diff = day.rhr - baselineRhr;
            if (diff <= 2) sRhr = 20;
            else if (diff <= 8) sRhr = 10;
            else sRhr = 0;
        }
        score = Math.max(5, Math.min(100, Math.round(sHrv + sSleep + sRhr)));
    } else {
        score = Math.round(score);
    }

    if (score >= 67) {
        return {
            score,
            label: 'Óptima',
            color: 'text-positive',
            dot: 'bg-positive',
            badge: 'bg-positive-tint-2 text-positive-ink border border-positive-edge-2'
        };
    }
    if (score >= 34) {
        return {
            score,
            label: 'Adaptándose',
            color: 'text-warning',
            dot: 'bg-warning',
            badge: 'bg-warning-tint text-warning-ink border border-warning-edge'
        };
    }
    return {
        score,
        label: 'Fatiga Alta',
        color: 'text-rose-500',
        dot: 'bg-rose-500',
        badge: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40'
    };
};
