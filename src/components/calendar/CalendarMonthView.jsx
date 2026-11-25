/* eslint-disable no-unused-vars, no-empty */
import { Activity, Target, Plus } from 'lucide-react';
import React from 'react';
import { getSportCategory } from '../../utils/tssEngine';
import { getComplianceForDay, computeWeekStats, findWeekPmc, findPrevWeekPmc, getWeekNumber } from '../../utils/calendarEngine';
import { getSportIcon, WEEKDAYS, getZoneColor } from './calendarHelpers';
import { getSessionState } from '../../utils/calendarLoad';

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
                        <div data-cal="weekdays" className="hidden lg:grid grid-cols-[130px_repeat(7,1fr)] bg-surface-9 backdrop-blur-md border-b border-line-soft-5 sticky top-0 z-20">
                            <div className="py-2.5 border-r border-line-faint"></div>
                            {WEEKDAYS.map((day, i) => (
                                <div key={day} className={`py-2 text-center text-[10px] font-medium tracking-widest uppercase border-r border-line-faint last:border-r-0
                                    ${i >= 5 ? 'text-slate-400/80 dark:text-zinc-600' : 'text-ink-3-flat'}`}>{day}</div>
                            ))}
                        </div>

                        {/* CUERPO DEL CALENDARIO */}
                        <div className="pb-2">
                            {calendarGrid.map((week, wIdx) => {
                                const { weekRealizedTSS, weekPlannedTSS, weekDuration, weekDist } = computeWeekStats(week, activitiesByDate);
                                const weekKey = week[0].date.toLocaleDateString('en-CA');

                                // Get PMC values — actual or projected
                                const lastDayKey = week[6].date.toLocaleDateString('en-CA');
                                const weekPmc = findWeekPmc(week, fullPmcByDate);
                                const prevWeekPmc = findPrevWeekPmc(week, fullPmcByDate);
                                const ramp = weekPmc.ctl && prevWeekPmc.ctl ? (weekPmc.ctl - prevWeekPmc.ctl).toFixed(1) : null;
                                const isProjected = weekPmc.projected;

                                // Week number
                                const weekNum = getWeekNumber(week);


                                const formatDuration = (mins) => {
                                    const h = Math.floor(mins / 60);
                                    const m = mins % 60;
                                    return h > 0 ? `${h}h${m > 0 ? m + 'm' : ''}` : `${m}m`;
                                };

                                return (
                                    <div key={wIdx} data-cal="week" className="grid grid-cols-1 lg:grid-cols-[130px_repeat(7,1fr)] border-b border-line-soft-5 last:border-b-0">

                                        {/* Resumen semanal compacto: solo por debajo de 1024 px. */}
                                        <div data-cal="week-chip" className="lg:hidden">
                                            <span>S{weekNum}{isProjected ? ' · proy.' : ''}</span>
                                            <span>{Math.round(weekRealizedTSS)}/{Math.round(weekPlannedTSS)} TSS</span>
                                            <span>{formatDuration(weekDuration)}</span>
                                        </div>

                                        {/* ====== PANEL SEMANAL IZQUIERDO ====== */}
                                        <div data-cal="week-panel" className="hidden lg:flex flex-col border-r border-line-faint bg-transparent text-[10px] relative overflow-hidden">
                                            {/* Header with week number */}
                                            <div className="px-3 py-2.5 flex items-center justify-between">
                                                <span className="text-[11px] font-medium text-ink-4 flex items-center gap-1">
                                                    Semana {weekNum}
                                                    {isProjected && <span className="text-[8px] font-semibold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1 py-px rounded">PROY</span>}
                                                </span>
                                            </div>

                                            {/* Intervals.icu style PMC layout */}
                                            <div className="px-1.5 py-2 flex flex-col gap-0.5 flex-1 select-none">
                                                {/* Row 1: Aptitud & Duration */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] text-ink-3 w-9">Aptitud</span>
                                                        <span className="text-[11px] font-bold text-metric-ctl">{weekPmc.ctl != null ? Math.round(weekPmc.ctl) : '-'}</span>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-ink-2-soft">{formatDuration(weekDuration)}</span>
                                                </div>

                                                {/* Row 2: Fatiga & Carga */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] text-ink-3 w-9">Fatiga</span>
                                                        <span className="text-[11px] font-bold text-legacy-atl-purple-ink">{weekPmc.atl != null ? Math.round(weekPmc.atl) : '-'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[9px] text-ink-4">Carga</span>
                                                        <span className="text-[11px] font-bold text-ink-2-soft">{Math.round(weekRealizedTSS)}</span>
                                                    </div>
                                                </div>

                                                {/* Row 3: Forma & Ramp */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] text-ink-3 w-9">Forma</span>
                                                        {weekPmc.tcb != null ? (
                                                            <span className={`text-[11px] font-semibold ${weekPmc.tcb > 5 ? 'text-legacy-tsb-up' : weekPmc.tcb < -15 ? 'text-legacy-tsb-low' : 'text-body-soft-2'}`}>
                                                                {Math.round(weekPmc.tcb)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] font-medium text-slate-400">-</span>
                                                        )}
                                                    </div>
                                                    {ramp != null && (
                                                        <div className="flex items-center gap-0.5">
                                                            <span className="text-[9px] text-ink-4">Ramp</span>
                                                            <span className={`text-[10px] font-bold ${Number(ramp) > 0 ? 'text-legacy-tsb-up' : Number(ramp) < 0 ? 'text-danger-light' : 'text-slate-500'}`}>
                                                                {Number(ramp) > 0 ? '+' : ''}{ramp}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Row 4: Total KM */}
                                                {weekDist > 0 && (
                                                    <div className="flex items-center justify-between pt-0.5 border-t border-line-faint">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] text-ink-3 w-9">Dist.</span>
                                                            <span className="text-[11px] font-bold text-body">{(weekDist / 1000).toFixed(1)} km</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Target TSS */}
                                            <div
                                                className="mt-auto px-2.5 py-1 transition-colors border-t border-line-muted"
                                            >
                                                <div className="flex justify-between text-[9px]">
                                                    <span className="text-ink-4 font-semibold">Progreso Plan</span>
                                                    <span className="font-mono font-bold text-body-soft-2">
                                                        {Math.round(weekRealizedTSS)}/{Math.round(weekPlannedTSS)}
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-fill-7 rounded-full overflow-hidden mt-0.5">
                                                    <div className={`h-full rounded-full transition-all ${
                                                        Math.min((weekRealizedTSS / (weekPlannedTSS || 1)) * 100, 100) >= 90 ? 'bg-emerald-500' : 
                                                        Math.min((weekRealizedTSS / (weekPlannedTSS || 1)) * 100, 100) >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                        style={{ width: `${Math.min((weekRealizedTSS / (weekPlannedTSS || 1)) * 100, 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ====== 7 DÍAS ====== */}
                                        {week.map((day, dIdx) => {
                                            const dateKey = day.date.toLocaleDateString('en-CA');
                                            const acts = activitiesByDate[dateKey] || [];
                                            const isToday = new Date().toLocaleDateString('en-CA') === dateKey;
                                            const isWeekend = dIdx >= 5;

                                            const compliance = getComplianceForDay(dateKey, acts);

                                            const zoneBarColor = getZoneColor;

                                            return (
                                                <div key={dIdx}
                                                    onDragOver={(e) => handleDragOver(e, dateKey)}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={(e) => handleDrop(e, day.date)}
                                                    data-cal="day" data-today={isToday ? 'true' : undefined} data-load={loadLevels[dateKey]} className={`relative p-2 lg:p-2.5 border-r border-line-faint flex flex-col min-h-[72px] lg:h-[220px] overflow-y-auto custom-scrollbar transition-colors group/daycell
                                                        ${isToday ? 'bg-blue-50/10 dark:bg-blue-900/5' : 'bg-transparent'}
                                                        ${dragOverDate === dateKey ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-action-light ring-inset rounded-lg z-10' : ''}
                                                        ${!day.isCurrentMonth ? 'opacity-40' : 'opacity-100'}
                                                    `}>
                                                    {/* Day number + add button */}
                                                    <div className="flex justify-between items-start mb-2 shrink-0">
                                                        <div className="flex items-center gap-1.5 -ml-1 -mt-1">
                                                            <span className={`text-[13px] font-semibold leading-none flex items-center justify-center
                                                                ${isToday ? 'text-white bg-today w-7 h-7 rounded-full shadow-sm' : !day.isCurrentMonth ? 'text-faint' : 'text-ink-2-soft'}`}>
                                                                {day.date.getDate()}
                                                            </span>
                                                            <span className="lg:hidden text-[11px] font-medium text-ink-4 uppercase tracking-wide">
                                                                {WEEKDAYS[dIdx]}
                                                            </span>
                                                        </div>
                                                        <button onClick={(e) => handleOpenPlanModal(e, day.date)} data-cal="add" className="opacity-90 lg:opacity-0 group-hover/daycell:opacity-100 text-slate-400 hover:text-red-500 w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-full active:scale-90 transition-all touch-manipulation" title="Planificar sesión">
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Activity cards — Apple Style */}
                                                    <div className="flex-1 flex flex-col gap-1.5 w-full">
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

                                                            // Color mapping (Minimalist Apple style)
                                                            const sportColors = (() => {
                                                                const t = String(act.type).toLowerCase();
                                                                let accent = 'text-ink-3-flat';
                                                                let dot = 'bg-slate-400 dark:bg-zinc-600';
                                                                if (t.includes('run') || t.includes('carrera') || t.includes('correr')) { accent = 'text-legacy-sport-run-emerald'; dot = 'bg-legacy-sport-run-emerald'; }
                                                                if (t.includes('ride') || t.includes('bici') || t.includes('ciclismo')) { accent = 'text-sport-bike'; dot = 'bg-sport-bike'; }
                                                                if (t.includes('weight') || t.includes('fuerza') || t.includes('crossfit') || t.includes('workout')) { accent = 'text-legacy-sport-strength-orange'; dot = 'bg-legacy-sport-strength-orange'; }
                                                                if (t.includes('swim') || t.includes('nadar') || t.includes('natacion')) { accent = 'text-sport-swim'; dot = 'bg-sport-swim'; }
                                                                if (t.includes('yoga') || t.includes('stretch')) { accent = 'text-sport-yoga'; dot = 'bg-sport-yoga'; }
                                                                if (t.includes('walk') || t.includes('hike') || t.includes('caminata')) { accent = 'text-sport-walk'; dot = 'bg-sport-walk'; }
                                                                
                                                                return {
                                                                    accent, dot,
                                                                    // Sin token: se combina con `bg-white` más abajo y hoy gana `dark:` (ver tasks.md, PR 4).
                                                                    planned: 'bg-white dark:bg-zinc-900 border border-line-muted-3 ring-1 ring-line-soft',
                                                                    done: 'bg-slate-50/80 dark:bg-zinc-800/80 border border-line-2'
                                                                };
                                                            })();

                                                            const formatActDuration = (mins) => {
                                                                const h = Math.floor(mins / 60);
                                                                const m = mins % 60;
                                                                return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') + 'm' : ''}` : `${m}m`;
                                                            };

                                                            // Gather extra info
                                                            let extraInfo = [];
                                                            if (!act.isPlanned) {
                                                                if (act.distance > 0) extraInfo.push(`${(act.distance / 1000).toFixed(1)}km`);
                                                                if (act.np > 0) extraInfo.push(`${Math.round(act.np)}W NP`);
                                                                else if (act.averagePower > 0) extraInfo.push(`${Math.round(act.averagePower)}W`);
                                                                if (extraInfo.length < 3 && act.averageHeartRate > 0) extraInfo.push(`${Math.round(act.averageHeartRate)}bpm`);
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
                                                                if (planDist > 0) extraInfo.push(`${planDist.toFixed(1)}km`);
                                                            }

                                                            return (
                                                                <div
                                                                    key={`${act.isPlanned ? 'plan' : 'act'}-${act.id ?? i}`}
                                                                    data-cal="act" data-planned={act.isPlanned ? 'true' : undefined} data-state={getSessionState(act, { fulfilled: isFulfilled, dateKey })}
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
                                                                    className={`rounded-xl cursor-pointer w-full shrink-0 relative flex flex-col p-2.5 mb-1 group/act transition-all duration-200 ease-out min-h-[70px] justify-center
                                                                        ${act.isPlanned
                                                                            ? `${sportColors.planned} shadow-sm border-dashed hover:shadow-md cursor-grab active:cursor-grabbing opacity-100 bg-white`
                                                                            : `${sportColors.done} shadow-sm hover:shadow-md`
                                                                        }
                                                                        hover:scale-[1.02] hover:z-10
                                                                    `}
                                                                >
                                                                    {act.isPlanned ? (
                                                                        <>
                                                                            <div className="flex items-center gap-1.5 mb-1">
                                                                                <span className={`shrink-0 ${sportColors.accent}`}>{getSportIcon(act.type, 13)}</span>
                                                                                <span className="text-[11px] font-semibold tracking-tight leading-none text-body">{formatActDuration(act.duration || 0)}</span>
                                                                                {act.tss > 0 && <span className="ml-auto text-[9px] font-medium text-ink-4">{Math.round(act.tss)} TSS</span>}
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <span className="text-[11px] font-medium leading-tight truncate text-body-soft">
                                                                                    {act.name || act.type}
                                                                                </span>
                                                                                {extraInfo.length > 0 && (
                                                                                    <span className="text-[9px] font-semibold text-ink-4 flex gap-1.5">
                                                                                        {extraInfo.map((info, idx) => (
                                                                                            <span key={idx} className="bg-surface-2 px-1 py-0.5 rounded">{info}</span>
                                                                                        ))}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            {/* Zone interval bars */}
                                                                            {blocks.length > 0 && (
                                                                                <div className="flex items-end h-[8px] mt-2 gap-[1px] rounded-sm overflow-hidden">
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
                                                                            <div className="flex items-center gap-1.5 mb-1">
                                                                                <span className={`shrink-0 ${sportColors.accent}`}>{getSportIcon(act.type, 13)}</span>
                                                                                <span className="text-[11px] font-semibold tracking-tight leading-none text-ink-2-soft">{formatActDuration(act.duration || 0)}</span>
                                                                                {act.tss > 0 && <span className="ml-auto text-[9px] font-bold text-ink-3">{Math.round(act.tss)} TSS</span>}
                                                                                {isFulfilled && <span data-cal="check" className="ml-1 text-[9px] font-bold text-emerald-500" title="Plan completado">✓</span>}
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <span className="text-[11px] font-medium leading-tight truncate text-body">
                                                                                    {act.name || act.type}
                                                                                </span>
                                                                                {extraInfo.length > 0 && (
                                                                                    <span className="text-[9px] font-semibold text-ink-3 flex gap-1.5">
                                                                                        {extraInfo.map((info, idx) => (
                                                                                            <span key={idx} className="bg-slate-200/50 dark:bg-zinc-700/50 px-1 py-0.5 rounded">{info}</span>
                                                                                        ))}
                                                                                    </span>
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
