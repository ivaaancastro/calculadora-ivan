import React, { useState, useMemo, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight, Calendar as CalIcon,
    Clock, Zap, MapPin, Footprints, Bike, Dumbbell, Activity, Target,
    Plus, X, RotateCcw, User, Waves
} from 'lucide-react';
import toast from 'react-hot-toast';

// FuelingPanel removed
import { formatDuration, formatBlockDuration } from '../../utils/formatDuration';
import {
    getSportCategory, SPORT_LOAD_CONFIG,
    getEffectiveTSS, computeZoneTssPerHour, estimateTssFromBlocks,
} from '../../utils/tssEngine';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Shared zone styling used in both planner and viewer
const zoneColors = {
    Z1: '#94a3b8', R12: '#60a5fa', Z2: '#3b82f6', R23: '#34d399',
    Z3: '#22c55e', Z4: '#eab308', Z5: '#f97316', Z6: '#ef4444',
};
const getZoneColor = (z) => zoneColors[z] || '#94a3b8';

// Compact HH:MM:SS input — stores value as decimal minutes, supports seconds for sprints
const DurationInput = ({ value, onChange, className = '' }) => {
    const totalSecs = Math.round((Number(value) || 0) * 60);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const commit = (newH, newM, newS) => {
        const clampH = Math.max(0, Math.min(23, Number(newH) || 0));
        const clampM = Math.max(0, Math.min(59, Number(newM) || 0));
        const clampS = Math.max(0, Math.min(59, Number(newS) || 0));
        onChange((clampH * 3600 + clampM * 60 + clampS) / 60);
    };
    const inCls = 'w-8 shrink-0 bg-transparent text-[13px] font-mono font-medium py-1 text-center outline-none text-slate-700 dark:text-zinc-300 no-spinner';
    const sep = <span className="text-slate-300 dark:text-zinc-600 text-[11px] font-semibold select-none">:</span>;
    return (
        <div className={`inline-flex shrink-0 items-center rounded-lg bg-slate-50 dark:bg-zinc-800/50 px-1.5 py-0.5 gap-0.5 ${className}`} title="HH:MM:SS">
            <input type="number" value={h} min={0} max={23}
                onChange={e => commit(e.target.value, m, s)}
                className={inCls} placeholder="0" />
            {sep}
            <input type="number" value={m} min={0} max={59}
                onChange={e => commit(h, e.target.value, s)}
                className={inCls} placeholder="00" />
            {sep}
            <input type="number" value={s} min={0} max={59}
                onChange={e => commit(h, m, e.target.value)}
                className={inCls} placeholder="00" />
        </div>
    );
};
// ── Floating draggable PMC projection chart ─────────────────────────────────
const PmcFloatingChart = ({ pmcByDate, onClose, initPos }) => {
    const initialWidth = Math.min(480, window.innerWidth - 32);
    const startX = Math.max(16, window.innerWidth / 2 - initialWidth / 2);
    const [pos, setPos] = React.useState({ x: startX, y: Math.max(50, window.innerHeight / 2 - 170) });
    const [hover, setHover] = React.useState(null); // { idx, x }
    const [viewOpts, setViewOpts] = React.useState({ top: true, mid: true, bot: true });
    const dragRef = React.useRef(null);

    const allEntries = Object.values(pmcByDate)
        .filter(e => e.ctl != null)
        .sort((a, b) => a.date.localeCompare(b.date));
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA');
    const cutoffPast = new Date(today); cutoffPast.setDate(today.getDate() - 30);
    const cutoffFuture = new Date(today); cutoffFuture.setDate(today.getDate() + 30);

    const visible = allEntries.filter(e => {
        const d = new Date(e.date + 'T00:00:00');
        return d >= cutoffPast && d <= cutoffFuture;
    });
    if (visible.length === 0) return null;

    const W = 640; const H = 340;
    const PAD = { t: 16, r: 40, b: 24, l: 40 };

    const cw = W - PAD.l - PAD.r;

    // Calculate values for scaling
    const ctlAtlVals = visible.flatMap(e => [e.ctl, e.atl].filter(v => v != null));
    const minTop = Math.max(0, Math.min(...ctlAtlVals) - 10);
    const maxTop = Math.max(...ctlAtlVals) + 10;
    const rangeTop = maxTop - minTop || 1;

    const tcbVals = visible.map(e => e.tcb).filter(v => v != null);
    const minMid = Math.min(...tcbVals, -25) - 5;
    const maxMid = Math.max(...tcbVals, 25) + 5;

    // Ramp rate approximation (daily ctl change * 7 for weekly ramp rate)
    // For smooth visual, we just plot the daily difference * 7 as "ramp"
    const visibleWithRamp = visible.map((e, i, arr) => {
        if (i === 0) return { ...e, ramp: 0 };
        const prev = arr[i - 1];
        return { ...e, ramp: ((e.ctl || 0) - (prev.ctl || 0)) * 7 };
    });

    const rampVals = visibleWithRamp.map(e => e.ramp).filter(v => v != null);
    const minBot = Math.min(...rampVals, -5) - 2;
    const maxBot = Math.max(...rampVals, 5) + 2;

    // Define Heights for the 3 sections: Top (50%), Middle (30%), Bottom (20%)
    const availH = H - PAD.t - PAD.b;
    const hTop = availH * 0.5;
    const hMid = availH * 0.3;
    const hBot = availH * 0.2;

    const yTopLine = PAD.t + hTop;
    const yMidLine = yTopLine + hMid;

    // Scales
    const xS = i => PAD.l + (i / (visible.length - 1 || 1)) * cw;
    const yTopS = v => PAD.t + hTop - ((v - minTop) / rangeTop) * hTop;
    const yMidS = v => yTopLine + hMid - ((v - minMid) / (maxMid - minMid || 1)) * hMid;
    const yBotS = v => yMidLine + hBot - ((v - minBot) / (maxBot - minBot || 1)) * hBot;

    const realE = visibleWithRamp.filter(e => !e.projected);
    const lastRealIdx = visibleWithRamp.findLastIndex(e => !e.projected);
    const projWithJoin = lastRealIdx >= 0
        ? [visibleWithRamp[lastRealIdx], ...visibleWithRamp.slice(lastRealIdx + 1).filter(e => e.projected)]
        : visibleWithRamp.filter(e => e.projected);
    const buildPath = (key, entries, scaleY) => entries.map((e, li) => {
        const i = visibleWithRamp.findIndex(v => v.date === e.date);
        return `${li === 0 ? 'M' : 'L'}${xS(i).toFixed(1)},${scaleY(e[key] ?? 0).toFixed(1)}`;
    }).join(' ');

    const buildRampPath = (entries) => entries.map((e, li) => {
        const i = visibleWithRamp.findIndex(v => v.date === e.date);
        const yH = yBotS(e.ramp ?? 0);
        // Step path for ramp rate
        if (li === 0) return `M${xS(i).toFixed(1)},${yH.toFixed(1)}`;
        const prevX = xS(i - 1).toFixed(1);
        return `L${prevX},${yH.toFixed(1)} L${xS(i).toFixed(1)},${yH.toFixed(1)}`;
    }).join(' ');

    const todayIdx = visibleWithRamp.findIndex(e => e.date === todayStr);
    const todayX = todayIdx >= 0 ? xS(todayIdx) : null;
    const zeroYMid = yMidS(0);
    const zeroYBot = yBotS(0);
    const labelStep = Math.max(1, Math.floor(visibleWithRamp.length / 7));
    const labels = visibleWithRamp.filter((_, i) => i % labelStep === 0);
    const lastReal = realE[realE.length - 1];

    const handleDragDown = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y };
    };
    const handleDragMove = (e) => {
        if (!dragRef.current) return;
        setPos({ x: e.clientX - dragRef.current.ox, y: e.clientY - dragRef.current.oy });
    };
    const handleDragUp = () => { dragRef.current = null; };

    const handleSvgMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const svgX = ((e.clientX - rect.left) / rect.width) * W;
        const relX = svgX - PAD.l;
        if (relX < 0 || relX > cw) { setHover(null); return; }
        const idx = Math.round((relX / cw) * (visible.length - 1));
        setHover({ idx: Math.max(0, Math.min(visible.length - 1, idx)), x: xS(Math.max(0, Math.min(visible.length - 1, idx))) });
    };

    const hoverEntry = hover != null ? visibleWithRamp[hover.idx] : null;

    return (
        <div className="fixed z-[100] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-visible select-none"
            style={{ left: pos.x, top: pos.y, width: Math.min(480, window.innerWidth - 32) }}>
            {/* Title / drag bar */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800 rounded-t-xl cursor-grab active:cursor-grabbing"
                onPointerDown={handleDragDown} onPointerMove={handleDragMove} onPointerUp={handleDragUp}>
                <div className="flex items-center gap-2">
                    <Activity size={12} className="text-violet-500" />
                    <span className="text-[10px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-widest">Proyección de Forma</span>
                </div>
                {lastReal && (
                    <div className="flex items-center gap-3 mr-2">
                        <span className="text-[9px] font-bold text-blue-500">CTL {Math.round(lastReal.ctl)}</span>
                        <span className="text-[9px] font-bold text-red-400">ATL {Math.round(lastReal.atl)}</span>
                        <span className={`text-[9px] font-bold ${lastReal.tcb >= 0 ? 'text-emerald-500' : 'text-orange-400'}`}>
                            TSB {lastReal.tcb >= 0 ? '+' : ''}{Math.round(lastReal.tcb)}
                        </span>
                    </div>
                )}
                <button onClick={onClose} className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded transition-colors">
                    <X size={13} />
                </button>
            </div>

            {/* Legend / Toolbar */}
            <div className="flex items-center gap-4 px-4 pt-2.5 text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-500 transition-colors">
                    <input type="checkbox" checked={viewOpts.top} onChange={e => setViewOpts(v => ({ ...v, top: e.target.checked }))} className="accent-blue-500 rounded-sm w-3 h-3" />
                    <span>Aptitud / Fatiga</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-500 transition-colors">
                    <input type="checkbox" checked={viewOpts.mid} onChange={e => setViewOpts(v => ({ ...v, mid: e.target.checked }))} className="accent-emerald-500 rounded-sm w-3 h-3" />
                    <span>Forma</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-amber-500 transition-colors">
                    <input type="checkbox" checked={viewOpts.bot} onChange={e => setViewOpts(v => ({ ...v, bot: e.target.checked }))} className="accent-amber-500 rounded-sm w-3 h-3" />
                    <span>Rampa</span>
                </label>
            </div>

            {/* Chart */}
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full cursor-crosshair" style={{ height: 340 }}
                onMouseMove={handleSvgMouseMove} onMouseLeave={() => setHover(null)}>

                <defs>
                    <linearGradient id="tcbGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#f87171" stopOpacity="0.2" />
                    </linearGradient>
                </defs>

                {/* Section Dividers */}
                <line x1={PAD.l} y1={yTopLine} x2={W - PAD.r} y2={yTopLine} stroke="#cbd5e1" strokeWidth="1" />
                <line x1={PAD.l} y1={yMidLine} x2={W - PAD.r} y2={yMidLine} stroke="#cbd5e1" strokeWidth="1" />

                {/* Y Axis Grid & Labels - TOP */}
                {[minTop, (minTop + maxTop) / 2, maxTop].map(v => (
                    <g key={`top-${v}`}>
                        <line x1={PAD.l} y1={yTopS(v)} x2={W - PAD.r} y2={yTopS(v)} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" />
                        <text x={PAD.l - 6} y={yTopS(v) + 3} textAnchor="end" fontSize={9} fill="#94a3b8">{Math.round(v)}</text>
                    </g>
                ))}

                {/* Y Axis Grid & Labels - MID */}
                <line x1={PAD.l} y1={zeroYMid} x2={W - PAD.r} y2={zeroYMid} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
                <rect x={PAD.l} y={yMidS(5)} width={cw} height={yMidS(-20) - yMidS(5)} fill="#f1f5f9" fillOpacity="0.5" />
                <rect x={PAD.l} y={yMidS(25)} width={cw} height={yMidS(5) - yMidS(25)} fill="#10b981" fillOpacity="0.05" />
                <rect x={PAD.l} y={yMidS(-10)} width={cw} height={yMidS(-30) - yMidS(-10)} fill="#f87171" fillOpacity="0.05" />
                {[20, 5, -10, -30].map(v => (
                    <text key={`mid-${v}`} x={PAD.l - 6} y={yMidS(v) + 3} textAnchor="end" fontSize={9} fill="#94a3b8">{v}</text>
                ))}

                {/* Y Axis Grid & Labels - BOT */}
                <line x1={PAD.l} y1={zeroYBot} x2={W - PAD.r} y2={zeroYBot} stroke="#cbd5e1" strokeWidth="1" />
                {[maxBot, 0, minBot].map(v => (
                    <text key={`bot-${v}`} x={PAD.l - 6} y={yBotS(v) + 3} textAnchor="end" fontSize={9} fill="#94a3b8">{v.toFixed(1)}</text>
                ))}

                {/* Today marker (Vertical Line across all sections) */}
                {todayX != null && <>
                    <line x1={todayX} y1={PAD.t} x2={todayX} y2={H - PAD.b} stroke="#475569" strokeWidth="1.2" />
                </>}

                {/* === TOP SECTION: CTL & ATL === */}
                <path d={buildPath('atl', realE, yTopS)} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinejoin="round" />
                <path d={buildPath('ctl', realE, yTopS)} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinejoin="round" />
                {projWithJoin.length > 1 && <>
                    <path d={buildPath('atl', projWithJoin, yTopS)} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" strokeLinejoin="round" />
                    <path d={buildPath('ctl', projWithJoin, yTopS)} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4,3" opacity="0.6" strokeLinejoin="round" />
                </>}

                {/* === MID SECTION: TCB (Forma) === */}
                <path d={buildPath('tcb', realE, yMidS)} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinejoin="round" />
                {projWithJoin.length > 1 && <>
                    <path d={buildPath('tcb', projWithJoin, yMidS)} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="4,3" opacity="0.6" strokeLinejoin="round" />
                </>}

                {/* === BOTTOM SECTION: Ramp Rate === */}
                <path d={buildRampPath(realE)} fill="none" stroke="#22c55e" strokeWidth="1.5" />
                {projWithJoin.length > 1 && <>
                    <path d={buildRampPath(projWithJoin)} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2,2" />
                </>}

                {/* Current latest values on right edge */}
                {lastReal && (
                    <g>
                        <text x={W - PAD.r + 6} y={yTopS(lastReal.ctl) + 3} fontSize={10} fontWeight="bold" fill="#0284c7">{Math.round(lastReal.ctl)}</text>
                        <text x={W - PAD.r + 6} y={yTopS(lastReal.atl) + 3} fontSize={10} fontWeight="bold" fill="#7c3aed">{Math.round(lastReal.atl)}</text>
                        <text x={W - PAD.r + 6} y={yMidS(lastReal.tcb) + 3} fontSize={10} fontWeight="bold" fill="#64748b">{Math.round(lastReal.tcb)}</text>
                        <text x={W - PAD.r + 6} y={yBotS(lastReal.ramp) + 3} fontSize={10} fontWeight="bold" fill="#16a34a">{lastReal.ramp.toFixed(1)}</text>
                    </g>
                )}

                {/* Hover crosshair */}
                {hover != null && <>
                    <line x1={hover.x} y1={PAD.t} x2={hover.x} y2={H - PAD.b} stroke="#94a3b8" strokeWidth="1" opacity="0.8" />
                    {hoverEntry?.ctl != null && <circle cx={hover.x} cy={yTopS(hoverEntry.ctl)} r={3.5} fill="#38bdf8" stroke="white" strokeWidth="1.5" />}
                    {hoverEntry?.atl != null && <circle cx={hover.x} cy={yTopS(hoverEntry.atl)} r={3.5} fill="#a78bfa" stroke="white" strokeWidth="1.5" />}
                    {hoverEntry?.tcb != null && <circle cx={hover.x} cy={yMidS(hoverEntry.tcb)} r={3.5} fill="#22c55e" stroke="white" strokeWidth="1.5" />}
                    {hoverEntry?.ramp != null && <circle cx={hover.x} cy={yBotS(hoverEntry.ramp)} r={2.5} fill="#16a34a" />}
                </>}

                {/* X axis Base Line */}
                <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="#cbd5e1" strokeWidth="1" />
                {labels.map((e, li) => {
                    const i = visibleWithRamp.findIndex(v => v.date === e.date);
                    const d = new Date(e.date + 'T00:00:00');
                    return <text key={li} x={xS(i)} y={H - PAD.b + 14} textAnchor="middle" fontSize={10} fill="#64748b">
                        {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </text>;
                })}
            </svg>

            {/* Hover tooltip */}
            {hoverEntry && (() => {
                const tooltipLeft = hover.x > W * 0.65;
                return (
                    <div className="absolute top-3 pointer-events-none bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg shadow-lg px-3 py-2 text-[10px] z-10 min-w-[130px]"
                        style={{ [tooltipLeft ? 'right' : 'left']: tooltipLeft ? 16 : 50 }}>
                        <p className="font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                            {new Date(hoverEntry.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {hoverEntry.projected && <span className="ml-1.5 text-[8px] font-normal text-violet-400 uppercase tracking-wide">proyectado</span>}
                        </p>
                        <div className="space-y-1">
                            <div className="flex justify-between gap-4">
                                <span className="text-sky-500 font-semibold">Aptitud (CTL)</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-zinc-200">{Math.round(hoverEntry.ctl)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-purple-400 font-semibold">Fatiga (ATL)</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-zinc-200">{Math.round(hoverEntry.atl)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className={`font-semibold ${hoverEntry.tcb >= 0 ? 'text-emerald-500' : 'text-orange-400'}`}>Forma (TSB)</span>
                                <span className={`font-mono font-bold ${hoverEntry.tcb >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500'}`}>
                                    {hoverEntry.tcb >= 0 ? '+' : ''}{Math.round(hoverEntry.tcb)}
                                </span>
                            </div>
                            <div className="flex justify-between gap-4 pt-1 border-t border-slate-100 dark:border-zinc-700 mt-1">
                                <span className="text-emerald-600 font-semibold">Rampa (est)</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-zinc-200">{hoverEntry.ramp.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

const getSportColor = (type) => {
    const t = String(type).toLowerCase();
    if (t.includes('run') || t.includes('carrera') || t.includes('correr')) return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/50 hover:bg-orange-200 dark:hover:bg-orange-900/40';
    if (t.includes('bike') || t.includes('bici') || t.includes('ciclismo')) return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/40';
    if (t.includes('swim') || t.includes('nadar')) return 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-900/50 hover:bg-cyan-200 dark:hover:bg-cyan-900/40';
    if (t.includes('gym') || t.includes('fuerza')) return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-900/40';
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700/50';
};

const getSportIcon = (type, size = 12) => {
    const t = String(type).toLowerCase();
    if (t.includes('run') || t.includes('carrera') || t.includes('correr')) return <Footprints size={size} />;
    if (t.includes('ride') || t.includes('bici') || t.includes('ciclismo')) return <Bike size={size} />;
    if (t.includes('weight') || t.includes('fuerza') || t.includes('crossfit') || t.includes('workout')) return <Dumbbell size={size} />;
    if (t.includes('swim') || t.includes('natacion') || t.includes('natación')) return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20c2-1 4-2 6-2s4 1 6 2 4 1 6 0" /><path d="M2 16c2-1 4-2 6-2s4 1 6 2 4 1 6 0" /><path d="M12 12a4 4 0 0 0 4-4V6l-2-2-4 4" /><circle cx="12" cy="4" r="1" /></svg>;
    if (t.includes('yoga') || t.includes('stretch')) return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="4" r="1.5" /><path d="M12 8v4l-3 4" /><path d="M12 12l3 4" /><path d="M8 20h8" /><path d="M6 12l6 2 6-2" /></svg>;
    if (t.includes('walk') || t.includes('hike') || t.includes('caminata') || t.includes('senderismo')) return <MapPin size={size} />;
    return <Activity size={size} />;
};

// --- ESTIMATED PACE PER ZONE (min/km for Run, min/10km for Ride) ---
const ZONE_PACE = {
    Run: { Z1: 7.0, R12: 6.5, Z2: 6.0, R23: 5.6, Z3: 5.2, Z4: 4.5, Z5: 3.8, Z6: 3.2 },
    Ride: { Z1: 3.0, R12: 2.75, Z2: 2.5, R23: 2.35, Z3: 2.2, Z4: 2.0, Z5: 1.7, Z6: 1.5 },
    Swim: { Z1: 3.0, R12: 2.75, Z2: 2.5, R23: 2.35, Z3: 2.2, Z4: 2.0, Z5: 1.7, Z6: 1.5 },
};

// --- WORKOUT TEMPLATES BY SPORT ---
const WORKOUT_TEMPLATES = {
    Run: [
        {
            name: 'Rodaje fácil', cat: 'BASE', tss: 40, duration: 45, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: '', unit: 'time' },
                { id: 2, type: 'main', duration: 8, zone: 'Z2', details: 'Ritmo cómodo conversacional', unit: 'dist' },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Series 4x1km', cat: 'INT', tss: 70, duration: 50, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z2', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 4, steps: [
                        { id: 1, type: 'active', duration: 1, zone: 'Z4', unit: 'dist' },
                        { id: 2, type: 'recovery', duration: 2, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Tempo 30\'', cat: 'UMBRAL', tss: 65, duration: 50, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z2', details: '', unit: 'time' },
                { id: 2, type: 'main', duration: 30, zone: 'Z3', details: 'Ritmo tempo sostenido', unit: 'time' },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Tirada larga', cat: 'FONDO', tss: 90, duration: 90, blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z1', details: '', unit: 'time' },
                { id: 2, type: 'main', duration: 15, zone: 'Z2', details: 'Ritmo constante aeróbico', unit: 'dist' },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Fartlek 6x500m', cat: 'MIXTO', tss: 55, duration: 40, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z2', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 6, steps: [
                        { id: 1, type: 'active', duration: 0.5, zone: 'Z4', unit: 'dist' },
                        { id: 2, type: 'recovery', duration: 0.5, zone: 'Z2', unit: 'dist' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 6, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
    ],
    Ride: [
        {
            name: 'Base aeróbica', cat: 'BASE', tss: 70, duration: 90, blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z1', details: '', unit: 'time' },
                { id: 2, type: 'main', duration: 65, zone: 'Z2', details: 'Pedaleo suave constante', unit: 'time' },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Sweet Spot 2x20', cat: 'SST', tss: 85, duration: 75, blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z2', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 2, steps: [
                        { id: 1, type: 'active', duration: 20, zone: 'Z3', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 5, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Intervalos VO2', cat: 'VO2', tss: 80, duration: 60, blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z2', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 5, steps: [
                        { id: 1, type: 'active', duration: 3, zone: 'Z5', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 3, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 15, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Recuperación', cat: 'REC', tss: 25, duration: 45, blocks: [
                { id: 1, type: 'main', duration: 45, zone: 'Z1', details: 'Pedaleo muy suave regenerativo', unit: 'time' }
            ]
        },
    ],
    WeightTraining: [
        {
            name: 'Tren inferior', cat: 'PIERNA', tss: 50, duration: 55, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 4, steps: [
                        { id: 1, type: 'active', duration: 8, zone: 'Z3', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 2, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Tren superior', cat: 'TORSO', tss: 45, duration: 50, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 4, steps: [
                        { id: 1, type: 'active', duration: 7, zone: 'Z3', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 2, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Full body', cat: 'FULL', tss: 60, duration: 60, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 3, steps: [
                        { id: 1, type: 'active', duration: 12, zone: 'Z3', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 3, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Core + estabilidad', cat: 'CORE', tss: 25, duration: 30, blocks: [
                { id: 1, type: 'warmup', duration: 5, zone: 'Z1', details: '', unit: 'time' },
                { id: 2, type: 'main', duration: 20, zone: 'Z2', details: 'Plancha, bird-dog, pallof press', unit: 'time' },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
    ],
    Swim: [
        {
            name: 'Técnica + base', cat: 'BASE', tss: 45, duration: 45, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: '', unit: 'time' },
                { id: 2, type: 'main', duration: 30, zone: 'Z2', details: 'Drills + nado continuo', unit: 'time' },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
    ],
};

export const CalendarPage = ({ activities, plannedWorkouts = [], addPlannedWorkout, deletePlannedWorkout, updatePlannedWorkout, currentMetrics, settings, chartData = [], onDelete, onSelectActivity }) => {

    const [currentDate, setCurrentDate] = useState(() => {
        const savedDate = sessionStorage.getItem('forma_calendar_date');
        if (savedDate) {
            const d = new Date(savedDate);
            if (!isNaN(d.getTime())) return d;
        }
        return new Date();
    });

    useEffect(() => {
        sessionStorage.setItem('forma_calendar_date', currentDate.toISOString());
    }, [currentDate]);

    const [weeklyTargets, setWeeklyTargets] = useState(() => {
        const saved = localStorage.getItem('planner_targets');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('planner_targets', JSON.stringify(weeklyTargets));
    }, [weeklyTargets]);

    const handleEditTarget = (weekKey) => {
        const current = weeklyTargets[weekKey] || 0;
        const newVal = prompt("Define el objetivo de TSS para esta semana:", current);
        if (newVal !== null) {
            const val = parseInt(newVal);
            if (!isNaN(val)) setWeeklyTargets(prev => ({ ...prev, [weekKey]: val }));
        }
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => setCurrentDate(new Date());

    // --- VIEW MODE ---


    // Current week for weekly view
    const currentWeekDays = useMemo(() => {
        const today = new Date(currentDate);
        const dow = today.getDay() || 7; // Monday = 1
        const monday = new Date(today);
        monday.setDate(today.getDate() - dow + 1);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    }, [currentDate]);

    const prevWeek = () => setCurrentDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; });
    const nextWeek = () => setCurrentDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; });

    // Using DB instead of localStorage for planned activities

    const [showPmcChart, setShowPmcChart] = useState(false);
    const [pmcPos, setPmcPos] = useState({ x: window.innerWidth - 380, y: 120 });
    const pmcDragRef = React.useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPastingString, setIsPastingString] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const [draggedBlockIdx, setDraggedBlockIdx] = useState(null);
    const [viewingPlan, setViewingPlan] = useState(null);
    const [editingPlanId, setEditingPlanId] = useState(null);
    const [selectedDateForPlan, setSelectedDateForPlan] = useState(null);
    const [newPlan, setNewPlan] = useState({
        type: 'Run',
        name: '',
        tss: 50,
        duration: 60,
        blocks: []
    });

    // --- LOCK BODY SCROLL WHEN MODAL/OVERLAY IS OPEN ---
    useEffect(() => {
        if (isModalOpen || viewingPlan) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isModalOpen, viewingPlan]);

    // --- DRAG & DROP STATE ---
    const [draggedWorkout, setDraggedWorkout] = useState(null);
    const [dragOverDate, setDragOverDate] = useState(null);

    const handleDragStart = (e, workout) => {
        setDraggedWorkout(workout);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', workout.id);
    };

    const handleDragOver = (e, dateKey) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverDate(dateKey);
    };

    const handleDragLeave = () => setDragOverDate(null);

    const handleDrop = async (e, targetDate) => {
        e.preventDefault();
        setDragOverDate(null);
        if (!draggedWorkout || !updatePlannedWorkout) return;
        const newDateStr = targetDate.toISOString();
        const oldDateKey = new Date(draggedWorkout.date).toLocaleDateString('en-CA');
        const newDateKey = targetDate.toLocaleDateString('en-CA');
        if (oldDateKey === newDateKey) { setDraggedWorkout(null); return; }
        try {
            await updatePlannedWorkout(draggedWorkout.id, { date: newDateStr });
        } catch (err) {
            console.error('Error moving workout:', err);
        }
        setDraggedWorkout(null);
    };

    // --- APPLY TEMPLATE ---
    const applyTemplate = (template) => {
        const stampBlocks = template.blocks.map(b => ({
            ...b,
            id: Date.now() + Math.random(),
            steps: b.steps ? b.steps.map(s => ({ ...s, id: Date.now() + Math.random() })) : undefined
        }));
        setNewPlan(prev => ({
            ...prev,
            name: template.name,
            tss: template.tss,
            duration: template.duration,
            blocks: stampBlocks
        }));
    };

    // --- TSS PER HOUR at each zone, dynamic per sport ---
    const ZONE_TSS_PER_HOUR = useMemo(() =>
        computeZoneTssPerHour(newPlan.type, settings)
        , [settings, newPlan.type]);

    // --- AUTO TSS ESTIMATION FROM BLOCKS ---
    const estimatedTSS = useMemo(() => {
        if (newPlan.blocks.length === 0) return null;
        return estimateTssFromBlocks(newPlan.blocks, newPlan.type, settings);
    }, [newPlan.blocks, newPlan.type, settings]);

    // Auto-update TSS and duration when blocks change
    useEffect(() => {
        if (estimatedTSS !== null) {
            const sportPace = ZONE_PACE[newPlan.type] || ZONE_PACE.Run;
            let totalMins = 0;
            newPlan.blocks.forEach(b => {
                if (b.type === 'repeat') {
                    b.steps.forEach(s => {
                        const mins = s.unit === 'dist'
                            ? (Number(s.duration) || 0) * (sportPace[s.zone] || 5)
                            : (Number(s.duration) || 0);
                        totalMins += mins * (b.repeats || 1);
                    });
                } else {
                    totalMins += b.unit === 'dist'
                        ? (Number(b.duration) || 0) * (sportPace[b.zone] || 5)
                        : (Number(b.duration) || 0);
                }
            });
            setNewPlan(prev => ({ ...prev, tss: estimatedTSS, duration: Math.round(totalMins) }));
        }
    }, [estimatedTSS]);

    // --- SMART COACH RECOMMENDATION ---
    const getSmartRecommendation = () => {
        if (!selectedDateForPlan) return null;
        const selectedDate = new Date(selectedDateForPlan);
        const today = new Date(); today.setHours(0, 0, 0, 0);

        // 1. Calcular carga de los últimos 7 días (actividades reales)
        let last7TSS = 0;
        let last7Count = 0;
        const sevenDaysAgo = new Date(selectedDate); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (activities) {
            activities.forEach(a => {
                const ad = new Date(a.date);
                if (ad >= sevenDaysAgo && ad < selectedDate && !a.isPlanned) {
                    last7TSS += getEffectiveTSS(a);
                    last7Count++;
                }
            });
        }

        // 2. Calcular carga planificada esta semana (lunes a domingo de la semana seleccionada)
        const dayOfWeek = selectedDate.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(selectedDate); weekStart.setDate(weekStart.getDate() + mondayOffset);
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);

        let weekActualTSS = 0;
        let weekPlannedTSS = 0;
        let plannedDays = new Set();
        let actualDays = new Set();

        if (activities) {
            activities.forEach(a => {
                const ad = new Date(a.date);
                if (ad >= weekStart && ad < weekEnd) {
                    weekActualTSS += getEffectiveTSS(a);
                    actualDays.add(ad.toLocaleDateString('en-CA'));
                }
            });
        }
        if (plannedWorkouts) {
            plannedWorkouts.forEach(p => {
                const pd = new Date(p.date);
                if (pd >= weekStart && pd < weekEnd && pd.toLocaleDateString('en-CA') !== selectedDate.toLocaleDateString('en-CA')) {
                    weekPlannedTSS += getEffectiveTSS(p);
                    plannedDays.add(pd.toLocaleDateString('en-CA'));
                }
            });
        }

        const totalWeekTSS = weekActualTSS + weekPlannedTSS;

        // 3. Calcular CTL/TSB desde currentMetrics o analytics
        const ctl = currentMetrics?.ctl || 0;
        const tsb = currentMetrics?.tsb || 0;
        const monotony = currentMetrics?.monotony || 0;

        // 4. Calcular target semanal ideal (CTL * 7 para mantener, + 10-20% para crecer)
        const weeklyMaintenance = Math.round(ctl * 7);
        const weeklyGrowth = Math.round(ctl * 7 * 1.1);
        const remainingBudget = Math.max(0, weeklyGrowth - totalWeekTSS);

        // 5. Ayer entrené?
        const yesterday = new Date(selectedDate); yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toLocaleDateString('en-CA');
        let yesterdayTSS = 0;
        if (activities) {
            activities.forEach(a => {
                if (new Date(a.date).toLocaleDateString('en-CA') === yesterdayKey) yesterdayTSS += getEffectiveTSS(a);
            });
        }

        // 6. Generar recomendación inteligente
        let type, intensity, tssRange, reason;

        if (tsb < -30) {
            type = '🛑 Descanso Total';
            intensity = 'rest';
            tssRange = [0, 0];
            reason = `TSB en ${Math.round(tsb)} — riesgo de sobreentrenamiento. Tu cuerpo necesita recuperarse.`;
        } else if (tsb < -15 || monotony > 2.0) {
            type = '🧘 Recovery / Z1';
            intensity = 'recovery';
            tssRange = [20, 40];
            reason = `Fatiga acumulada (TSB: ${Math.round(tsb)}). Un rodaje suave en Z1 facilitará la absorción del entrenamiento.`;
        } else if (yesterdayTSS > ctl * 1.3) {
            type = '🏃 Endurance / Z2';
            intensity = 'endurance';
            tssRange = [40, 60];
            reason = `Ayer cargaste fuerte (${Math.round(yesterdayTSS)} TSS). Hoy toca asimilar con aeróbico base.`;
        } else if (tsb > 5 && totalWeekTSS < weeklyMaintenance * 0.6) {
            type = '⚡ Intervalos / Tempo Z3-Z4';
            intensity = 'hard';
            tssRange = [80, 120];
            reason = `Estás fresco (TSB: +${Math.round(tsb)}) y la semana está descargada. Momento ideal para buscar adaptaciones.`;
        } else if (tsb >= -10 && tsb <= 5) {
            type = '🎯 Tempo / Progresivo Z2-Z3';
            intensity = 'moderate';
            tssRange = [50, 80];
            reason = `Form equilibrada. Un esfuerzo de intensidad media mantendrá tu progresión sin sobrecargar.`;
        } else {
            type = '🏃 Endurance / Z2';
            intensity = 'endurance';
            tssRange = [40, 70];
            reason = `Día estándar para acumular volumen aeróbico base.`;
        }

        return {
            type,
            intensity,
            tssRange,
            reason,
            weekContext: {
                actual: Math.round(weekActualTSS),
                planned: Math.round(weekPlannedTSS),
                target: weeklyGrowth,
                remaining: remainingBudget,
                daysTrainedOrPlanned: actualDays.size + plannedDays.size,
            },
            last7: { tss: Math.round(last7TSS), count: last7Count },
            tsb: Math.round(tsb),
        };
    };

    // --- BLOCK DRAG & DROP REORDERING ---
    const handleDragBlockStart = (e, idx) => {
        setDraggedBlockIdx(idx);
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDragBlockOver = (e, idx) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    const handleDropBlock = (e, idx) => {
        e.preventDefault();
        if (draggedBlockIdx === null || draggedBlockIdx === idx) return;
        setNewPlan(prev => {
            const newBlocks = [...prev.blocks];
            const [draggedItem] = newBlocks.splice(draggedBlockIdx, 1);
            newBlocks.splice(idx, 0, draggedItem);
            return { ...prev, blocks: newBlocks };
        });
        setDraggedBlockIdx(null);
    };
    const handleDragBlockEnd = () => {
        setDraggedBlockIdx(null);
    };

    const addBlock = (blockType) => {
        if (blockType === 'repeat') {
            const ts = Date.now();
            setNewPlan(prev => ({
                ...prev,
                blocks: [...prev.blocks, {
                    id: ts, type: 'repeat', repeats: 4,
                    steps: [
                        { id: ts + 1, type: 'active', unit: 'time', duration: 3, zone: 'Z4', targetType: 'none', targetValue: '', details: '' },
                        { id: ts + 2, type: 'recovery', unit: 'time', duration: 2, zone: 'Z1', targetType: 'none', targetValue: '', details: '' },
                    ]
                }]
            }));
        } else {
            setNewPlan(prev => ({
                ...prev,
                blocks: [...prev.blocks, { id: Date.now(), type: blockType, duration: 10, zone: 'Z2', details: '', unit: 'time', targetType: 'none', targetValue: '' }]
            }));
        }
    };

    const addStepToRepeat = (blockId, type) => {
        if (type === 'pair') {
            // Add work+rest pair
            const ts = Date.now();
            const workStep = { id: ts + 1, type: 'active', unit: 'time', duration: 3, zone: 'Z4', targetType: 'none', targetValue: '', details: '' };
            const restStep = { id: ts + 2, type: 'recovery', unit: 'time', duration: 2, zone: 'Z1', targetType: 'none', targetValue: '', details: '' };
            setNewPlan(prev => ({
                ...prev,
                blocks: prev.blocks.map(b => b.id === blockId ? {
                    ...b,
                    steps: [...b.steps, workStep, restStep]
                } : b)
            }));
        } else {
            const newStep = {
                id: Date.now() + Math.random(),
                type,
                unit: 'time',
                duration: type === 'active' ? 3 : 2,
                zone: type === 'active' ? 'Z4' : 'Z1',
                targetType: 'none',
                targetValue: '',
                details: ''
            };
            setNewPlan(prev => ({
                ...prev,
                blocks: prev.blocks.map(b => b.id === blockId ? {
                    ...b,
                    steps: [...b.steps, newStep]
                } : b)
            }));
        }
    };

    const updateStep = (blockId, stepId, field, value) => {
        setNewPlan(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === blockId ? {
                ...b,
                steps: b.steps.map(s => s.id === stepId ? { ...s, [field]: value } : s)
            } : b)
        }));
    };

    const removeStep = (blockId, stepId) => {
        setNewPlan(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === blockId ? {
                ...b,
                steps: b.steps.filter(s => s.id !== stepId)
            } : b)
        }));
    };

    // --- AI SMART PASTE PARSER ---
    const handleMagicPaste = () => {
        if (!pasteText.trim()) return;
        const lines = pasteText.split('\n').map(l => l.trim()).filter(Boolean);
        const newBlocks = [];
        let currentRepeat = null;

        lines.forEach((line) => {
            const lowerLine = line.toLowerCase();
            const id = Date.now() + Math.random();

            // Extract duration
            let duration = 0;
            let durationMatch = lowerLine.match(/^(\d+(?:\.\d+)?)(m|min|s|sec|h)\b/);
            if (durationMatch) {
                const val = parseFloat(durationMatch[1]);
                if (durationMatch[2] === 'm' || durationMatch[2] === 'min') duration = val;
                else if (durationMatch[2] === 's' || durationMatch[2] === 'sec') duration = val / 60;
                else if (durationMatch[2] === 'h') duration = val * 60;
            }

            // Extract Zone
            let zone = newPlan.type === 'WeightTraining' ? 'Z3' : 'Z2';
            let zoneMatch = lowerLine.match(/z([1-7])/);
            if (zoneMatch) zone = `Z${zoneMatch[1]}`;

            // Circuit Start ("4x")
            let repeatMatch = lowerLine.match(/^(\d+)\s*x\s*$/) || lowerLine.match(/^(\d+)\s*series\s*$/);
            if (repeatMatch) {
                currentRepeat = {
                    id, type: 'repeat', repeats: parseInt(repeatMatch[1]),
                    details: 'Circuito Auto-generado', steps: []
                };
                newBlocks.push(currentRepeat);
                return;
            }

            const isRecovery = lowerLine.includes('descanso') || lowerLine.includes('recu') || lowerLine.includes('pausa');

            if (currentRepeat) {
                if (lowerLine.includes('calent') || lowerLine.includes('warmup') || lowerLine.includes('movilidad') || lowerLine.includes('enfri') || lowerLine.includes('estirar') || lowerLine.includes('cooldown') || lowerLine.includes('vuelta a la calma')) {
                    currentRepeat = null;
                } else {
                    currentRepeat.steps.push({
                        id: Date.now() + Math.random(),
                        type: isRecovery ? 'recovery' : 'active',
                        duration: duration || (isRecovery ? 2 : 5),
                        unit: 'time',
                        zone: zoneMatch ? zone : (isRecovery ? 'Z1' : zone),
                        details: line.replace(/^(\d+(?:\.\d+)?)(m|min|s|sec|h)/i, '').trim(),
                        targetType: 'none',
                        targetValue: ''
                    });
                    return;
                }
            }

            // Warmup
            if (lowerLine.includes('calent') || lowerLine.includes('warmup') || lowerLine.includes('movilidad')) {
                newBlocks.push({ id, type: 'warmup', duration: duration || 10, unit: 'time', zone: zoneMatch ? zone : 'Z1', details: line, targetType: 'none', targetValue: '' });
            }
            // Cooldown
            else if (lowerLine.includes('enfri') || lowerLine.includes('estirar') || lowerLine.includes('cooldown') || lowerLine.includes('vuelta a la calma')) {
                newBlocks.push({ id, type: 'cooldown', duration: duration || 10, unit: 'time', zone: zoneMatch ? zone : 'Z1', details: line, targetType: 'none', targetValue: '' });
            }
            // Inline Repeat ("3x10 Press Banca")
            else if (lowerLine.match(/(\d+)\s*x/)) {
                const match = lowerLine.match(/(\d+)\s*x/);
                newBlocks.push({
                    id, type: 'repeat', repeats: match ? parseInt(match[1]) : 3, details: line,
                    steps: [{ id: Date.now() + Math.random(), type: 'active', duration: duration || 5, unit: 'time', zone: zoneMatch ? zone : (newPlan.type === 'WeightTraining' ? 'Z3' : 'Z4'), details: line.replace(/^(\d+)\s*x/i, '').trim(), targetType: 'none', targetValue: '' }]
                });
            }
            // Normal Working Set
            else {
                newBlocks.push({ id, type: 'main', duration: duration || 15, unit: 'time', zone: zone, details: line, targetType: 'none', targetValue: '' });
            }
        });

        if (newBlocks.length > 0) {
            setNewPlan(prev => ({ ...prev, blocks: [...prev.blocks, ...newBlocks] }));
        }
        setIsPastingString(false);
        setPasteText('');
    };

    const updateBlock = (id, field, value) => {
        setNewPlan(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === id ? { ...b, [field]: value } : b)
        }));
    };

    const removeBlock = (id) => {
        setNewPlan(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === id ? { ...b, isDeleted: true } : b).filter(b => !b.isDeleted)
        }));
    };

    const handleOpenPlanModal = (e, date) => {
        e.stopPropagation();
        setSelectedDateForPlan(date);
        setEditingPlanId(null);
        setNewPlan({ type: 'Run', name: '', tss: 50, duration: 60, blocks: [] });
        setIsModalOpen(true);
    };

    const handleEditPlan = (plan) => {
        let blocks = [];
        try {
            const desc = typeof plan.description === 'string' ? JSON.parse(plan.description) : plan.description;
            blocks = desc?.blocks || [];
        } catch (e) { }
        setSelectedDateForPlan(new Date(plan.date));
        setEditingPlanId(plan.id);
        setNewPlan({
            type: plan.type || 'Run',
            name: plan.name || '',
            tss: plan.tss || 50,
            duration: plan.duration || 60,
            blocks: blocks,
        });
        setViewingPlan(null);
        setIsModalOpen(true);
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSavePlan = async () => {
        if (!selectedDateForPlan) return;
        setIsSaving(true);
        try {
            const planData = {
                date: selectedDateForPlan.toISOString(),
                type: newPlan.type,
                name: newPlan.name || `Plan ${newPlan.type}`,
                tss: Number(newPlan.tss),
                duration: Number(newPlan.duration),
                description: JSON.stringify({ blocks: newPlan.blocks })
            };
            if (editingPlanId) {
                await updatePlannedWorkout(editingPlanId, planData);
            } else {
                await addPlannedWorkout(planData);
            }
            setIsModalOpen(false);
            setEditingPlanId(null);
            setNewPlan({ type: 'Run', name: '', tss: 50, duration: 60, blocks: [] });
        } catch (e) {
            toast.error("Error guardando plan: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePlan = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("¿Borrar entrenamiento planeado?")) {
            try {
                await deletePlannedWorkout(id);
                toast.success("Plan eliminado.");
            } catch (e) {
                toast.error("Error al borrar: " + e.message);
            }
        }
    };

    const activitiesByDate = useMemo(() => {
        const map = {};
        if (activities) {
            activities.forEach(act => {
                const dateKey = new Date(act.date).toLocaleDateString('en-CA');
                if (!map[dateKey]) map[dateKey] = [];
                map[dateKey].push({ ...act, isPlanned: false });
            });
        }
        if (plannedWorkouts) {
            plannedWorkouts.forEach(pAct => {
                const dateKey = new Date(pAct.date).toLocaleDateString('en-CA');
                if (!map[dateKey]) map[dateKey] = [];
                map[dateKey].push({ ...pAct, isPlanned: true });
            });
        }
        return map;
    }, [activities, plannedWorkouts]);

    const plannedByDate = useMemo(() => {
        const map = {};
        if (plannedWorkouts) {
            plannedWorkouts.forEach(p => {
                const dateKey = new Date(p.date).toLocaleDateString('en-CA');
                if (!map[dateKey]) map[dateKey] = [];
                map[dateKey].push(p);
            });
        }
        return map;
    }, [plannedWorkouts]);

    // --- PMC data indexed by date ---
    const pmcByDate = useMemo(() => {
        const map = {};
        (chartData || []).forEach(d => { map[d.date] = d; });
        return map;
    }, [chartData]);

    // --- Forward PMC projection using planned workouts ---
    const fullPmcByDate = useMemo(() => {
        const map = {};
        const today = new Date().toLocaleDateString('en-CA');

        // Copy only past/today actual data
        const sortedDates = Object.keys(pmcByDate).sort();
        sortedDates.forEach(dk => {
            if (dk <= today) map[dk] = pmcByDate[dk];
        });

        // Find the last actual PMC entry (up to today)
        const pastDates = sortedDates.filter(dk => dk <= today);
        if (pastDates.length === 0) return map;
        const lastDate = pastDates[pastDates.length - 1];
        const lastPmc = pmcByDate[lastDate];
        if (!lastPmc || lastPmc.ctl == null) return map;

        // Build a map of planned TSS per date
        const plannedTssByDate = {};
        (plannedWorkouts || []).forEach(p => {
            const dk = new Date(p.date).toLocaleDateString('en-CA');
            plannedTssByDate[dk] = (plannedTssByDate[dk] || 0) + getEffectiveTSS(p);
        });

        // Project forward day by day from today up to 90 days out
        let ctl = lastPmc.ctl;
        let atl = lastPmc.atl;
        const startDate = new Date(lastDate + 'T00:00:00');
        for (let i = 1; i <= 90; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dk = d.toLocaleDateString('en-CA');
            const dayTSS = plannedTssByDate[dk] || 0;
            ctl = ctl + (dayTSS - ctl) / 42;
            atl = atl + (dayTSS - atl) / 7;
            map[dk] = { date: dk, ctl, atl, tcb: ctl - atl, projected: true };
        }
        return map;
    }, [pmcByDate, plannedWorkouts]);

    // --- COMPLIANCE: Plan vs Execution ---
    const getComplianceForDay = (dateKey, acts) => {
        const planned = acts.filter(a => a.isPlanned);
        const real = acts.filter(a => !a.isPlanned);
        if (planned.length === 0) return null;
        const plannedTSS = planned.reduce((s, a) => s + (a.tss || 0), 0);
        const realTSS = real.reduce((s, a) => s + (a.tss || 0), 0);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const dayDate = new Date(dateKey + 'T00:00:00');
        if (dayDate > today) return { status: 'future', pct: 0, plannedTSS, realTSS };
        if (real.length === 0) return { status: 'missed', pct: 0, plannedTSS, realTSS };
        const pct = plannedTSS > 0 ? (realTSS / plannedTSS) * 100 : 100;
        if (pct >= 90) return { status: 'done', pct: Math.round(pct), plannedTSS, realTSS };
        if (pct >= 50) return { status: 'partial', pct: Math.round(pct), plannedTSS, realTSS };
        return { status: 'missed', pct: Math.round(pct), plannedTSS, realTSS };
    };

    const calendarGrid = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        let startDayOfWeek = firstDay.getDay();
        if (startDayOfWeek === 0) startDayOfWeek = 7;
        const daysInMonth = lastDay.getDate();
        const weeks = [];
        let currentWeek = [];

        for (let i = 1; i < startDayOfWeek; i++) {
            const d = new Date(year, month, 1 - (startDayOfWeek - i));
            currentWeek.push({ date: d, isCurrentMonth: false });
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            currentWeek.push({ date: date, isCurrentMonth: true });
            if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
        }

        if (currentWeek.length > 0) {
            let d = 1;
            while (currentWeek.length < 7) {
                const date = new Date(year, month + 1, d++);
                currentWeek.push({ date: date, isCurrentMonth: false });
            }
            weeks.push(currentWeek);
        }
        return weeks;
    }, [year, month]);

    return (
        <>
            <div className="flex flex-col bg-white dark:bg-zinc-950 rounded-3xl border border-slate-100 dark:border-zinc-800/50 overflow-hidden mb-6 shadow-sm">

                {/* HEADER */}
                <div className="flex items-center justify-between px-5 py-4 bg-transparent border-b border-slate-100 dark:border-zinc-800/30">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-semibold text-slate-800 dark:text-zinc-100 capitalize tracking-tight flex items-center">
                            {new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={goToday} className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-2 bg-slate-50 dark:bg-zinc-900 px-3 py-1.5 rounded-full">Hoy</button>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* PMC CHART TOGGLE */}
                        <button onClick={() => setShowPmcChart(p => !p)} className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors shadow-sm ${showPmcChart ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/50' : 'bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-slate-400'}`}>
                            <Activity size={12} /> Forma
                        </button>

                        <div className="flex items-center border border-slate-200 dark:border-zinc-700 rounded overflow-hidden ml-2">
                            <button onClick={prevMonth} className="p-1.5 sm:p-2 bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors"><ChevronLeft size={18} /></button>
                            <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700"></div>
                            <button onClick={nextMonth} className="p-1.5 sm:p-2 bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors"><ChevronRight size={18} /></button>
                        </div>
                    </div>
                </div>





                <>
                    <div className="w-full relative">

                        {/* CABECERA DÍAS DE LA SEMANA */}
                        <div className="hidden lg:grid grid-cols-[130px_repeat(7,1fr)] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-slate-100 dark:border-zinc-800/30 sticky top-0 z-20">
                            <div className="py-2.5 border-r border-slate-100/50 dark:border-zinc-800/30"></div>
                            {WEEKDAYS.map((day, i) => (
                                <div key={day} className={`py-2 text-center text-[10px] font-medium tracking-widest uppercase border-r border-slate-100/50 dark:border-zinc-800/30 last:border-r-0
                                    ${i >= 5 ? 'text-slate-400/80 dark:text-zinc-600' : 'text-slate-500 dark:text-zinc-500'}`}>{day}</div>
                            ))}
                        </div>

                        {/* CUERPO DEL CALENDARIO */}
                        <div className="pb-2">
                            {calendarGrid.map((week, wIdx) => {
                                let weekTSS = 0; let weekTSSRaw = 0; let weekDuration = 0; let weekDist = 0;
                                const weekKey = week[0].date.toLocaleDateString('en-CA');
                                const targetTSS = weeklyTargets[weekKey] || 0;

                                // Calculate per-week stats
                                week.forEach(day => {
                                    const dateKey = day.date.toLocaleDateString('en-CA');
                                    const acts = activitiesByDate[dateKey] || [];
                                    acts.forEach(a => {
                                        const cat = a.sportCategory || getSportCategory(a.type || '');
                                        const cfg = SPORT_LOAD_CONFIG[cat] || SPORT_LOAD_CONFIG.other;
                                        if (cfg.countsForWeekly) weekTSS += (a.tss || 0);
                                        weekTSSRaw += (a.tss || 0);
                                        weekDuration += (a.duration || 0);
                                        if (a.isPlanned) {
                                            let planDist = 0;
                                            try {
                                                const desc = typeof a.description === 'string' ? JSON.parse(a.description) : a.description;
                                                (desc?.blocks || []).forEach(b => {
                                                    if (b.type === 'repeat') {
                                                        (b.steps || []).forEach(s => {
                                                            if (s.unit === 'dist') planDist += (Number(s.duration) || 0) * (b.repeats || 1);
                                                        });
                                                    } else if (b.unit === 'dist') {
                                                        planDist += Number(b.duration) || 0;
                                                    }
                                                });
                                            } catch (e) { }
                                            weekDist += planDist * 1000;
                                        } else {
                                            weekDist += (a.distance || 0);
                                        }
                                    });
                                });

                                // Get PMC values — actual or projected
                                const lastDayKey = week[6].date.toLocaleDateString('en-CA');
                                const weekPmc = (() => {
                                    // Scan week days from last to first for PMC data
                                    for (let di = 6; di >= 0; di--) {
                                        const dk = week[di].date.toLocaleDateString('en-CA');
                                        if (fullPmcByDate[dk]) return fullPmcByDate[dk];
                                    }
                                    return {};
                                })();
                                const prevWeekPmc = (() => {
                                    const d = new Date(week[0].date);
                                    d.setDate(d.getDate() - 1);
                                    for (let i = 0; i < 7; i++) {
                                        const dk = d.toLocaleDateString('en-CA');
                                        if (fullPmcByDate[dk]) return fullPmcByDate[dk];
                                        d.setDate(d.getDate() - 1);
                                    }
                                    return {};
                                })();
                                const ramp = weekPmc.ctl && prevWeekPmc.ctl ? (weekPmc.ctl - prevWeekPmc.ctl).toFixed(1) : null;
                                const isProjected = weekPmc.projected;

                                // Week number
                                const weekNum = (() => {
                                    const d = new Date(week[3].date); // Thursday of the week
                                    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
                                    const yearStart = new Date(d.getFullYear(), 0, 1);
                                    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
                                })();

                                const formatDuration = (mins) => {
                                    const h = Math.floor(mins / 60);
                                    const m = mins % 60;
                                    return h > 0 ? `${h}h${m > 0 ? m + 'm' : ''}` : `${m}m`;
                                };

                                return (
                                    <div key={wIdx} className="grid grid-cols-1 lg:grid-cols-[130px_repeat(7,1fr)] border-b border-slate-100 dark:border-zinc-800/30 last:border-b-0">

                                        {/* ====== PANEL SEMANAL IZQUIERDO ====== */}
                                        <div className="hidden lg:flex flex-col border-r border-slate-100/50 dark:border-zinc-800/30 bg-transparent text-[10px] relative overflow-hidden">
                                            {/* Header with week number */}
                                            <div className="px-3 py-2.5 flex items-center justify-between">
                                                <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                                                    Semana {weekNum}
                                                    {isProjected && <span className="text-[8px] font-semibold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1 py-px rounded">PROY</span>}
                                                </span>
                                            </div>

                                            {/* Intervals.icu style PMC layout */}
                                            <div className="px-1.5 py-2 flex flex-col gap-0.5 flex-1 select-none">
                                                {/* Row 1: Aptitud & Duration */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 w-9">Aptitud</span>
                                                        <span className="text-[11px] font-bold text-blue-500">{weekPmc.ctl != null ? Math.round(weekPmc.ctl) : '-'}</span>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">{formatDuration(weekDuration)}</span>
                                                </div>

                                                {/* Row 2: Fatiga & Carga */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 w-9">Fatiga</span>
                                                        <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">{weekPmc.atl != null ? Math.round(weekPmc.atl) : '-'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[9px] text-slate-400 dark:text-zinc-500">Carga</span>
                                                        <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">{Math.round(weekTSS)}</span>
                                                    </div>
                                                </div>

                                                {/* Row 3: Forma & Ramp */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 w-9">Forma</span>
                                                        {weekPmc.tcb != null ? (
                                                            <span className={`text-[11px] font-semibold ${weekPmc.tcb > 5 ? 'text-emerald-500' : weekPmc.tcb < -15 ? 'text-red-500' : 'text-slate-600 dark:text-zinc-300'}`}>
                                                                {Math.round(weekPmc.tcb)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] font-medium text-slate-400">-</span>
                                                        )}
                                                    </div>
                                                    {ramp != null && (
                                                        <div className="flex items-center gap-0.5">
                                                            <span className="text-[9px] text-slate-400 dark:text-zinc-500">Ramp</span>
                                                            <span className={`text-[10px] font-bold ${Number(ramp) > 0 ? 'text-emerald-500' : Number(ramp) < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                                                {Number(ramp) > 0 ? '+' : ''}{ramp}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Row 4: Total KM */}
                                                {weekDist > 0 && (
                                                    <div className="flex items-center justify-between pt-0.5 border-t border-slate-100/50 dark:border-zinc-800/30">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 w-9">Dist.</span>
                                                            <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">{(weekDist / 1000).toFixed(1)} km</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Target TSS */}
                                            <div
                                                onClick={() => handleEditTarget(weekKey)}
                                                className="mt-auto cursor-pointer hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 px-2.5 py-1 transition-colors border-t border-slate-200/50 dark:border-zinc-800/50"
                                            >
                                                {targetTSS > 0 ? (
                                                    <div>
                                                        <div className="flex justify-between text-[9px]">
                                                            <span className="text-slate-400 dark:text-zinc-500 font-semibold">Objetivo</span>
                                                            <span className="font-mono font-bold text-slate-600 dark:text-zinc-300">{Math.round(weekTSS)}/{targetTSS}</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden mt-0.5">
                                                            <div className={`h-full rounded-full transition-all ${Math.min((weekTSS / targetTSS) * 100, 100) >= 90 ? 'bg-emerald-500' : Math.min((weekTSS / targetTSS) * 100, 100) >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                                style={{ width: `${Math.min((weekTSS / targetTSS) * 100, 100)}%` }}></div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] text-slate-400 dark:text-zinc-600 italic hover:text-blue-500 transition-colors">+ Objetivo</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* ====== 7 DÍAS ====== */}
                                        {week.map((day, dIdx) => {
                                            const dateKey = day.date.toLocaleDateString('en-CA');
                                            const acts = activitiesByDate[dateKey] || [];
                                            const isToday = new Date().toLocaleDateString('en-CA') === dateKey;
                                            const isWeekend = dIdx >= 5;

                                            const compliance = getComplianceForDay(dateKey, acts);

                                            // Zone color helper — intervals.icu palette
                                            const zoneBarColor = (zone) => {
                                                const colors = {
                                                    Z1: '#9e9e9e', Z2: '#4db8ff', Z3: '#50c878',
                                                    Z4: '#ffd700', Z5: '#ff8c00', Z6: '#ff4444', Z7: '#cc44ff',
                                                    R12: '#78b4e8', R23: '#6ec89b', R34: '#e8d56e'
                                                };
                                                return colors[zone] || '#9e9e9e';
                                            };

                                            return (
                                                <div key={dIdx}
                                                    onDragOver={(e) => handleDragOver(e, dateKey)}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={(e) => handleDrop(e, day.date)}
                                                    className={`relative p-2 lg:p-2.5 border-r border-slate-100/50 dark:border-zinc-800/30 flex flex-col h-[180px] lg:h-[220px] overflow-y-auto custom-scrollbar transition-colors group/daycell
                                                        ${isToday ? 'bg-blue-50/10 dark:bg-blue-900/5' : 'bg-transparent'}
                                                        ${dragOverDate === dateKey ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400 ring-inset rounded-lg z-10' : ''}
                                                        ${!day.isCurrentMonth ? 'opacity-40' : 'opacity-100'}
                                                    `}>
                                                    {/* Day number + add button */}
                                                    <div className="flex justify-between items-start mb-2 shrink-0">
                                                        <div className="flex items-center justify-center w-7 h-7 -ml-1 -mt-1">
                                                            <span className={`text-[13px] font-semibold leading-none flex items-center justify-center
                                                                ${isToday ? 'text-white bg-red-500 w-7 h-7 rounded-full shadow-sm' : !day.isCurrentMonth ? 'text-slate-300 dark:text-zinc-600' : 'text-slate-800 dark:text-zinc-200'}`}>
                                                                {day.date.getDate()}
                                                            </span>
                                                        </div>
                                                        <button onClick={(e) => handleOpenPlanModal(e, day.date)} className="opacity-0 group-hover/daycell:opacity-100 text-slate-400 hover:text-red-500 p-0.5 rounded-full transition-all">
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Activity cards — Apple Style */}
                                                    <div className="flex-1 flex flex-col gap-1.5 w-full">
                                                        {acts.map((act, i) => {
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
                                                                let accent = 'text-slate-500 dark:text-zinc-500';
                                                                let dot = 'bg-slate-400 dark:bg-zinc-600';
                                                                if (t.includes('run') || t.includes('carrera') || t.includes('correr')) { accent = 'text-emerald-500'; dot = 'bg-emerald-500'; }
                                                                if (t.includes('ride') || t.includes('bici') || t.includes('ciclismo')) { accent = 'text-blue-500'; dot = 'bg-blue-500'; }
                                                                if (t.includes('weight') || t.includes('fuerza') || t.includes('crossfit') || t.includes('workout')) { accent = 'text-orange-500'; dot = 'bg-orange-500'; }
                                                                if (t.includes('swim') || t.includes('nadar') || t.includes('natacion')) { accent = 'text-cyan-500'; dot = 'bg-cyan-500'; }
                                                                if (t.includes('yoga') || t.includes('stretch')) { accent = 'text-pink-500'; dot = 'bg-pink-500'; }
                                                                if (t.includes('walk') || t.includes('hike') || t.includes('caminata')) { accent = 'text-lime-500'; dot = 'bg-lime-500'; }
                                                                
                                                                return {
                                                                    accent, dot,
                                                                    planned: 'bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 ring-1 ring-slate-100 dark:ring-zinc-800/50',
                                                                    done: 'bg-slate-50/80 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700'
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
                                                                    key={i}
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
                                                                                <span className="text-[11px] font-semibold tracking-tight leading-none text-slate-700 dark:text-zinc-300">{formatActDuration(act.duration || 0)}</span>
                                                                                {act.tss > 0 && <span className="ml-auto text-[9px] font-medium text-slate-400 dark:text-zinc-500">{Math.round(act.tss)} TSS</span>}
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <span className="text-[11px] font-medium leading-tight truncate text-slate-600 dark:text-zinc-400">
                                                                                    {act.name || act.type}
                                                                                </span>
                                                                                {extraInfo.length > 0 && (
                                                                                    <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 flex gap-1.5">
                                                                                        {extraInfo.map((info, idx) => (
                                                                                            <span key={idx} className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{info}</span>
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
                                                                                <span className="text-[11px] font-semibold tracking-tight leading-none text-slate-800 dark:text-zinc-200">{formatActDuration(act.duration || 0)}</span>
                                                                                {act.tss > 0 && <span className="ml-auto text-[9px] font-bold text-slate-500 dark:text-zinc-400">{Math.round(act.tss)} TSS</span>}
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <span className="text-[11px] font-medium leading-tight truncate text-slate-700 dark:text-zinc-300">
                                                                                    {act.name || act.type}
                                                                                </span>
                                                                                {extraInfo.length > 0 && (
                                                                                    <span className="text-[9px] font-semibold text-slate-500 dark:text-zinc-400 flex gap-1.5">
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
                                                        })}
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



            </div>

            {/* MODAL PLANIFICADOR */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200/50 dark:border-zinc-800/50 flex flex-col max-h-[90vh]">
                        {/* HEADER */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 shrink-0">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-50 tracking-tight">
                                    {editingPlanId ? 'Editar Entrenamiento' : 'Planificar Entrenamiento'}
                                </h3>
                                <p className="text-[13px] text-slate-400 dark:text-zinc-500 mt-0.5">
                                    {selectedDateForPlan?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="shrink-0 ml-4 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={15} /></button>
                        </div>

                        <div className="px-6 py-5 overflow-y-auto flex-1 bg-white dark:bg-zinc-900 custom-scrollbar">
                            <div className="space-y-5">

                                {/* SPORT SELECTOR */}
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { key: 'Run', label: 'Carrera', icon: <Footprints size={13} /> },
                                        { key: 'Ride', label: 'Ciclismo', icon: <Bike size={13} /> },
                                        { key: 'Swim', label: 'Natación', icon: <Activity size={13} /> },
                                        { key: 'WeightTraining', label: 'Fuerza', icon: <Dumbbell size={13} /> },
                                        { key: 'Workout', label: 'Otro', icon: <Activity size={13} /> },
                                    ].map(s => (
                                        <button key={s.key} onClick={() => setNewPlan(prev => ({ ...prev, type: s.key, blocks: [] }))}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                                                ${newPlan.type === s.key
                                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                                                    : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}>
                                            {s.icon}<span>{s.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* TEMPLATES */}
                                {(WORKOUT_TEMPLATES[newPlan.type] || []).length > 0 && (
                                    <div className="flex gap-1.5 flex-wrap">
                                        {(WORKOUT_TEMPLATES[newPlan.type] || []).map((t, i) => (
                                            <button key={i} onClick={() => applyTemplate(t)}
                                                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200
                                                    ${newPlan.name === t.name
                                                        ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                                        : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50'}`}
                                            >
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* TITLE + METRICS */}
                                <div className="flex flex-col md:flex-row gap-3 items-start md:items-end w-full pt-1 border-t border-slate-100 dark:border-zinc-800/50">
                                    <div className="flex-1 w-full">
                                        <input type="text" value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                                            placeholder="Nombre del entrenamiento"
                                            className="w-full bg-transparent text-[15px] font-medium text-slate-800 dark:text-zinc-100 border-0 border-b border-slate-200 dark:border-zinc-800 px-0 py-2 outline-none focus:border-slate-400 dark:focus:border-zinc-600 transition-colors placeholder:text-slate-300 dark:placeholder:text-zinc-600"
                                        />
                                    </div>
                                    <div className="flex gap-4 shrink-0 pb-1">
                                        <div className="text-center">
                                            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">TSS</span>
                                            <span className="text-lg font-semibold text-slate-800 dark:text-zinc-200 font-mono">{newPlan.tss}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">Duración</span>
                                            <span className="text-lg font-semibold text-slate-800 dark:text-zinc-200 font-mono">{formatDuration(newPlan.duration)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* ESTRUCTURA */}
                                <div className="pt-1">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 gap-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-[13px] font-semibold text-slate-800 dark:text-zinc-200 tracking-tight">Estructura</h4>
                                            <button onClick={() => setIsPastingString(!isPastingString)} className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all duration-200 ${isPastingString ? 'bg-blue-500/10 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800'}`} title="Importar desde texto">
                                                Texto
                                            </button>
                                        </div>
                                        <div className="flex gap-1.5">
                                            {newPlan.type === 'WeightTraining' ? (<>
                                                <button onClick={() => addBlock('warmup')} className="px-2.5 py-1 text-slate-500 dark:text-zinc-400 rounded-full text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all">+ Calentar</button>
                                                <button onClick={() => addBlock('main')} className="px-2.5 py-1 text-slate-500 dark:text-zinc-400 rounded-full text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all">+ Ejercicio</button>
                                                <button onClick={() => addBlock('repeat')} className="px-2.5 py-1 bg-slate-900 dark:bg-white text-white dark:text-zinc-900 rounded-full text-[11px] font-medium hover:bg-slate-700 dark:hover:bg-zinc-200 transition-all shadow-sm">+ Circuito</button>
                                            </>) : (<>
                                                <button onClick={() => addBlock('warmup')} className="px-2.5 py-1 text-slate-500 dark:text-zinc-400 rounded-full text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all">+ Calentar</button>
                                                <button onClick={() => addBlock('main')} className="px-2.5 py-1 text-slate-500 dark:text-zinc-400 rounded-full text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all">+ Bloque</button>
                                                <button onClick={() => addBlock('repeat')} className="px-2.5 py-1 bg-slate-900 dark:bg-white text-white dark:text-zinc-900 rounded-full text-[11px] font-medium hover:bg-slate-700 dark:hover:bg-zinc-200 transition-all shadow-sm">+ Intervalos</button>
                                            </>)}
                                        </div>
                                    </div>

                                    {/* AI SMART PASTE AREA */}
                                    {isPastingString && (
                                        <div className="mb-4 p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/50">
                                            <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Importar desde texto</label>
                                            <textarea
                                                value={pasteText}
                                                onChange={e => setPasteText(e.target.value)}
                                                placeholder={`Pega el texto aquí línea a línea.\nEj:\no Calentamiento articular\no 4x8 Sentadillas Búlgaras\no 3x10 Press Banca`}
                                                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-slate-700 dark:text-zinc-300 resize-y min-h-[80px] outline-none focus:border-slate-400 dark:focus:border-zinc-600 mb-3 placeholder:text-slate-300 dark:placeholder:text-zinc-600"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setIsPastingString(false)} className="px-3 py-1.5 rounded-full text-[11px] font-medium text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-all">Cancelar</button>
                                                <button onClick={handleMagicPaste} disabled={!pasteText.trim()} className="px-4 py-1.5 rounded-full text-[11px] font-semibold bg-slate-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm">
                                                    Analizar e Insertar
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 mt-4">
                                        {newPlan.blocks.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-lg">
                                                <p className="text-slate-500 dark:text-zinc-400 text-sm">Entrenamiento vacío.</p>
                                                <p className="text-slate-400 dark:text-zinc-500 text-xs mt-1">Inserta filas usando los botones superiores.</p>
                                            </div>
                                        )}
                                        {newPlan.blocks.map((block, idx) => {
                                            const isStr = newPlan.type === 'WeightTraining';
                                            const canUsePower = newPlan.type === 'Ride';
                                            const ftp = settings?.bike?.ftp || 200;
                                            const POWER_ZONES_DEF = [
                                                { label: 'Rec', pMin: 0, pMax: 0.55 },
                                                { label: 'Endur', pMin: 0.56, pMax: 0.75 },
                                                { label: 'Tempo', pMin: 0.76, pMax: 0.90 },
                                                { label: 'Umbral', pMin: 0.91, pMax: 1.05 },
                                                { label: 'VO2', pMin: 1.06, pMax: 1.20 },
                                                { label: 'AnC', pMin: 1.21, pMax: 1.50 },
                                                { label: 'Neu', pMin: 1.51, pMax: 2.00 },
                                            ];
                                            // Sport-specific zone labels
                                            const sportKey = newPlan.type === 'Ride' ? 'bike' : newPlan.type === 'Swim' ? 'swim' : 'run';
                                            const sportZones = settings?.[sportKey]?.zones || settings?.run?.zones || [];
                                            const zoneLabels = ['Rec', 'Base', 'Tempo', 'Umbr', 'VO2', 'AnC', 'Neu'];
                                            const currentZoneMode = block.zoneMode || 'hr';
                                            const zones = isStr
                                                ? [{ v: 'Z1', l: 'Ligero' }, { v: 'Z2', l: 'Mod.' }, { v: 'Z3', l: 'Duro' }, { v: 'Z4', l: 'Máx.' }]
                                                : currentZoneMode === 'power' && canUsePower
                                                    ? [
                                                        ...POWER_ZONES_DEF.map((pz, i) => ({
                                                            v: `Z${i + 1}`,
                                                            l: `Z${i + 1} ${pz.label} ${Math.round(ftp * pz.pMin)}-${Math.round(ftp * pz.pMax)}w`,
                                                        })),
                                                        { v: 'R23', l: `Rampa Z2→Z3 ${Math.round(ftp * 0.65)}-${Math.round(ftp * 0.90)}w` },
                                                        { v: 'R34', l: `Rampa Z3→Z4 ${Math.round(ftp * 0.83)}-${Math.round(ftp * 1.05)}w` },
                                                    ]
                                                    : [
                                                        ...sportZones.map((z, i) => ({
                                                            v: `Z${i + 1}`,
                                                            l: `Z${i + 1} ${zoneLabels[i] || ''} ${z.min}-${z.max}bpm`,
                                                        })),
                                                        ...(sportZones.length >= 2 ? [
                                                            { v: 'R12', l: `Rampa Z1→Z2` },
                                                            { v: 'R23', l: `Rampa Z2→Z3` },
                                                        ] : []),
                                                    ];
                                            // Helper: toggle zone mode & auto-set target type
                                            const handleZoneModeChange = (mode) => {
                                                updateBlock(block.id, 'zoneMode', mode);
                                                if (mode === 'power') {
                                                    updateBlock(block.id, 'targetType', 'power');
                                                    const watts = getWattsForZone(block.zone || 'Z2');
                                                    updateBlock(block.id, 'targetValue', String(watts));
                                                } else {
                                                    updateBlock(block.id, 'targetType', 'none');
                                                    updateBlock(block.id, 'targetValue', '');
                                                }
                                            };
                                            // Helper: get midpoint watts for a zone or ramp
                                            const getWattsForZone = (zone) => {
                                                if (zone === 'R23') return Math.round(ftp * (0.65 + 0.90) / 2);
                                                if (zone === 'R34') return Math.round(ftp * (0.83 + 1.05) / 2);
                                                const zIdx = parseInt(zone.replace('Z', '')) - 1;
                                                const pz = POWER_ZONES_DEF[zIdx] || POWER_ZONES_DEF[1];
                                                return Math.round(ftp * (pz.pMin + pz.pMax) / 2);
                                            };
                                            // Helper: when zone changes in power mode, auto-update target watts
                                            const handleZoneChangeWithPower = (newZone, updateFn) => {
                                                updateFn('zone', newZone);
                                                if (currentZoneMode === 'power') {
                                                    updateFn('targetValue', String(getWattsForZone(newZone)));
                                                    updateFn('targetType', 'power');
                                                }
                                            };

                                            // REPEAT BLOCK
                                            if (block.type === 'repeat') {
                                                return (
                                                    <div key={block.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragBlockStart(e, idx)}
                                                        onDragOver={(e) => handleDragBlockOver(e, idx)}
                                                        onDrop={(e) => handleDropBlock(e, idx)}
                                                        onDragEnd={handleDragBlockEnd}
                                                        className={`rounded-xl bg-white dark:bg-zinc-950 overflow-hidden cursor-move transition-all border border-slate-100 dark:border-zinc-800/50 ${draggedBlockIdx === idx ? 'opacity-50' : 'hover:border-slate-200 dark:hover:border-zinc-700'}`}>
                                                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800/50">
                                                            <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Repetir</span>
                                                            <input type="number" value={block.repeats} min={1} onChange={e => updateBlock(block.id, 'repeats', parseInt(e.target.value) || 1)}
                                                                className="w-9 bg-white dark:bg-zinc-800 rounded-lg text-[13px] font-mono px-1.5 py-0.5 outline-none no-spinner text-center text-slate-700 dark:text-zinc-300" />
                                                            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">veces</span>
                                                            {canUsePower && !isStr && (
                                                                <div className="flex shrink-0 bg-slate-100 dark:bg-zinc-800/50 rounded-full p-0.5 ml-auto mr-2">
                                                                    <button onClick={() => handleZoneModeChange('hr')}
                                                                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-all duration-200 ${currentZoneMode === 'hr' ? 'bg-white dark:bg-zinc-700 text-red-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                                    >FC</button>
                                                                    <button onClick={() => handleZoneModeChange('power')}
                                                                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-all duration-200 ${currentZoneMode === 'power' ? 'bg-white dark:bg-zinc-700 text-amber-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                                    >W</button>
                                                                </div>
                                                            )}
                                                            <button onClick={() => removeBlock(block.id)} className={`${canUsePower && !isStr ? '' : 'ml-auto'} text-slate-300 hover:text-red-500 transition-colors`}><X size={13} /></button>
                                                        </div>
                                                        <div className="p-3 bg-white dark:bg-zinc-950">
                                                            <div className="space-y-3">
                                                                {block.steps.map((step, sIdx) => (
                                                                     <div key={step.id} className="flex flex-wrap items-center gap-2 relative">
                                                                        <select value={step.type} onChange={e => updateStep(block.id, step.id, 'type', e.target.value)}
                                                                            className={`w-20 shrink-0 bg-transparent ${step.type === 'active' ? 'text-slate-800 dark:text-zinc-200 font-semibold' : 'text-slate-400 dark:text-zinc-500'} text-[11px] outline-none cursor-pointer`}>
                                                                            <option value="active">{isStr ? 'Trabajar' : 'Activo'}</option>
                                                                            <option value="recovery">Pausa</option>
                                                                        </select>

                                                                        {/* KM/MIN toggle */}
                                                                        <div className="flex shrink-0 bg-slate-100 dark:bg-zinc-800/50 rounded-full p-0.5">
                                                                             {!isStr && (
                                                                                 <button onClick={() => updateStep(block.id, step.id, 'unit', 'dist')}
                                                                                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-all duration-200 ${step.unit === 'dist' ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                                                 >KM</button>
                                                                             )}
                                                                             <button onClick={() => updateStep(block.id, step.id, 'unit', 'time')}
                                                                                 className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-all duration-200 ${(step.unit === 'time' || isStr) ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                                             >MIN</button>
                                                                        </div>

                                                                        {step.unit === 'dist' && !isStr ? (
                                                                            <input type="number" value={step.duration} min={0} onChange={e => updateStep(block.id, step.id, 'duration', e.target.value)}
                                                                                className="w-12 shrink-0 bg-slate-50 dark:bg-zinc-800/50 text-[13px] font-mono px-2 py-1 rounded-lg outline-none no-spinner text-center text-slate-700 dark:text-zinc-300" />
                                                                        ) : (
                                                                            <DurationInput value={step.duration} onChange={v => updateStep(block.id, step.id, 'duration', v)} />
                                                                        )}

                                                                        {/* Zone selector */}
                                                                        <select value={step.zone} onChange={e => handleZoneChangeWithPower(e.target.value, (k, v) => updateStep(block.id, step.id, k, v))}
                                                                            className="shrink-0 bg-slate-50 dark:bg-zinc-800/50 text-[11px] font-medium text-slate-700 dark:text-zinc-300 px-2 py-1.5 rounded-lg outline-none cursor-pointer">
                                                                            {zones.map(z => <option key={z.v} value={z.v}>{z.l}</option>)}
                                                                        </select>

                                                                        {/* Target value display */}
                                                                        {currentZoneMode === 'power' && step.targetValue && (
                                                                            <span className="text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                                                                                {step.targetValue}w
                                                                            </span>
                                                                        )}
                                                                        {!isStr && currentZoneMode !== 'power' && (
                                                                            <div className="flex items-center gap-1">
                                                                                <select value={step.targetType || 'none'} onChange={e => { updateStep(block.id, step.id, 'targetType', e.target.value); if(e.target.value === 'none') updateStep(block.id, step.id, 'targetValue', ''); }}
                                                                                    className="bg-transparent text-[10px] text-slate-400 dark:text-zinc-500 px-1 py-0.5 outline-none cursor-pointer">
                                                                                    <option value="none">--</option>
                                                                                    <option value="power">W</option>
                                                                                    <option value="pace">/km</option>
                                                                                </select>
                                                                                {(step.targetType === 'power' || step.targetType === 'pace') && (
                                                                                    <input type={step.targetType === 'power' ? "number" : "text"} 
                                                                                        placeholder={step.targetType === 'power' ? "200" : "4:30"} 
                                                                                        value={step.targetValue || ''} 
                                                                                        onChange={e => updateStep(block.id, step.id, 'targetValue', e.target.value)}
                                                                                        className="w-12 shrink-0 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-[11px] px-1.5 py-0.5 outline-none no-spinner text-center text-slate-700 dark:text-zinc-300" 
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        <input type="text" value={step.details || ''} onChange={e => updateStep(block.id, step.id, 'details', e.target.value)}
                                                                            placeholder="Nota"
                                                                            className="flex-1 min-w-[60px] bg-transparent border-b border-dashed border-slate-200 dark:border-zinc-800 py-1 text-[11px] outline-none focus:border-slate-400 placeholder:text-slate-300 dark:placeholder:text-zinc-600" />
                                                                        
                                                                        <button onClick={() => removeStep(block.id, step.id)} className="text-slate-300 hover:text-red-500 ml-1 shrink-0 transition-colors"><X size={13}/></button>
                                                                    </div>
                                                                ))}
                                                                
                                                                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/50 mt-1">
                                                                    <button onClick={() => addStepToRepeat(block.id, 'pair')} className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300 font-medium transition-colors">+ Par Trabajo/Descanso</button>
                                                                    <span className="text-slate-200 dark:text-zinc-700">|</span>
                                                                    <button onClick={() => addStepToRepeat(block.id, 'active')} className="text-[10px] text-slate-400 hover:text-slate-600 font-medium transition-colors">+ Trabajo</button>
                                                                    <button onClick={() => addStepToRepeat(block.id, 'recovery')} className="text-[10px] text-slate-400 hover:text-slate-600 font-medium transition-colors">+ Descanso</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // NORMAL BLOCK (Warmup/Main/Cooldown)
                                            const bLabelStyle = block.type === 'warmup' ? 'text-orange-600' : block.type === 'cooldown' ? 'text-blue-600' : 'text-slate-700 dark:text-zinc-300';
                                            const bLabel = block.type === 'warmup' ? 'Calentar' : block.type === 'cooldown' ? 'Soltar' : 'Trabajar';

                                            return (
                                                <div key={block.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragBlockStart(e, idx)}
                                                    onDragOver={(e) => handleDragBlockOver(e, idx)}
                                                    onDrop={(e) => handleDropBlock(e, idx)}
                                                    onDragEnd={handleDragBlockEnd}
                                                    className={`py-2.5 px-3 flex flex-wrap items-center gap-2.5 bg-white dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/50 cursor-move transition-all ${draggedBlockIdx === idx ? 'opacity-50' : 'hover:border-slate-200 dark:hover:border-zinc-700'}`}>

                                                    <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                                                        <div className={`w-1 h-5 rounded-full shrink-0`} style={{ background: zoneColors[block.zone] || '#cbd5e1' }}></div>
                                                        <span className={`text-[11px] font-semibold w-14 shrink-0 ${bLabelStyle}`}>{bLabel}</span>
                                                        
                                                        {/* KM / MIN toggle */}
                                                        <div className="flex shrink-0 bg-slate-100 dark:bg-zinc-800/50 rounded-full p-0.5">
                                                            {!isStr && (
                                                                <button onClick={() => updateBlock(block.id, 'unit', 'dist')}
                                                                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-all duration-200 ${block.unit === 'dist' ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                                >KM</button>
                                                            )}
                                                            <button onClick={() => updateBlock(block.id, 'unit', 'time')}
                                                                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-all duration-200 ${(block.unit === 'time' || isStr) ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                            >MIN</button>
                                                        </div>

                                                        {block.unit === 'dist' && !isStr ? (
                                                            <input type="number" placeholder="km" value={block.duration} min={0} onChange={e => updateBlock(block.id, 'duration', e.target.value)}
                                                                className="w-12 shrink-0 bg-slate-50 dark:bg-zinc-800/50 text-[13px] font-mono px-2 py-1 rounded-lg outline-none no-spinner text-center text-slate-700 dark:text-zinc-300" />
                                                        ) : (
                                                            <DurationInput value={block.duration} onChange={v => updateBlock(block.id, 'duration', v)} />
                                                        )}

                                                        {/* FC / W mode toggle (only for bike) */}
                                                        {canUsePower && !isStr && (
                                                            <div className="flex shrink-0 bg-slate-100 dark:bg-zinc-800/50 rounded-full p-0.5">
                                                                <button onClick={() => handleZoneModeChange('hr')}
                                                                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-all duration-200 ${currentZoneMode === 'hr' ? 'bg-white dark:bg-zinc-700 text-red-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                                >FC</button>
                                                                <button onClick={() => handleZoneModeChange('power')}
                                                                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-all duration-200 ${currentZoneMode === 'power' ? 'bg-white dark:bg-zinc-700 text-amber-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                                >W</button>
                                                            </div>
                                                        )}

                                                        {/* Zone selector */}
                                                        <select value={block.zone} onChange={e => handleZoneChangeWithPower(e.target.value, (k, v) => updateBlock(block.id, k, v))}
                                                            className="shrink-0 bg-slate-50 dark:bg-zinc-800/50 text-[11px] font-medium text-slate-700 dark:text-zinc-300 px-2 py-1.5 rounded-lg outline-none cursor-pointer">
                                                            {zones.map(z => <option key={z.v} value={z.v}>{z.l}</option>)}
                                                        </select>

                                                        {/* Target value (auto for power, manual for pace) */}
                                                        {currentZoneMode === 'power' && block.targetValue && (
                                                            <span className="text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                                                                {block.targetValue}w
                                                                {ftp > 0 && <span className="text-[9px] text-amber-400 dark:text-amber-500 ml-1">{Math.round((Number(block.targetValue) / ftp) * 100)}%</span>}
                                                            </span>
                                                        )}
                                                        {!isStr && currentZoneMode !== 'power' && (
                                                            <div className="flex items-center gap-1">
                                                                <select value={block.targetType || 'none'} onChange={e => { updateBlock(block.id, 'targetType', e.target.value); if(e.target.value === 'none') updateBlock(block.id, 'targetValue', ''); }}
                                                                    className="bg-transparent text-[10px] text-slate-400 dark:text-zinc-500 px-1 py-0.5 outline-none cursor-pointer">
                                                                    <option value="none">--</option>
                                                                    <option value="power">W</option>
                                                                    <option value="pace">/km</option>
                                                                </select>
                                                                {(block.targetType === 'power' || block.targetType === 'pace') && (
                                                                    <input type={block.targetType === 'power' ? "number" : "text"} 
                                                                        placeholder={block.targetType === 'power' ? "200" : "4:30"} 
                                                                        value={block.targetValue || ''} 
                                                                        onChange={e => updateBlock(block.id, 'targetValue', e.target.value)}
                                                                        className="w-12 shrink-0 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-[11px] px-1.5 py-0.5 outline-none no-spinner text-center text-slate-700 dark:text-zinc-300" 
                                                                    />
                                                                )}
                                                            </div>
                                                        )}

                                                        <input type="text" value={block.details || ''} onChange={e => updateBlock(block.id, 'details', e.target.value)}
                                                            placeholder="Nota"
                                                            className="flex-1 min-w-[80px] bg-transparent border-b border-dashed border-slate-200 dark:border-zinc-800 py-1 text-[11px] outline-none focus:border-slate-400 dark:focus:border-zinc-600 placeholder:text-slate-300 dark:placeholder:text-zinc-600" />
                                                    </div>

                                                    <button onClick={() => removeBlock(block.id)} className="text-slate-300 hover:text-red-500 shrink-0 transition-colors"><X size={14} /></button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-zinc-800/50 flex justify-end items-center gap-2 shrink-0">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-full text-xs font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all">Cancelar</button>
                            <button onClick={handleSavePlan} disabled={isSaving} className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-zinc-900 hover:bg-slate-700 dark:hover:bg-zinc-200 disabled:opacity-50 transition-all shadow-sm">
                                {isSaving ? 'Guardando...' : editingPlanId ? 'Guardar' : 'Añadir'}
                            </button>
                        </div>
                    </div >
                </div >
            )}
            {/* MODAL VER ENTRENAMIENTO PLANEADO */}
            {viewingPlan && (
                <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 sm:p-8" onClick={() => setViewingPlan(null)} style={{ overscrollBehavior: 'contain' }}>
                    <div className="bg-white dark:bg-zinc-900 rounded-lg w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <WorkoutViewerModal
                            workout={viewingPlan}
                            onClose={() => setViewingPlan(null)}
                            onDelete={(e) => handleDeletePlan(e, viewingPlan.id)}
                            onEdit={() => handleEditPlan(viewingPlan)}
                        />
                    </div>
                </div>
            )}

            {/* FLOATING DRAGGABLE PMC CHART */}
            {
                showPmcChart && (
                    <PmcFloatingChart
                        pmcByDate={fullPmcByDate}
                        onClose={() => setShowPmcChart(false)}
                        initPos={pmcPos}
                    />
                )
            }

        </>
    );
};

// ── Workout Viewer Modal Component ──────────────────────────────────────────
const WorkoutViewerModal = ({ workout, onClose, onDelete, onEdit }) => {

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
        run: { label: 'Carrera', icon: <User size={18} />, gradient: 'from-orange-500 to-red-500', accent: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
        bike: { label: 'Ciclismo', icon: <Bike size={18} />, gradient: 'from-blue-500 to-indigo-500', accent: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
        swim: { label: 'Natación', icon: <Waves size={18} />, gradient: 'from-cyan-500 to-teal-500', accent: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
        strength: { label: 'Fuerza', icon: <Dumbbell size={18} />, gradient: 'from-emerald-500 to-green-500', accent: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    };
    const sport = sportConfig[workout.type] || { label: workout.type, icon: <Activity size={18} />, gradient: 'from-slate-500 to-slate-600', accent: 'text-slate-500', bg: 'bg-slate-50 dark:bg-zinc-900' };

    const fmtDur = (m) => { const h = Math.floor(m / 60); const mm = Math.round(m % 60); return h > 0 ? `${h}h ${mm > 0 ? mm + 'm' : ''}` : `${mm}m`; };

    const blockLabel = (type) => {
        if (type === 'warmup') return { text: 'Calentamiento', icon: '↗' };
        if (type === 'cooldown') return { text: 'Vuelta a la calma', icon: '↘' };
        if (type === 'repeat') return { text: 'Intervalos', icon: '↻' };
        return { text: 'Bloque principal', icon: '→' };
    };

    return (
        <div className="flex flex-col max-h-full text-slate-800 dark:text-zinc-200 relative">
            
            {/* ── HEADER ── */}
            <div className="relative px-6 pt-6 pb-5 shrink-0">
                <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors z-10">
                    <X size={14} />
                </button>

                <div className="flex items-start gap-4">
                    {/* Sport badge */}
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${sport.gradient} flex items-center justify-center text-white shadow-lg shadow-slate-200 dark:shadow-zinc-900/50 shrink-0`}>
                        {sport.icon}
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                        <h3 className="text-[17px] font-bold text-slate-900 dark:text-zinc-50 leading-tight tracking-tight truncate">
                            {workout.name || `Entrenamiento de ${sport.label}`}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                                {workout.date ? new Date(workout.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }) : ''}
                            </span>
                            <span className="text-[8px] text-slate-300 dark:text-zinc-600">•</span>
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${sport.accent}`}>{sport.label}</span>
                        </div>
                    </div>
                </div>

                {/* ── METRICS GRID ── */}
                <div className="grid grid-cols-4 gap-2 mt-5">
                    <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5 text-center">
                        <div className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">TSS</div>
                        <div className="text-[18px] font-black text-slate-800 dark:text-zinc-100 leading-none font-mono">{workout.tss || '—'}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5 text-center">
                        <div className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">Duración</div>
                        <div className="text-[18px] font-black text-slate-800 dark:text-zinc-100 leading-none font-mono">{fmtDur(workout.duration || 0)}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5 text-center">
                        <div className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">IF</div>
                        <div className={`text-[18px] font-black leading-none font-mono ${weightedIF >= 0.85 ? 'text-red-500' : weightedIF >= 0.7 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {weightedIF > 0 ? weightedIF.toFixed(2) : '—'}
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5 text-center">
                        <div className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">Bloques</div>
                        <div className="text-[18px] font-black text-slate-800 dark:text-zinc-100 leading-none font-mono">
                            {totalBlocks}
                            {intervalBlocks > 0 && <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 ml-0.5">({intervalBlocks}x)</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── ZONE TIMELINE STRIP ── */}
            {segments.length > 0 && (
                <div className="px-6 pb-4 shrink-0">
                    {/* Timeline bar — Apple Watch style */}
                    <div className="flex items-end h-[24px] gap-[1px] rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-800/50 p-[2px]">
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
                        <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-600">0:00</span>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-600">{fmtDur(totalMin)}</span>
                    </div>
                </div>
            )}

            {/* ── ZONE DISTRIBUTION + STRUCTURE ── */}
            <div className="flex flex-col flex-1 overflow-hidden min-h-0 border-t border-slate-100 dark:border-zinc-800/50">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr] divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-zinc-800/50 min-h-full">

                        {/* LEFT — Zone Distribution */}
                        <div className="p-5">
                            <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Zonas</h4>
                            {sortedZones.length > 0 ? (
                                <div className="space-y-2.5">
                                    {sortedZones.map(([zone, min]) => {
                                        const pct = Math.round((min / totalMin) * 100);
                                        return (
                                            <div key={zone} className="group">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900" style={{ background: getZoneColor(zone) }} />
                                                        <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">{zone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-zinc-400">{Math.round(min)}m</span>
                                                        <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 tabular-nums w-7 text-right">{pct}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(min / maxZoneMin) * 100}%`, background: getZoneColor(zone) }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-[11px] text-slate-400 dark:text-zinc-500 italic">Sin datos de zonas</p>
                            )}
                        </div>

                        {/* RIGHT — Structure */}
                        <div className="p-5">
                            <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Estructura</h4>
                            {blocks.length === 0 ? (
                                <div className="flex items-center justify-center py-10">
                                    <p className="text-[12px] text-slate-400 dark:text-zinc-500 italic">Sin estructura detallada</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {blocks.map((block, idx) => {
                                        const bl = blockLabel(block.type);
                                        if (block.type === 'repeat') {
                                            // Interval total time
                                            const stepTotal = (block.steps || []).reduce((t, s) => t + (Number(s.duration) || 0), 0) * (block.repeats || 1);
                                            return (
                                                <div key={idx} className="rounded-xl bg-slate-50/80 dark:bg-zinc-800/30 overflow-hidden">
                                                    <div className="px-4 py-2.5 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] text-slate-400">{bl.icon}</span>
                                                            <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">{bl.text}</span>
                                                            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 bg-slate-200/70 dark:bg-zinc-700/50 px-1.5 py-0.5 rounded-md">x{block.repeats}</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono font-semibold text-slate-400">{stepTotal > 0 ? fmtDur(stepTotal) : ''}</span>
                                                    </div>
                                                    <div className="border-t border-slate-100 dark:border-zinc-800/50">
                                                        {(block.steps || []).map((step, sIdx) => {
                                                            const isWork = step.type === 'active';
                                                            return (
                                                                <div key={sIdx} className={`flex items-center justify-between px-4 py-2 border-b last:border-0 ${isWork ? 'border-slate-100/50 dark:border-zinc-800/20' : 'border-slate-50 dark:border-zinc-800/10 bg-white/50 dark:bg-zinc-900/30'}`}>
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className="w-1 h-5 rounded-full" style={{ background: isWork ? (getZoneColor(step.zone)) : '#e2e8f0' }} />
                                                                        <div>
                                                                            <span className={`text-[11px] font-semibold ${isWork ? 'text-slate-700 dark:text-zinc-200' : 'text-slate-400 dark:text-zinc-500'}`}>
                                                                                {isWork ? 'Trabajo' : 'Descanso'}
                                                                            </span>
                                                                            {step.details && <span className="text-[9px] text-slate-400 ml-1.5">· {step.details}</span>}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2.5 shrink-0">
                                                                        <span className="text-[12px] font-bold font-mono text-slate-700 dark:text-zinc-200">
                                                                            {step.duration}<span className="text-[9px] text-slate-400 ml-0.5">{step.unit === 'dist' ? 'km' : "'"}</span>
                                                                        </span>
                                                                        {step.targetType === 'power' && step.targetValue ? (
                                                                            <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">{step.targetValue}w</span>
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
                                                        <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-200">{bl.text}</span>
                                                        {block.details && <span className="text-[9px] text-slate-400 ml-1.5">· {block.details}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5 shrink-0">
                                                    <span className="text-[14px] font-black font-mono text-slate-700 dark:text-zinc-200">
                                                        {block.duration}<span className="text-[10px] font-semibold text-slate-400 ml-0.5">{block.unit === 'dist' ? 'km' : "'"}</span>
                                                    </span>
                                                    {block.targetType === 'power' && block.targetValue ? (
                                                        <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">{block.targetValue}w</span>
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
            <div className="px-6 py-3.5 border-t border-slate-100 dark:border-zinc-800/50 flex justify-between items-center shrink-0">
                <button onClick={(e) => { onDelete(e); onClose(); }} className="text-[11px] font-medium text-red-400 hover:text-red-600 dark:text-red-400/60 dark:hover:text-red-400 transition-colors">
                    Eliminar
                </button>
                <div className="flex gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-full text-[11px] font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                        Cerrar
                    </button>
                    <button onClick={() => { onClose(); onEdit(); }} className="px-5 py-2 rounded-full text-[11px] font-semibold bg-slate-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-slate-700 dark:hover:bg-zinc-200 transition-colors shadow-sm">
                        Editar
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Fueling Panel Component ──────────────────────────────────────────────────
// Now previously defined at EOF.

export default CalendarPage;
