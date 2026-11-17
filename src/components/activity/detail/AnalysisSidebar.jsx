import React from 'react';
import { InteractiveMap } from '../ActivityMap';

export const AnalysisSidebar = ({ activity, streams, themeColor, activePayload, trainingEffect, fitnessAnalysis }) => (
                            <aside data-detail="sidebar" className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-line-soft-6 bg-surface-6 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-6 shrink-0">
                                {/* Map - Desktop Solo (en móvil se muestra arriba estilo Strava) */}
                                <div className="hidden lg:block h-56 rounded-xl border border-line-soft-2 overflow-hidden shadow-sm">
                                    <InteractiveMap polyline={activity.map_polyline} highResCoords={streams?.latlng?.data} color={themeColor} currentPosition={activePayload?.latlng} />
                                </div>

                                {/* Impact Analysis & Coach Summary (Unified Premium Section) */}
                                {trainingEffect && (
                                    <div className="space-y-4">
                                        <div className="bg-surface border border-line-soft-2 rounded-2xl p-6 shadow-sm space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="text-xs font-bold text-ink-soft uppercase tracking-tight">Impacto del Entrenamiento</h3>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] text-ink-4 font-medium">Análisis fisiológico</p>
                                                        {trainingEffect.peakEpoc > 0 && (
                                                            <span className="text-[9px] font-bold text-faint-2 tabular-nums">Peak EPOC: {trainingEffect.peakEpoc}ml</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight bg-surface-2 border ${trainingEffect.benefitColor.replace('text-', 'border-').replace('dark:', '')} ${trainingEffect.benefitColor}`}>
                                                    {trainingEffect.primaryBenefit}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Aeróbico</span>
                                                        <span className="text-sm font-black text-ink-soft">{trainingEffect.aerobic}</span>
                                                    </div>
                                                    <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                                                        <div className={`h-full transition-all duration-1000 ${trainingEffect.aerobic >= 3 ? 'bg-indigo-500' : 'bg-indigo-400'}`} style={{ width: `${(trainingEffect.aerobic / 5) * 100}%` }} />
                                                    </div>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{trainingEffect.aerobicLabel}</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Anaeróbico</span>
                                                        <span className="text-sm font-black text-ink-soft">{trainingEffect.anaerobic}</span>
                                                    </div>
                                                    <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                                                        <div className={`h-full transition-all duration-1000 ${trainingEffect.anaerobic >= 3 ? 'bg-purple-600' : 'bg-purple-400'}`} style={{ width: `${(trainingEffect.anaerobic / 5) * 100}%` }} />
                                                    </div>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{trainingEffect.anaerobicLabel}</p>
                                                </div>
                                            </div>

                                            <div className="pt-5 border-t border-slate-50 dark:border-zinc-800/60">
                                                <div className="flex gap-3">
                                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                                    <p className="text-[10px] font-bold text-body leading-relaxed italic">
                                                        {trainingEffect.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Detailed Insights Slider-like cards */}
                                        {fitnessAnalysis && (
                                            <div className="bg-slate-50/50 dark:bg-zinc-900/40 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800/40">
                                                <h4 className="text-[9px] font-bold text-ink-4 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                                    Coach Insights
                                                </h4>
                                                <div className="space-y-3">
                                                    {fitnessAnalysis.insights.slice(0, 3).map((insight, idx) => (
                                                        <div key={idx} className="flex gap-3">
                                                            <div className="text-[8px] font-black text-faint-2 mt-0.5">0{idx + 1}</div>
                                                            <p className="text-[10px] font-medium text-ink-3 leading-snug">
                                                                {insight}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </aside>
);
