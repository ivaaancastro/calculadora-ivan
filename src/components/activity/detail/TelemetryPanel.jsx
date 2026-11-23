import React from 'react';
import { formatPace, formatDuration } from '../../../utils/formatters';

export const TelemetryPanel = ({ chartData, peaks, activePayload, setActivePayload, activePeakType, isPaceBased }) => {
    return (
<>
                                    {chartData.length > 0 && (
                                        <div className="space-y-2.5">
                                            {/* Accesos rápidos a los Picos del entrenamiento */}
                                            {peaks && (
                                                <div data-detail="peaks" className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
                                                    <span className="text-[9px] font-bold text-ink-4 uppercase tracking-widest shrink-0 mr-1">
                                                        Picos:
                                                    </span>
                                                    {peaks.maxHrPt && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setActivePayload(peaks.maxHrPt)}
                                                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 border transition-all active:scale-95 flex items-center gap-1.5 ${
                                                                activePayload?.rawTime === peaks.maxHrPt.rawTime
                                                                    ? 'bg-hr text-white border-hr-strong shadow-xs'
                                                                    : 'bg-ink-inverse text-hr-ink border-hr-edge hover:bg-hr-tint'
                                                            }`}
                                                        >
                                                            <span>Pico FC</span>
                                                            <span className="font-mono tabular-nums">{peaks.maxHrPt.hr} bpm</span>
                                                        </button>
                                                    )}
                                                    {peaks.maxWattsPt && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setActivePayload(peaks.maxWattsPt)}
                                                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 border transition-all active:scale-95 flex items-center gap-1.5 ${
                                                                activePayload?.rawTime === peaks.maxWattsPt.rawTime
                                                                    ? 'bg-power text-white border-power-strong shadow-xs'
                                                                    : 'bg-ink-inverse text-power-ink border-power-edge hover:bg-power-tint-2'
                                                            }`}
                                                        >
                                                            <span>Pico W</span>
                                                            <span className="font-mono tabular-nums">{peaks.maxWattsPt.watts} W</span>
                                                        </button>
                                                    )}
                                                    {(!isPaceBased ? peaks.maxSpeedPt : peaks.bestPacePt) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setActivePayload(isPaceBased ? peaks.bestPacePt : peaks.maxSpeedPt)}
                                                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 border transition-all active:scale-95 flex items-center gap-1.5 ${
                                                                activePayload?.rawTime === (isPaceBased ? peaks.bestPacePt?.rawTime : peaks.maxSpeedPt?.rawTime)
                                                                    ? 'bg-speed text-white border-speed-strong shadow-xs'
                                                                    : 'bg-ink-inverse text-speed-ink border-speed-edge hover:bg-speed-tint'
                                                            }`}
                                                        >
                                                            <span>{isPaceBased ? 'Mejor Ritmo' : 'Max Vel'}</span>
                                                            <span className="font-mono tabular-nums">
                                                                {isPaceBased ? formatPace(peaks.bestPacePt.pace) : `${peaks.maxSpeedPt.speed} km/h`}
                                                            </span>
                                                        </button>
                                                    )}
                                                    {peaks.maxAltPt && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setActivePayload(peaks.maxAltPt)}
                                                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 border transition-all active:scale-95 flex items-center gap-1.5 ${
                                                                activePayload?.rawTime === peaks.maxAltPt.rawTime
                                                                    ? 'bg-inverse-2 text-ink-inverse border-slate-800 shadow-xs'
                                                                    : 'bg-surface text-body-soft-2 border-slate-200 dark:border-zinc-800 hover:bg-sunken-9'
                                                            }`}
                                                        >
                                                            <span>Cima</span>
                                                            <span className="font-mono tabular-nums">{peaks.maxAltPt.alt} m</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* HUD de Telemetría Dinámico */}
                                            <div data-detail="hud" className="bg-surface-8 backdrop-blur-md border border-line-4 rounded-2xl p-2.5 sm:p-3 shadow-sm transition-all">
                                                {activePayload ? (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between border-b border-line-soft-4 pb-1.5">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-2 font-mono text-[11px] font-bold tabular-nums text-body">
                                                                    <span>⏱️ {formatDuration(activePayload.rawTime)}</span>
                                                                    {activePayload.distanceKm !== null && <span className="text-faint-2">|</span>}
                                                                    {activePayload.distanceKm !== null && <span>📍 {activePayload.distanceKm} km</span>}
                                                                </div>
                                                                {activePeakType && (
                                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight border animate-pulse ${activePeakType.color}`}>
                                                                        {activePeakType.label}: {activePeakType.value}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setActivePayload(null)}
                                                                className="text-[10px] font-bold text-ink-4 hover:text-body-soft-2 px-1.5 py-0.5 rounded hover:bg-surface-2 transition-colors"
                                                            >
                                                                Resetear
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-center">
                                                            {/* Ritmo / Velocidad */}
                                                            {(isPaceBased ? activePayload.pace : activePayload.speed) !== null && <div className="bg-sunken rounded-xl p-1.5 border border-line-soft-3">
                                                                <span className="text-[8px] font-bold uppercase tracking-wider text-ink-4 block">
                                                                    {isPaceBased ? 'Ritmo' : 'Velocidad'}
                                                                </span>
                                                                <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-pace">
                                                                    {isPaceBased ? formatPace(activePayload.pace) : `${activePayload.speed} km/h`}
                                                                </span>
                                                            </div>}

                                                            {/* FC */}
                                                            {activePayload.hr !== null && (
                                                                <div className="bg-sunken rounded-xl p-1.5 border border-line-soft-3">
                                                                    <span className="text-[8px] font-bold uppercase tracking-wider text-ink-4 block">
                                                                        FC
                                                                    </span>
                                                                    <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-hr">
                                                                        {activePayload.hr} <span className="text-[9px] font-normal">bpm</span>
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Potencia */}
                                                            {activePayload.watts !== null && (
                                                                <div className="bg-sunken rounded-xl p-1.5 border border-line-soft-3">
                                                                    <span className="text-[8px] font-bold uppercase tracking-wider text-ink-4 block">
                                                                        Potencia
                                                                    </span>
                                                                    <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-power">
                                                                        {activePayload.watts} <span className="text-[9px] font-normal">W</span>
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Altitud y Pendiente */}
                                                            {activePayload.alt !== null && (
                                                                <div className="bg-sunken rounded-xl p-1.5 border border-line-soft-3">
                                                                    <span className="text-[8px] font-bold uppercase tracking-wider text-ink-4 block">
                                                                        Altitud
                                                                    </span>
                                                                    <div className="flex items-center justify-center gap-1 text-xs sm:text-sm font-black font-mono tabular-nums text-body">
                                                                        <span>{activePayload.alt}m</span>
                                                                        {activePayload.grade !== undefined && (
                                                                            <span className={`text-[9px] font-bold ${activePayload.grade > 3 ? 'text-rose-500' : activePayload.grade < -3 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                                {activePayload.grade > 0 ? '+' : ''}{activePayload.grade.toFixed(0)}%
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Cadencia */}
                                                            {activePayload.cadence !== null && (
                                                                <div className="bg-sunken rounded-xl p-1.5 border border-line-soft-3">
                                                                    <span className="text-[8px] font-bold uppercase tracking-wider text-ink-4 block">
                                                                        Cadencia
                                                                    </span>
                                                                    <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-cadence">
                                                                        {activePayload.cadence} <span className="text-[9px] font-normal">{isPaceBased ? 'ppm' : 'rpm'}</span>
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between text-ink-4 py-0.5 px-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                                                            <span className="text-[11px] font-medium">
                                                                Desliza el dedo por los gráficos para explorar cada punto y pico
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider hidden sm:inline">
                                                            Telemetría
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
</>
    );
};
