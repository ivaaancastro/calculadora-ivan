import { Bike, Dumbbell, Activity, X, User, Waves } from 'lucide-react';
import React from 'react';
import { Modal } from '../ui';
import { getZoneColor } from './calendarHelpers';

// ── Workout Viewer Modal Component ──────────────────────────────────────────
export const WorkoutViewerModal = ({ workout, onClose, onDelete, onEdit }) => {

    // Build zone timeline data from blocks
    const blocks = workout.descriptionObj?.blocks || [];

    // Flatten all time segments — expand repeats individually so the pattern shows
    const segments = [];
    const addSeg = (zone, min, type) => { const m = Number(min) || 0; if (m > 0) segments.push({ zone, min: m, type: type || 'main' }); };
    blocks.forEach(b => {
        if (b.type === 'repeat') {
            const r = Number(b.repeats) || 1;
            for (let i = 0; i < r; i++) {
                (b.steps || []).forEach(s => {
                    if (s.unit !== 'dist') addSeg(s.zone || 'Z2', Number(s.duration) || 0, s.type === 'active' ? 'work' : 'rest');
                });
            }
        } else if (b.unit !== 'dist') {
            addSeg(b.zone || 'Z2', Number(b.duration) || 0, b.type);
        }
    });

    const totalMin = segments.reduce((s, x) => s + x.min, 0) || workout.duration || 1;

    // Zone totals for distribution
    const zoneTotals = {};
    segments.forEach(s => { zoneTotals[s.zone] = (zoneTotals[s.zone] || 0) + s.min; });
    const sortedZones = Object.entries(zoneTotals).sort(([a], [b]) => a.localeCompare(b));
    const maxZoneMin = Math.max(...Object.values(zoneTotals), 1);

    // Count total blocks
    const totalBlocks = blocks.length;
    const intervalBlocks = blocks.filter(b => b.type === 'repeat').length;
    
    // Intensity estimate from segments
    const zoneIntensity = { Z1: 0.5, Z2: 0.6, Z3: 0.75, Z4: 0.88, Z5: 0.95, Z6: 1.05, Z7: 1.15, R12: 0.55, R23: 0.68, R34: 0.82 };
    const weightedIF = segments.length > 0 
        ? segments.reduce((acc, s) => acc + (zoneIntensity[s.zone] || 0.6) * s.min, 0) / totalMin
        : 0;

    // Sport styling
    const sportConfig = {
        run: { label: 'Carrera', icon: <User size={18} />, gradient: 'from-sport-run to-sport-run-end', accent: 'text-sport-run', bg: 'bg-sport-run-tint-3' },
        bike: { label: 'Ciclismo', icon: <Bike size={18} />, gradient: 'from-sport-bike to-sport-bike-end', accent: 'text-sport-bike', bg: 'bg-sport-bike-tint-2' },
        swim: { label: 'Natación', icon: <Waves size={18} />, gradient: 'from-sport-swim to-sport-swim-end', accent: 'text-sport-swim', bg: 'bg-sport-swim-tint-2' },
        strength: { label: 'Fuerza', icon: <Dumbbell size={18} />, gradient: 'from-legacy-sport-strength-emerald to-legacy-sport-strength-emerald-end', accent: 'text-legacy-sport-strength-emerald', bg: 'bg-legacy-sport-strength-emerald-tint' },
    };
    const sport = sportConfig[workout.type] || { label: workout.type, icon: <Activity size={18} />, gradient: 'from-slate-500 to-slate-600', accent: 'text-slate-500', bg: 'bg-sunken-6' };

    const fmtDur = (m) => { const h = Math.floor(m / 60); const mm = Math.round(m % 60); return h > 0 ? `${h}h ${mm > 0 ? mm + 'm' : ''}` : `${mm}m`; };

    const blockLabel = (type) => {
        if (type === 'warmup') return { text: 'Calentamiento', icon: '↗' };
        if (type === 'cooldown') return { text: 'Vuelta a la calma', icon: '↘' };
        if (type === 'repeat') return { text: 'Intervalos', icon: '↻' };
        return { text: 'Bloque principal', icon: '→' };
    };

    return (
        <div className="flex flex-col max-h-full text-ink-2-soft relative">
            
            {/* ── HEADER ── */}
            <div className="relative px-6 pt-6 pb-5 shrink-0">
                <button onClick={onClose} data-cal="modal-close" className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-surface-2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors z-10">
                    <X size={14} />
                </button>

                <div className="flex items-start gap-4">
                    {/* Sport badge */}
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${sport.gradient} flex items-center justify-center text-white shadow-lg shadow-slate-200 dark:shadow-zinc-900/50 shrink-0`}>
                        {sport.icon}
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                        <h3 id="plan-viewer-title" className="text-[17px] font-bold text-slate-900 dark:text-zinc-50 leading-tight tracking-tight truncate">
                            {workout.name || `Entrenamiento de ${sport.label}`}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] font-medium text-ink-4">
                                {workout.date ? new Date(workout.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }) : ''}
                            </span>
                            <span className="text-[8px] text-faint">•</span>
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${sport.accent}`}>{sport.label}</span>
                        </div>
                    </div>
                </div>

                {/* ── METRICS GRID ── */}
                <div className="grid grid-cols-4 gap-2 mt-5">
                    <div className="bg-sunken rounded-xl px-3 py-2.5 text-center">
                        <div className="text-[9px] font-semibold text-ink-4 uppercase tracking-wider mb-0.5">TSS</div>
                        <div className="text-[18px] font-black text-ink-2 leading-none font-mono">{workout.tss || '—'}</div>
                    </div>
                    <div className="bg-sunken rounded-xl px-3 py-2.5 text-center">
                        <div className="text-[9px] font-semibold text-ink-4 uppercase tracking-wider mb-0.5">Duración</div>
                        <div className="text-[18px] font-black text-ink-2 leading-none font-mono">{fmtDur(workout.duration || 0)}</div>
                    </div>
                    <div className="bg-sunken rounded-xl px-3 py-2.5 text-center">
                        <div className="text-[9px] font-semibold text-ink-4 uppercase tracking-wider mb-0.5">IF</div>
                        <div className={`text-[18px] font-black leading-none font-mono ${weightedIF >= 0.85 ? 'text-red-500' : weightedIF >= 0.7 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {weightedIF > 0 ? weightedIF.toFixed(2) : '—'}
                        </div>
                    </div>
                    <div className="bg-sunken rounded-xl px-3 py-2.5 text-center">
                        <div className="text-[9px] font-semibold text-ink-4 uppercase tracking-wider mb-0.5">Bloques</div>
                        <div className="text-[18px] font-black text-ink-2 leading-none font-mono">
                            {totalBlocks}
                            {intervalBlocks > 0 && <span className="text-[10px] font-semibold text-ink-4 ml-0.5">({intervalBlocks}x)</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── ZONE TIMELINE STRIP ── */}
            {segments.length > 0 && (
                <div className="px-6 pb-4 shrink-0">
                    {/* Timeline bar — Apple Watch style */}
                    <div className="flex items-end h-[24px] gap-[1px] rounded-lg overflow-hidden bg-fill-5 p-[2px]">
                        {segments.map((s, i) => {
                            const zoneH = { Z1: '25%', Z2: '40%', Z3: '55%', Z4: '70%', Z5: '82%', Z6: '92%', Z7: '100%', R12: '32%', R23: '47%', R34: '62%' };
                            return (
                                <div key={i} className="rounded-[3px] transition-all hover:opacity-100" 
                                    title={`${s.zone} — ${s.min}m`}
                                    style={{ 
                                        flex: s.min / totalMin, 
                                        height: zoneH[s.zone] || '40%', 
                                        backgroundColor: getZoneColor(s.zone), 
                                        minWidth: '3px',
                                        opacity: s.type === 'rest' || s.type === 'recovery' ? 0.45 : 0.9,
                                    }} 
                                />
                            );
                        })}
                    </div>
                    {/* Time markers */}
                    <div className="flex justify-between mt-1.5 px-0.5">
                        <span className="text-[9px] font-mono text-ink-4-dim">0:00</span>
                        <span className="text-[9px] font-mono text-ink-4-dim">{fmtDur(totalMin)}</span>
                    </div>
                </div>
            )}

            {/* ── ZONE DISTRIBUTION + STRUCTURE ── */}
            <div className="flex flex-col flex-1 overflow-hidden min-h-0 border-t border-line-soft">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr] divide-y md:divide-y-0 md:divide-x divide-line-soft min-h-full">

                        {/* LEFT — Zone Distribution */}
                        <div className="p-5">
                            <h4 className="text-[10px] font-bold text-ink-4 uppercase tracking-widest mb-4">Zonas</h4>
                            {sortedZones.length > 0 ? (
                                <div className="space-y-2.5">
                                    {sortedZones.map(([zone, min]) => {
                                        const pct = Math.round((min / totalMin) * 100);
                                        return (
                                            <div key={zone} className="group">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900" style={{ background: getZoneColor(zone) }} />
                                                        <span className="text-[11px] font-bold text-body">{zone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-mono font-semibold text-ink-3">{Math.round(min)}m</span>
                                                        <span className="text-[9px] font-semibold text-ink-4 tabular-nums w-7 text-right">{pct}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(min / maxZoneMin) * 100}%`, background: getZoneColor(zone) }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-[11px] text-ink-4 italic">Sin datos de zonas</p>
                            )}
                        </div>

                        {/* RIGHT — Structure */}
                        <div className="p-5">
                            <h4 className="text-[10px] font-bold text-ink-4 uppercase tracking-widest mb-4">Estructura</h4>
                            {blocks.length === 0 ? (
                                <div className="flex items-center justify-center py-10">
                                    <p className="text-[12px] text-ink-4 italic">Sin estructura detallada</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {blocks?.map((block, idx) => {
                                        const bl = blockLabel(block.type);
                                        if (block.type === 'repeat') {
                                            // Interval total time
                                            const stepTotal = (block.steps || []).reduce((t, s) => t + (Number(s.duration) || 0), 0) * (block.repeats || 1);
                                            return (
                                                <div key={idx} className="rounded-xl bg-slate-50/80 dark:bg-zinc-800/30 overflow-hidden">
                                                    <div className="px-4 py-2.5 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] text-slate-400">{bl.icon}</span>
                                                            <span className="text-[11px] font-bold text-body">{bl.text}</span>
                                                            <span className="text-[10px] font-bold text-ink-3 bg-slate-200/70 dark:bg-zinc-700/50 px-1.5 py-0.5 rounded-md">x{block.repeats}</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono font-semibold text-slate-400">{stepTotal > 0 ? fmtDur(stepTotal) : ''}</span>
                                                    </div>
                                                    <div className="border-t border-line-soft">
                                                        {(block.steps || []).map((step, sIdx) => {
                                                            const isWork = step.type === 'active';
                                                            return (
                                                                <div key={sIdx} className={`flex items-center justify-between px-4 py-2 border-b last:border-0 ${isWork ? 'border-slate-100/50 dark:border-zinc-800/20' : 'border-slate-50 dark:border-zinc-800/10 bg-white/50 dark:bg-zinc-900/30'}`}>
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className="w-1 h-5 rounded-full" style={{ background: isWork ? (getZoneColor(step.zone)) : '#e2e8f0' }} />
                                                                        <div>
                                                                            <span className={`text-[11px] font-semibold ${isWork ? 'text-body-2' : 'text-ink-4'}`}>
                                                                                {isWork ? 'Trabajo' : 'Descanso'}
                                                                            </span>
                                                                            {step.details && <span className="text-[9px] text-slate-400 ml-1.5">· {step.details}</span>}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2.5 shrink-0">
                                                                        <span className="text-[12px] font-bold font-mono text-body-2">
                                                                            {step.duration}<span className="text-[9px] text-slate-400 ml-0.5">{step.unit === 'dist' ? 'km' : "'"}</span>
                                                                        </span>
                                                                        {step.targetType === 'power' && step.targetValue ? (
                                                                            <span className="text-[10px] font-mono font-bold text-power-ink bg-power-tint-3 px-2 py-0.5 rounded-full">{step.targetValue}w</span>
                                                                        ) : (
                                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: getZoneColor(step.zone) + '20', color: getZoneColor(step.zone) }}>{step.zone}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        // Normal Block
                                        return (
                                            <div key={idx} className="flex items-center justify-between py-2.5 px-1 group">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-1 h-5 rounded-full" style={{ background: getZoneColor(block.zone) }} />
                                                    <div>
                                                        <span className="text-[11px] font-bold text-body-2">{bl.text}</span>
                                                        {block.details && <span className="text-[9px] text-slate-400 ml-1.5">· {block.details}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5 shrink-0">
                                                    <span className="text-[14px] font-black font-mono text-body-2">
                                                        {block.duration}<span className="text-[10px] font-semibold text-slate-400 ml-0.5">{block.unit === 'dist' ? 'km' : "'"}</span>
                                                    </span>
                                                    {block.targetType === 'power' && block.targetValue ? (
                                                        <span className="text-[10px] font-mono font-bold text-power-ink bg-power-tint-3 px-2 py-0.5 rounded-full">{block.targetValue}w</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: getZoneColor(block.zone) + '20', color: getZoneColor(block.zone) }}>{block.zone}</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FOOTER ── */}
            <div className="px-6 py-3.5 border-t border-line-soft flex justify-between items-center shrink-0">
                <button onClick={(e) => { onDelete(e); onClose(); }} data-cal="modal-delete" className="text-[11px] font-medium text-danger-light-2 hover:text-danger-ink transition-colors">
                    Eliminar
                </button>
                <div className="flex gap-2">
                    <button onClick={onClose} data-cal="modal-secondary" className="px-4 py-2 rounded-full text-[11px] font-medium text-ink-3 hover:bg-surface-2 transition-colors">
                        Cerrar
                    </button>
                    <button onClick={() => { onClose(); onEdit(); }} data-cal="modal-submit" className="px-5 py-2 rounded-full text-[11px] font-semibold bg-inverse text-ink-inverse hover:bg-inverse-2 transition-colors shadow-sm">
                        Editar
                    </button>
                </div>
            </div>
        </div>
    );
};
