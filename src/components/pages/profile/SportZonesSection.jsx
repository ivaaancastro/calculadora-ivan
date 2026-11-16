import React from 'react';
import { Heart, Timer, Zap } from 'lucide-react';
import { LTHR_ZONE_PCT } from '../../../utils/tssEngine';
import { Card, Input } from '../../ui';
import { calcPaceZones, FCMAX_PCT, POWER_ZONES, SWEET_SPOT, ZONE_COLORS, HR_LABELS, ZONE_LABELS } from './zonesCalc';

const ModeSelector = ({ sport, data, onZonesMode }) => (
    <div className="flex gap-0.5 bg-slate-200/60 dark:bg-zinc-800/80 rounded-full p-0.5">
        {[{ k: 'lthr', l: '% LTHR' }, { k: 'fcmax', l: '% FCmax' }, { k: 'custom', l: 'Manual' }].map(m => (
            <button key={m.k} onClick={() => onZonesMode(sport, m.k)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all select-none touch-manipulation active:scale-95 ${data.zonesMode === m.k
                    ? 'bg-surface-4 shadow-xs text-ink'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'
                    }`}>{m.l}</button>
        ))}
    </div>
);

// Reusable sport zones section — Apple Fitness Inset Style
export const SportZonesSection = ({ sport, sportLabel, icon: Icon, color, showPace, showPower, data, onChange, onZoneChange, onZonesMode }) => {
    const isReadOnly = data.zonesMode !== 'custom';
    const lthrPcts = LTHR_ZONE_PCT;
    const fcmaxPcts = FCMAX_PCT;

    return (
        <div className="space-y-4">
            {/* Threshold values card */}
            <Card className="p-3.5 sm:p-4">
                <div className="flex items-center gap-2.5 mb-3">
                    <div className={`w-7 h-7 rounded-[8px] bg-${color}-500/15 text-${color}-600 dark:text-${color}-400 flex items-center justify-center shrink-0`}>
                        <Icon size={16} strokeWidth={2.3} />
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-bold text-ink tracking-tight">{sportLabel}</h4>
                        <p className="text-[10px] text-ink-4">Umbrales de referencia</p>
                    </div>
                </div>

                <div className={`grid ${showPace ? 'grid-cols-2 sm:grid-cols-3' : showPower ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'} gap-2 sm:gap-3`}>
                    <div className="bg-sunken-4 rounded-xl p-2.5 border border-hairline-2">
                        <label className="text-[10px] font-semibold text-ink-3 block mb-0.5">FC Umbral</label>
                        <div className="flex items-baseline gap-1">
                            <input 
                                type="number" 
                                inputMode="numeric" 
                                value={data.lthr} 
                                onChange={(e) => onChange(e, sport, 'lthr')}
                                className="w-full bg-transparent font-mono font-bold text-sm sm:text-base text-ink outline-none" 
                            />
                            <span className="text-[10px] font-semibold text-slate-400">bpm</span>
                        </div>
                    </div>

                    <div className="bg-sunken-4 rounded-xl p-2.5 border border-hairline-2">
                        <label className="text-[10px] font-semibold text-ink-3 block mb-0.5">FC Máx.</label>
                        <div className="flex items-baseline gap-1">
                            <input 
                                type="number" 
                                inputMode="numeric" 
                                value={data.max} 
                                onChange={(e) => onChange(e, sport, 'max')}
                                className="w-full bg-transparent font-mono font-bold text-sm sm:text-base text-ink outline-none" 
                            />
                            <span className="text-[10px] font-semibold text-slate-400">bpm</span>
                        </div>
                    </div>

                    {showPace && (
                        <div className="bg-sunken-4 rounded-xl p-2.5 border border-hairline-2 col-span-2 sm:col-span-1">
                            <label className="text-[10px] font-semibold text-ink-3 block mb-0.5">Ritmo Umbral</label>
                            <div className="flex items-baseline gap-1">
                                <input 
                                    type="text" 
                                    value={data.thresholdPace} 
                                    onChange={(e) => onChange(e, sport, 'thresholdPace')} 
                                    placeholder="4:30"
                                    className="w-full bg-transparent font-mono font-bold text-sm sm:text-base text-sport-run-ink outline-none" 
                                />
                                <span className="text-[10px] font-semibold text-slate-400">/km</span>
                            </div>
                        </div>
                    )}

                    {showPower && (
                        <div className="bg-sunken-4 rounded-xl p-2.5 border border-hairline-2 col-span-2 sm:col-span-1">
                            <label className="text-[10px] font-semibold text-ink-3 block mb-0.5">FTP</label>
                            <div className="flex items-baseline gap-1">
                                <input 
                                    type="number" 
                                    inputMode="numeric" 
                                    value={data.ftp} 
                                    onChange={(e) => onChange(e, sport, 'ftp')}
                                    className="w-full bg-transparent font-mono font-bold text-sm sm:text-base text-emerald-600 dark:text-emerald-400 outline-none" 
                                />
                                <span className="text-[10px] font-semibold text-slate-400">W</span>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* HR Zones card */}
            <Card className="overflow-hidden">
                <div className="p-3.5 sm:p-4 border-b border-hairline flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Heart size={14} className="text-hr" />
                        <span className="text-xs sm:text-sm font-bold text-ink">Zonas de Frecuencia Cardíaca</span>
                    </div>
                    <ModeSelector sport={sport} data={data} onZonesMode={onZonesMode} />
                </div>
                <div className="divide-y divide-hairline-2">
                    {(data?.zones || []).map((zone, i) => {
                        const pcts = data.zonesMode === 'lthr' ? lthrPcts[i] : data.zonesMode === 'fcmax' ? fcmaxPcts[i] : null;
                        const pctStr = pcts ? `${Math.round(pcts.pMin * 100)} - ${i === 6 ? Math.round(pcts.pMax * 100) + '%+' : Math.round(pcts.pMax * 100) + '%'}` : '';
                        return (
                            <div key={i} className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-sunken-3 transition-colors">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ZONE_COLORS[i] }} />
                                    <span className="font-bold text-ink-2-soft shrink-0">{HR_LABELS[i]}</span>
                                    <span className="text-ink-3 truncate text-[11px]">{(pcts || lthrPcts[i]).label}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    {pctStr && (
                                        <span className="text-[10px] font-mono text-ink-4 hidden sm:inline">{pctStr}</span>
                                    )}
                                    {isReadOnly ? (
                                        <span className="font-mono font-bold text-body text-xs">
                                            {zone.min} - {zone.max} <span className="text-[10px] font-normal text-slate-400">bpm</span>
                                        </span>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <Input variant="inline" size="sm" mono type="number" value={zone.min} onChange={(e) => onZoneChange(e, sport, i, 'min')} className="w-12 px-1 py-0.5 text-center" />
                                            <span className="text-slate-400">-</span>
                                            <Input variant="inline" size="sm" mono type="number" value={zone.max} onChange={(e) => onZoneChange(e, sport, i, 'max')} className="w-12 px-1 py-0.5 text-center" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Pace Zones (Carrera) */}
            {showPace && (
                <Card className="overflow-hidden">
                    <div className="p-3.5 sm:p-4 border-b border-hairline flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Timer size={14} className="text-sport-run" />
                            <span className="text-xs sm:text-sm font-bold text-ink">Zonas de Ritmo</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">por km</span>
                    </div>
                    <div className="divide-y divide-hairline-2">
                        {(data?.paceZones || calcPaceZones(data?.thresholdPace) || []).map((zone, i) => (
                            <div key={i} className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-sunken-3 transition-colors">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ZONE_COLORS[i] }} />
                                    <span className="font-bold text-ink-2-soft shrink-0">{HR_LABELS[i]}</span>
                                    <span className="text-ink-3 truncate text-[11px]">{zone.label}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[10px] font-mono text-ink-4 hidden sm:inline">
                                        {zone.pctMin > 0 ? `${(zone.pctMin * 100).toFixed(0)}` : '0'}-{(zone.pctMax * 100).toFixed(0)}%
                                    </span>
                                    <span className="font-mono font-bold text-body text-xs">
                                        {zone.min} - {zone.max}/km
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Power Zones (Ciclismo) */}
            {showPower && data.ftp > 0 && (
                <Card className="overflow-hidden">
                    <div className="p-3.5 sm:p-4 border-b border-hairline flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap size={14} className="text-power" />
                            <span className="text-xs sm:text-sm font-bold text-ink">Zonas de Potencia ({data.ftp} W)</span>
                        </div>
                    </div>
                    <div className="divide-y divide-hairline-2">
                        {POWER_ZONES.map((pz, i) => {
                            const minW = Math.round(data.ftp * pz.pMin);
                            const maxW = Math.round(data.ftp * pz.pMax);
                            return (
                                <div key={i} className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-sunken-3 transition-colors">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ZONE_COLORS[i] }} />
                                        <span className="font-bold text-ink-2-soft shrink-0">Z{i + 1}</span>
                                        <span className="text-ink-3 truncate text-[11px]">{pz.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-[10px] font-mono text-ink-4 hidden sm:inline">
                                            {Math.round(pz.pMin * 100)}-{Math.round(pz.pMax * 100)}%
                                        </span>
                                        <span className="font-mono font-bold text-body text-xs">
                                            {minW} - {i === 6 ? maxW + '+' : maxW} <span className="text-[10px] font-normal text-slate-400">W</span>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}
        </div>
    );
};
