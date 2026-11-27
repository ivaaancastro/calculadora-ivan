/* eslint-disable no-unused-vars, no-empty */
import { Activity, Target, Plus } from 'lucide-react';
import React from 'react';
import { getSportCategory } from '../../utils/tssEngine';
import { getComplianceForDay, computeWeekStats, findWeekPmc, getWeekNumber } from '../../utils/calendarEngine';
import { WEEKDAYS, getZoneColor } from './calendarHelpers';
import { SportIcon } from '../common/SportIcon';
import { formatMinutes, formatNumber } from '../../utils/formatters';
import { toDateKey } from '../../utils/dates';
import { getSessionState, planProgress } from '../../utils/calendarLoad';
import { activityTypeLabel } from '../../utils/sport';

// Acento y punto de cada deporte en las fichas del mes (categoría de `getSportCategory`).
const PLAN_BAR = { high: 'bg-form-peak', mid: 'bg-action', low: 'bg-warning' };

const SPORT_ACCENT = {
    run: { accent: 'text-legacy-sport-run-emerald', dot: 'bg-legacy-sport-run-emerald' },
    ride: { accent: 'text-sport-bike', dot: 'bg-sport-bike' },
    strength: { accent: 'text-legacy-sport-strength-orange', dot: 'bg-legacy-sport-strength-orange' },
    swim: { accent: 'text-sport-swim', dot: 'bg-sport-swim' },
    yoga: { accent: 'text-sport-yoga', dot: 'bg-sport-yoga' },
    walk: { accent: 'text-sport-walk', dot: 'bg-sport-walk' },
    other: { accent: 'text-ink-3-flat', dot: 'bg-slate-400 dark:bg-zinc-600' },
};

/**
 * Piel del Calendario (Fase D5; Capa 6, RF-D8 «semana más ligera»): tinte de carga por día (color
 * de la serie TSS, 4 niveles suaves; hoy conserva el fondo hundido) y ficha de sesión plana, sin
 * sombra, cuyo borde dice su estado. En escritorio, planificadas y omitidas llevan además su
 * etiqueta abajo a la derecha. Las clases son definitivas: ya no compiten con la piel antigua,
 * así que no llevan `!important`.
 */
const LOAD_TINT = {
    1: 'bg-[rgb(var(--chart-tss)/0.035)]',
    2: 'bg-[rgb(var(--chart-tss)/0.06)]',
    3: 'bg-[rgb(var(--chart-tss)/0.09)]',
    4: 'bg-[rgb(var(--chart-tss)/0.13)]',
};
const ACT_BASE = 'relative w-full shrink-0 flex flex-col justify-center gap-1 rounded-lg border px-3 py-2.5 lg:px-2.5 lg:py-2 min-h-14 cursor-pointer text-left transition-paint duration-fast ease-forma hover:shadow-card';
const ACT_LABEL = 'lg:pb-6 lg:after:absolute lg:after:right-2.5 lg:after:bottom-1.5 lg:after:text-[11px] lg:after:font-semibold lg:after:tracking-[0.02em]';
const ACT_STATE = {
    planned: `bg-sunken border-dashed border-action/55 cursor-grab active:cursor-grabbing ${ACT_LABEL} lg:after:content-['Plan'] lg:after:text-action`,
    omitted: `bg-form-overload/[0.07] border-dashed border-form-overload/55 ${ACT_LABEL} lg:after:content-['Omitida'] lg:after:text-form-overload`,
    fulfilled: 'bg-surface border-form-peak/45',
    done: 'bg-surface border-line',
};

/** Cifra del resumen semanal: etiqueta pequeña encima, valor tabular debajo. */
const WeekFigure = ({ label, title, value, tone = 'text-ink-2-soft' }) => (
    <div className="min-w-0" title={title}>
        <div className="text-[11px] leading-4 text-ink-4">{label}</div>
        <div className={`text-[12px] leading-4 font-semibold tabular-nums ${tone}`}>{value}</div>
    </div>
);

export const CalendarMonthView = ({
    activitiesByDate,
    calendarGrid,
    loadLevels = {},
    dragOverDate,
    fullPmcByDate,
    handleDragLeave,
    handleDragOver,
    handleDragStart,
    handleDrop,
    handleOpenPlanModal,
    onSelectActivity,
    setViewingPlan,
}) => (
                <>
                    <div className="w-full relative">

                        {/* CABECERA DÍAS DE LA SEMANA */}
                        <div data-cal="weekdays" className="hidden lg:grid lg:grid-cols-[148px_repeat(7,minmax(0,1fr))] bg-surface-9 backdrop-blur-md border-b border-line-faint sticky top-0 z-20">
                            <div className="py-2.5 border-r border-line-faint"></div>
                            {WEEKDAYS.map((day, i) => (
                                <div key={day} className={`py-2 text-center text-2xs font-medium tracking-[0.08em] uppercase border-r border-line-faint last:border-r-0
                                    ${i >= 5 ? 'text-slate-400/80 dark:text-zinc-600' : 'text-ink-3-flat'}`}>{day}</div>
                            ))}
                        </div>

                        {/* CUERPO DEL CALENDARIO */}
                        <div className="pb-2">
                            {calendarGrid.map((week, wIdx) => {
                                const { weekRealizedTSS, weekPlannedTSS, weekDuration, weekDist } = computeWeekStats(week, activitiesByDate);
                                const weekKey = toDateKey(week[0].date);

                                // Estado de forma al cierre de la semana (real o proyectado).
                                const weekPmc = findWeekPmc(week, fullPmcByDate);
                                const ramp = weekPmc.ramp ?? null;
                                const isProjected = weekPmc.projected;
                                const progress = planProgress(weekRealizedTSS, weekPlannedTSS);

                                // Week number
                                const weekNum = getWeekNumber(week);


                                return (
                                    <div key={weekKey} data-cal="week" className="grid grid-cols-1 lg:grid-cols-[148px_repeat(7,minmax(0,1fr))] border-b border-line-faint last:border-b-0">

                                        {/* Resumen semanal compacto: solo por debajo de 1024 px. */}
                                        <div data-cal="week-chip" className="lg:hidden flex items-center justify-between gap-3 sticky top-[var(--nav-h)] z-[5] min-h-8 px-4 bg-sunken border-b border-line-faint text-[11px] font-medium text-ink-4 tabular-nums">
                                            <span className="font-semibold text-ink-3">Semana {weekNum}</span>
                                            <span>
                                                {weekRealizedTSS > 0
                                                    ? <>{progress.hasPlan ? `${progress.realized}/${progress.planned}` : progress.realized} TSS · {formatMinutes(weekDuration, { compact: true })}</>
                                                    : progress.hasPlan ? `${progress.planned} TSS planificados` : 'Sin plan'}
                                            </span>
                                        </div>

                                        {/* ====== PANEL SEMANAL IZQUIERDO ====== */}
                                        <div data-cal="week-panel" className="hidden lg:flex flex-col gap-3 px-3 py-3 border-r border-line-faint select-none">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[12px] font-medium text-ink-4">Semana {weekNum}</span>
                                                {isProjected && <span className="text-[11px] font-semibold text-action" title="Valores proyectados">Proy.</span>}
                                            </div>

                                            {/* Lo realizado: carga y tiempo, con la distancia como contexto. Sin sesiones no se pinta un «0». */}
                                            {(weekRealizedTSS > 0) && <div>
                                                <div className="text-[15px] leading-5 font-semibold tracking-[-0.01em] text-ink tabular-nums">
                                                    {Math.round(weekRealizedTSS)} <span className="text-[11px] font-medium text-ink-4">TSS</span>
                                                </div>
                                                <div className="mt-0.5 text-[12px] text-ink-3 tabular-nums">
                                                    {formatMinutes(weekDuration, { compact: true })}
                                                    {weekDist > 0 && <> · {formatNumber(weekDist / 1000, 1)} km</>}
                                                </div>
                                            </div>}

                                            {/* Estado de carga al cierre de la semana (Intervals.icu). */}
                                            {weekPmc.ctl != null && (
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    <WeekFigure label="Fitness" title="Fitness (CTL)" value={weekPmc.ctl} tone="text-metric-ctl-ink" />
                                                    <WeekFigure label="Fatiga" title="Fatiga (ATL)" value={weekPmc.atl} tone="text-metric-atl-ink" />
                                                    <WeekFigure label="Forma" title="Forma (TSB)" value={weekPmc.tsb} tone="text-metric-tsb-ink" />
                                                </div>
                                            )}
                                            {ramp != null && (
                                                <div className="text-[11px] text-ink-4 tabular-nums">
                                                    Rampa <span className="font-semibold text-ink-3">{ramp > 0 ? '+' : ''}{formatNumber(ramp, 1)}</span>
                                                </div>
                                            )}

                                            {/* Plan de la semana: barra si lo hay; si no, una nota discreta (BUG-9). */}
                                            <div className="mt-auto">
                                                {progress.hasPlan ? (
                                                    <>
                                                        <div className="flex justify-between text-[11px] text-ink-4">
                                                            <span>Plan</span>
                                                            <span data-cal="plan-progress" className="font-semibold text-ink-3 tabular-nums">{progress.realized}/{progress.planned}</span>
                                                        </div>
                                                        <div className="w-full h-1 bg-fill-7 rounded-full overflow-hidden mt-1">
                                                            <div className={`h-full rounded-full transition-paint ${PLAN_BAR[progress.level]}`} style={{ width: `${progress.pct}%` }} />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span data-cal="plan-progress" className="text-[11px] text-ink-4">Sin plan</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* ====== 7 DÍAS ====== */}
                                        {week.map((day, dIdx) => {
                                            const dateKey = toDateKey(day.date);
                                            const acts = activitiesByDate[dateKey] || [];
                                            const isToday = toDateKey(new Date()) === dateKey;
                                            const isWeekend = dIdx >= 5;

                                            const compliance = getComplianceForDay(dateKey, acts);

                                            const zoneBarColor = getZoneColor;

                                            return (
                                                <div key={dateKey}
                                                    onDragOver={(e) => handleDragOver(e, dateKey)}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={(e) => handleDrop(e, day.date)}
                                                    data-cal="day" data-today={isToday ? 'true' : undefined} data-load={loadLevels[dateKey]} className={`relative px-4 py-1.5 lg:p-2.5 lg:border-r border-line-faint lg:last:border-r-0 max-lg:border-b max-lg:last:border-b-0 flex flex-col min-h-[58px] lg:min-h-[168px] transition-colors group/daycell
                                                        ${isToday ? 'bg-sunken' : LOAD_TINT[loadLevels[dateKey]] ?? 'bg-transparent'}
                                                        ${dragOverDate === dateKey ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-action-light ring-inset rounded-lg z-10' : ''}
                                                        ${!day.isCurrentMonth ? 'opacity-40' : 'opacity-100'}
                                                    `}>
                                                    {/* Day number + add button */}
                                                    <div className="flex justify-between items-start mb-1 shrink-0">
                                                        <div className="flex items-center gap-1.5 -ml-1 -mt-1">
                                                            <span className={`text-[13px] font-semibold leading-none flex items-center justify-center
                                                                ${isToday ? 'text-white bg-action w-7 h-7 rounded-full shadow-none' : !day.isCurrentMonth ? 'text-faint' : 'text-ink-2-soft'}`}>
                                                                {day.date.getDate()}
                                                            </span>
                                                            <span className="lg:hidden text-[12px] font-medium text-ink-4 uppercase tracking-wide">
                                                                {WEEKDAYS[dIdx]}
                                                            </span>
                                                        </div>
                                                        <button type="button" aria-label="Planificar sesión" onClick={(e) => handleOpenPlanModal(e, day.date)} data-cal="add" className="opacity-90 lg:opacity-0 group-hover/daycell:opacity-100 focus-visible:opacity-100 text-ink-4 hover:text-action w-11 h-11 -mt-2 -mr-2 flex items-center justify-center rounded-full active:scale-press transition-paint touch-manipulation" title="Planificar sesión">
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Activity cards — Apple Style */}
                                                    <div className="flex-1 flex flex-col gap-1.5 w-full max-lg:pb-1.5">
                                                        {(() => {
                                                            // Smart matching: hide planned workouts that have a matching real activity
                                                            const realActs = acts.filter(a => !a.isPlanned);
                                                            const plannedActs = acts.filter(a => a.isPlanned);
                                                            const matchedPlanIds = new Set();
                                                            const matchedRealIdxs = new Set();

                                                            plannedActs.forEach(plan => {
                                                                const planCat = getSportCategory(plan.type);
                                                                const planDur = plan.duration || 0;
                                                                const matchIdx = realActs.findIndex((real, idx) => {
                                                                    if (matchedRealIdxs.has(idx)) return false;
                                                                    const realCat = getSportCategory(real.type || '');
                                                                    if (realCat !== planCat) return false;
                                                                    const realDur = real.duration || 0;
                                                                    if (planDur > 0 && realDur > 0) {
                                                                        const ratio = realDur / planDur;
                                                                        return ratio >= 0.4 && ratio <= 2.0;
                                                                    }
                                                                    return true;
                                                                });
                                                                if (matchIdx >= 0) {
                                                                    matchedPlanIds.add(plan.id);
                                                                    matchedRealIdxs.add(matchIdx);
                                                                }
                                                            });

                                                            // Filter: show real activities + unmatched plans only
                                                            const visibleActs = acts.filter(a => {
                                                                if (a.isPlanned && matchedPlanIds.has(a.id)) return false;
                                                                return true;
                                                            });
                                                            // Track which real activities fulfilled a plan
                                                            const fulfilledRealIds = new Set(
                                                                [...matchedRealIdxs].map(idx => realActs[idx]?.id).filter(Boolean)
                                                            );

                                                            return visibleActs.map((act, i) => {
                                                            const isFulfilled = !act.isPlanned && fulfilledRealIds.has(act.id);
                                                            let blocks = [];
                                                            if (act.isPlanned) {
                                                                try {
                                                                    const desc = typeof act.description === 'string' ? JSON.parse(act.description) : act.description;
                                                                    blocks = desc?.blocks || [];
                                                                } catch (e) { }
                                                            }

                                                            const sportColors = SPORT_ACCENT[getSportCategory(act.type || '')] || SPORT_ACCENT.other;
                                                            const state = getSessionState(act, { fulfilled: isFulfilled, dateKey });

                                                            // Gather extra info
                                                            let extraInfo = [];
                                                            if (!act.isPlanned) {
                                                                if (act.distance > 0) extraInfo.push(`${formatNumber(act.distance / 1000, 1)} km`);
                                                                if (act.np > 0) extraInfo.push(`${Math.round(act.np)} W NP`);
                                                                else if (act.averagePower > 0) extraInfo.push(`${Math.round(act.averagePower)} W`);
                                                                if (extraInfo.length < 3 && act.averageHeartRate > 0) extraInfo.push(`${Math.round(act.averageHeartRate)} ppm`);
                                                            } else {
                                                                let planDist = 0;
                                                                blocks.forEach(b => {
                                                                    if (b.type === 'repeat') {
                                                                        (b.steps || []).forEach(s => {
                                                                            if (s.unit === 'dist') planDist += (Number(s.duration) || 0) * (b.repeats || 1);
                                                                        });
                                                                    } else if (b.unit === 'dist') {
                                                                        planDist += Number(b.duration) || 0;
                                                                    }
                                                                });
                                                                if (planDist > 0) extraInfo.push(`${formatNumber(planDist, 1)} km`);
                                                            }

                                                            return (
                                                                <div
                                                                    key={`${act.isPlanned ? 'plan' : 'act'}-${act.id ?? i}`}
                                                                    data-cal="act" data-planned={act.isPlanned ? 'true' : undefined} data-state={state}
                                                                    draggable={act.isPlanned}
                                                                    onDragStart={(e) => act.isPlanned && handleDragStart(e, act)}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (act.isPlanned) {
                                                                            let descObj = { blocks: [] };
                                                                            try { descObj = JSON.parse(act.description) } catch (err) { }
                                                                            setViewingPlan({ ...act, descriptionObj: descObj });
                                                                        } else {
                                                                            if (onSelectActivity) onSelectActivity(act);
                                                                        }
                                                                    }}
                                                                    className={`group/act ${ACT_BASE} ${ACT_STATE[state]}`}
                                                                >
                                                                    {act.isPlanned ? (
                                                                        <>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className={`shrink-0 ${sportColors.accent}`}><SportIcon type={act.type} size={13} /></span>
                                                                                <span className="text-[12px] font-semibold leading-none text-body tabular-nums">{formatMinutes(act.duration, { compact: true })}</span>
                                                                                {act.tss > 0 && <span className="ml-auto text-[11px] font-medium text-ink-4 tabular-nums">{Math.round(act.tss)} TSS</span>}
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <span className="text-[12px] font-medium leading-tight truncate text-body-soft">
                                                                                    {act.name || activityTypeLabel(act.type)}
                                                                                </span>
                                                                                {extraInfo.length > 0 && (
                                                                                    <span className="font-mono text-[11px] text-ink-4 truncate">{extraInfo.join(' · ')}</span>
                                                                                )}
                                                                            </div>
                                                                            {/* Zone interval bars */}
                                                                            {blocks.length > 0 && (
                                                                                <div className="flex items-end h-[8px] mt-1 gap-[1px] rounded-sm overflow-hidden">
                                                                                    {(() => {
                                                                                        const zoneHeight = { Z1: '30%', Z2: '45%', Z3: '60%', Z4: '75%', Z5: '85%', Z6: '95%', Z7: '100%', R12: '38%', R23: '52%', R34: '68%' };
                                                                                        const allBars = [];
                                                                                        blocks.forEach((b, bi) => {
                                                                                            if (b.type === 'repeat') {
                                                                                                // Iterate repeats first, then steps: work-rest-work-rest pattern
                                                                                                for (let r = 0; r < (b.repeats || 1); r++) {
                                                                                                    (b.steps || []).forEach((s, si) => {
                                                                                                        allBars.push({ key: `${bi}-${r}-${si}`, zone: s.zone || 'Z2', duration: Number(s.duration) || 1 });
                                                                                                    });
                                                                                                }
                                                                                            } else {
                                                                                                allBars.push({ key: `${bi}`, zone: b.zone || 'Z2', duration: Number(b.duration) || 1 });
                                                                                            }
                                                                                        });
                                                                                        return allBars.map(bar => (
                                                                                            <div key={bar.key} className="rounded-[1px]" style={{ flex: bar.duration, height: zoneHeight[bar.zone] || '45%', backgroundColor: zoneBarColor(bar.zone), minWidth: '2px', opacity: 0.85 }} />
                                                                                        ));
                                                                                    })()}
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className={`shrink-0 ${sportColors.accent}`}><SportIcon type={act.type} size={13} /></span>
                                                                                <span className="text-[12px] font-semibold leading-none text-ink-2-soft tabular-nums">{formatMinutes(act.duration, { compact: true })}</span>
                                                                                {act.tss > 0 && <span className="ml-auto text-[11px] font-semibold text-ink-3 tabular-nums">{Math.round(act.tss)} TSS</span>}
                                                                                {isFulfilled && <span data-cal="check" className="text-[11px] font-bold text-form-peak bg-form-peak/[0.14] rounded-full px-1.5 py-px" title="Plan completado">✓</span>}
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <span className="text-[12px] font-medium leading-tight truncate text-body">
                                                                                    {act.name || activityTypeLabel(act.type)}
                                                                                </span>
                                                                                {extraInfo.length > 0 && (
                                                                                    <span className="font-mono text-[11px] text-ink-4 truncate">{extraInfo.join(' · ')}</span>
                                                                                )}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            );
                                                        });
                                                        })()}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
);
