/* eslint-disable no-unused-vars */
import { Activity, X } from 'lucide-react';
import React from 'react';
import { useChartTheme } from '../charts/useChartTheme';

// ── Floating draggable PMC projection chart ─────────────────────────────────
export const PmcFloatingChart = ({ pmcByDate, onClose, initPos }) => {
    const ct = useChartTheme();
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
    const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 640;

    return (
        <div data-skin="calendar" data-cal="pmc" className={isMobileScreen ? "fixed z-floating inset-x-0 bottom-0 bg-surface border-t border-line-2 rounded-t-3xl shadow-2xl overflow-y-auto max-h-[90vh] pb-safe select-none" : "fixed z-floating bg-surface border border-line-2 rounded-xl shadow-2xl overflow-visible select-none"}
            style={isMobileScreen ? {} : { left: pos.x, top: pos.y, width: Math.min(480, window.innerWidth - 32) }}>
            {/* Title / drag bar */}
            <div className="flex items-center justify-between px-3 py-2 bg-sunken-2 border-b border-line-soft-2 rounded-t-xl cursor-grab active:cursor-grabbing"
                onPointerDown={handleDragDown} onPointerMove={handleDragMove} onPointerUp={handleDragUp}>
                <div className="flex items-center gap-2">
                    <Activity size={12} data-cal="pmc-icon" className="text-violet-500" />
                    <span className="text-[10px] font-black text-body-soft-2 uppercase tracking-widest">Proyección de Forma</span>
                </div>
                {lastReal && (
                    <div className="flex items-center gap-3 mr-2">
                        <span data-cal="pmc-stat" className="text-[9px] font-bold text-metric-ctl">CTL {Math.round(lastReal.ctl)}</span>
                        <span data-cal="pmc-stat" className="text-[9px] font-bold text-legacy-atl-red">ATL {Math.round(lastReal.atl)}</span>
                        <span data-cal="pmc-stat" className={`text-[9px] font-bold ${lastReal.tcb >= 0 ? 'text-legacy-tsb-up' : 'text-legacy-tsb-down'}`}>
                            TSB {lastReal.tcb >= 0 ? '+' : ''}{Math.round(lastReal.tcb)}
                        </span>
                    </div>
                )}
                <button onClick={onClose} data-cal="modal-close" className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded transition-colors">
                    <X size={13} />
                </button>
            </div>

            {/* Legend / Toolbar */}
            <div data-cal="pmc-legend" className="flex items-center gap-4 px-4 pt-2.5 text-[10px] font-bold text-ink-3">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-500 transition-colors">
                    <input type="checkbox" checked={viewOpts.top} onChange={e => setViewOpts(v => ({ ...v, top: e.target.checked }))} data-series="ctl" className="accent-blue-500 rounded-sm w-3 h-3" />
                    <span>Aptitud / Fatiga</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-500 transition-colors">
                    <input type="checkbox" checked={viewOpts.mid} onChange={e => setViewOpts(v => ({ ...v, mid: e.target.checked }))} data-series="tsb" className="accent-emerald-500 rounded-sm w-3 h-3" />
                    <span>Forma</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-amber-500 transition-colors">
                    <input type="checkbox" checked={viewOpts.bot} onChange={e => setViewOpts(v => ({ ...v, bot: e.target.checked }))} data-series="ramp" className="accent-amber-500 rounded-sm w-3 h-3" />
                    <span>Rampa</span>
                </label>
            </div>

            {/* Chart */}
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full cursor-crosshair" style={{ height: 340 }}
                onMouseMove={handleSvgMouseMove} onMouseLeave={() => setHover(null)}>

                <defs>
                    <linearGradient id="tcbGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={ct.pmc.bandUp} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={ct.pmc.bandDown} stopOpacity="0.2" />
                    </linearGradient>
                </defs>

                {/* Section Dividers */}
                <line x1={PAD.l} y1={yTopLine} x2={W - PAD.r} y2={yTopLine} stroke={ct.anatomy.grid} strokeWidth="1" />
                <line x1={PAD.l} y1={yMidLine} x2={W - PAD.r} y2={yMidLine} stroke={ct.anatomy.grid} strokeWidth="1" />

                {/* Y Axis Grid & Labels - TOP */}
                {[minTop, (minTop + maxTop) / 2, maxTop].map(v => (
                    <g key={`top-${v}`}>
                        <line x1={PAD.l} y1={yTopS(v)} x2={W - PAD.r} y2={yTopS(v)} stroke={ct.anatomy.grid2} strokeWidth="0.5" strokeDasharray="3,3" />
                        <text x={PAD.l - 6} y={yTopS(v) + 3} textAnchor="end" fontSize={9} fill={ct.anatomy.tick}>{Math.round(v)}</text>
                    </g>
                ))}

                {/* Y Axis Grid & Labels - MID */}
                <line x1={PAD.l} y1={zeroYMid} x2={W - PAD.r} y2={zeroYMid} stroke={ct.anatomy.grid} strokeWidth="1" strokeDasharray="3,3" />
                <rect x={PAD.l} y={yMidS(5)} width={cw} height={yMidS(-20) - yMidS(5)} fill={ct.pmc.band} fillOpacity="0.5" />
                <rect x={PAD.l} y={yMidS(25)} width={cw} height={yMidS(5) - yMidS(25)} fill={ct.pmc.bandUp} fillOpacity="0.05" />
                <rect x={PAD.l} y={yMidS(-10)} width={cw} height={yMidS(-30) - yMidS(-10)} fill={ct.pmc.bandDown} fillOpacity="0.05" />
                {[20, 5, -10, -30].map(v => (
                    <text key={`mid-${v}`} x={PAD.l - 6} y={yMidS(v) + 3} textAnchor="end" fontSize={9} fill={ct.anatomy.tick}>{v}</text>
                ))}

                {/* Y Axis Grid & Labels - BOT */}
                <line x1={PAD.l} y1={zeroYBot} x2={W - PAD.r} y2={zeroYBot} stroke={ct.anatomy.grid} strokeWidth="1" />
                {[maxBot, 0, minBot].map(v => (
                    <text key={`bot-${v}`} x={PAD.l - 6} y={yBotS(v) + 3} textAnchor="end" fontSize={9} fill={ct.anatomy.tick}>{v.toFixed(1)}</text>
                ))}

                {/* Today marker (Vertical Line across all sections) */}
                {todayX != null && <>
                    <line x1={todayX} y1={PAD.t} x2={todayX} y2={H - PAD.b} stroke={ct.pmc.today} strokeWidth="1.2" />
                </>}

                {/* === TOP SECTION: CTL & ATL === */}
                <path d={buildPath('atl', realE, yTopS)} fill="none" stroke={ct.pmc.atl} strokeWidth="1.5" strokeLinejoin="round" />
                <path d={buildPath('ctl', realE, yTopS)} fill="none" stroke={ct.pmc.ctl} strokeWidth="2.5" strokeLinejoin="round" />
                {projWithJoin.length > 1 && <>
                    <path d={buildPath('atl', projWithJoin, yTopS)} fill="none" stroke={ct.pmc.atl} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" strokeLinejoin="round" />
                    <path d={buildPath('ctl', projWithJoin, yTopS)} fill="none" stroke={ct.pmc.ctl} strokeWidth="2.5" strokeDasharray="4,3" opacity="0.6" strokeLinejoin="round" />
                </>}

                {/* === MID SECTION: TCB (Forma) === */}
                <path d={buildPath('tcb', realE, yMidS)} fill="none" stroke={ct.pmc.tsb} strokeWidth="2.5" strokeLinejoin="round" />
                {projWithJoin.length > 1 && <>
                    <path d={buildPath('tcb', projWithJoin, yMidS)} fill="none" stroke={ct.pmc.tsb} strokeWidth="2.5" strokeDasharray="4,3" opacity="0.6" strokeLinejoin="round" />
                </>}

                {/* === BOTTOM SECTION: Ramp Rate === */}
                <path d={buildRampPath(realE)} fill="none" stroke={ct.pmc.ramp} strokeWidth="1.5" />
                {projWithJoin.length > 1 && <>
                    <path d={buildRampPath(projWithJoin)} fill="none" stroke={ct.pmc.rampProj} strokeWidth="1.5" strokeDasharray="2,2" />
                </>}

                {/* Current latest values on right edge */}
                {lastReal && (
                    <g>
                        <text x={W - PAD.r + 6} y={yTopS(lastReal.ctl) + 3} fontSize={10} fontWeight="bold" fill={ct.pmc.ctlInk}>{Math.round(lastReal.ctl)}</text>
                        <text x={W - PAD.r + 6} y={yTopS(lastReal.atl) + 3} fontSize={10} fontWeight="bold" fill={ct.pmc.atlInk}>{Math.round(lastReal.atl)}</text>
                        <text x={W - PAD.r + 6} y={yMidS(lastReal.tcb) + 3} fontSize={10} fontWeight="bold" fill={ct.pmc.tsbInk}>{Math.round(lastReal.tcb)}</text>
                        <text x={W - PAD.r + 6} y={yBotS(lastReal.ramp) + 3} fontSize={10} fontWeight="bold" fill={ct.pmc.rampInk}>{lastReal.ramp.toFixed(1)}</text>
                    </g>
                )}

                {/* Hover crosshair */}
                {hover != null && <>
                    <line x1={hover.x} y1={PAD.t} x2={hover.x} y2={H - PAD.b} stroke={ct.anatomy.cursor} strokeWidth="1" opacity="0.8" />
                    {hoverEntry?.ctl != null && <circle cx={hover.x} cy={yTopS(hoverEntry.ctl)} r={3.5} fill={ct.pmc.ctl} stroke={ct.anatomy.dotRing} strokeWidth="1.5" />}
                    {hoverEntry?.atl != null && <circle cx={hover.x} cy={yTopS(hoverEntry.atl)} r={3.5} fill={ct.pmc.atl} stroke={ct.anatomy.dotRing} strokeWidth="1.5" />}
                    {hoverEntry?.tcb != null && <circle cx={hover.x} cy={yMidS(hoverEntry.tcb)} r={3.5} fill={ct.pmc.tsb} stroke={ct.anatomy.dotRing} strokeWidth="1.5" />}
                    {hoverEntry?.ramp != null && <circle cx={hover.x} cy={yBotS(hoverEntry.ramp)} r={2.5} fill={ct.pmc.rampInk} />}
                </>}

                {/* X axis Base Line */}
                <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke={ct.anatomy.grid} strokeWidth="1" />
                {labels.map((e, li) => {
                    const i = visibleWithRamp.findIndex(v => v.date === e.date);
                    const d = new Date(e.date + 'T00:00:00');
                    return <text key={li} x={xS(i)} y={H - PAD.b + 14} textAnchor="middle" fontSize={10} fill={ct.anatomy.axis}>
                        {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </text>;
                })}
            </svg>

            {/* Hover tooltip */}
            {hoverEntry && (() => {
                const tooltipLeft = hover.x > W * 0.65;
                return (
                    <div data-cal="pmc-tooltip" className="absolute top-3 pointer-events-none bg-surface-7 border border-line-2 rounded-lg shadow-lg px-3 py-2 text-[10px] z-10 min-w-[130px]"
                        style={{ [tooltipLeft ? 'right' : 'left']: tooltipLeft ? 16 : 50 }}>
                        <p className="font-bold text-body-soft-2 mb-1.5">
                            {new Date(hoverEntry.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {hoverEntry.projected && <span className="ml-1.5 text-[8px] font-normal text-violet-400 uppercase tracking-wide">proyectado</span>}
                        </p>
                        <div className="space-y-1">
                            <div className="flex justify-between gap-4">
                                <span className="text-legacy-ctl-sky font-semibold">Aptitud (CTL)</span>
                                <span className="font-mono font-bold text-body-2">{Math.round(hoverEntry.ctl)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-legacy-atl-purple font-semibold">Fatiga (ATL)</span>
                                <span className="font-mono font-bold text-body-2">{Math.round(hoverEntry.atl)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className={`font-semibold ${hoverEntry.tcb >= 0 ? 'text-legacy-tsb-up' : 'text-legacy-tsb-down'}`}>Forma (TSB)</span>
                                <span className={`font-mono font-bold ${hoverEntry.tcb >= 0 ? 'text-legacy-tsb-up-ink' : 'text-legacy-tsb-down-2'}`}>
                                    {hoverEntry.tcb >= 0 ? '+' : ''}{Math.round(hoverEntry.tcb)}
                                </span>
                            </div>
                            <div className="flex justify-between gap-4 pt-1 border-t border-slate-100 dark:border-zinc-700 mt-1">
                                <span data-cal="pmc-ramp" className="text-emerald-600 font-semibold">Rampa (est)</span>
                                <span className="font-mono font-bold text-body-2">{hoverEntry.ramp.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
