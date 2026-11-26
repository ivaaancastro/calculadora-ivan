// Resumen del mes del Calendario (Fase Premium D5). Sin React ni red: reglas deterministas.
import { getSportCategory } from './tssEngine';
import { formatNumber } from './formatters';
import { toDateKey as key, toLocalDate } from './dates';

// Fechas en hora local: '2026-06-01' es el 1 de junio en cualquier huso (BUG-7).
const inMonth = (d, year, month) => {
    const x = toLocalDate(d);
    return x.getFullYear() === year && x.getMonth() === month;
};
const sessionsWord = (n) => (n === 1 ? 'sesión' : 'sesiones');
const tssOf = (list) => Math.round(list.reduce((s, a) => s + (a.tss > 0 ? a.tss : 0), 0));
const minutesOf = (list) => Math.round(list.reduce((s, a) => s + (a.duration > 0 ? a.duration : 0), 0));

/**
 * @returns {{sessions:number, planned:number, pending:number, done:number, tss:number, tssPrev:number,
 *   deltaPct:number|null, minutes:number, compliance:number|null, empty:boolean, sentence:string}}
 * `planned` = planificadas del mes con fecha <= hoy; `done` = las que tienen sesión real el mismo día y deporte;
 * `pending` = planificadas aún por venir.
 */
export const buildMonthSummary = ({ activities = [], plannedWorkouts = [], year, month, today = new Date() }) => {
    const real = (activities || []).filter((a) => !a.isPlanned);
    const cur = real.filter((a) => inMonth(a.date, year, month));
    const prevDate = new Date(year, month - 1, 1);
    // Mes en curso: se compara con los mismos días del mes anterior (D2), no con el mes completo.
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const prevLastDay = new Date(year, month, 0).getDate();
    const prevUpToDay = isCurrentMonth ? Math.min(today.getDate(), prevLastDay) : prevLastDay;
    const prev = real.filter((a) => inMonth(a.date, prevDate.getFullYear(), prevDate.getMonth())
        && toLocalDate(a.date).getDate() <= prevUpToDay);
    const todayKey = key(today);

    const plans = (plannedWorkouts || []).filter((p) => inMonth(p.date, year, month));
    const due = plans.filter((p) => key(p.date) <= todayKey);
    const pending = plans.length - due.length;
    const used = new Set();
    let done = 0;
    due.forEach((p) => {
        const cat = getSportCategory(p.type || '');
        const idx = cur.findIndex((a, i) => !used.has(i) && key(a.date) === key(p.date) && getSportCategory(a.type || '') === cat);
        if (idx >= 0) { used.add(idx); done += 1; }
    });

    const tss = tssOf(cur);
    const tssPrev = tssOf(prev);
    const deltaPct = tssPrev > 0 ? Math.round(((tss - tssPrev) / tssPrev) * 1000) / 10 : null;
    const compliance = due.length > 0 ? Math.round((done / due.length) * 100) : null;
    const minutes = minutesOf(cur);
    const empty = cur.length === 0 && plans.length === 0;

    let sentence;
    if (empty) {
        sentence = 'Sin sesiones este mes. Planifica una para empezar a ver tu constancia.';
    } else if (cur.length === 0) {
        sentence = `Aún no has registrado sesiones este mes; tienes ${plans.length} planificada${plans.length === 1 ? '' : 's'}.`;
    } else {
        const parts = [`Llevas ${cur.length} ${sessionsWord(cur.length)} y ${tss} TSS este mes`];
        const ref = isCurrentMonth ? 'en los mismos días del mes anterior' : 'el mes anterior';
        if (deltaPct != null && Math.abs(deltaPct) >= 2) parts[0] += `, un ${formatNumber(Math.abs(deltaPct), Number.isInteger(deltaPct) ? 0 : 1)} % ${deltaPct > 0 ? 'más' : 'menos'} que ${ref}`;
        sentence = parts[0] + '.';
        if (pending > 0) sentence += ` Te quedan ${pending} planificada${pending === 1 ? '' : 's'}.`;
        else if (compliance != null) sentence += ` Has cumplido el ${compliance} % del plan.`;
    }
    return { sessions: cur.length, comparedDays: isCurrentMonth ? prevUpToDay : null, planned: due.length, pending, done, tss, tssPrev, deltaPct, minutes, compliance, empty, sentence };
};
