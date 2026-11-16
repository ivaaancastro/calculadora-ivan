import React from 'react';
import { Card } from '../ui';

export const DaySpotlight = ({ currentSelectedDay }) => (
    <>
        {currentSelectedDay && (
            <Card className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-line-soft-2 pb-3">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-4">
                            Detalle del Día
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-ink capitalize">
                            {currentSelectedDay.dateLabelFull}
                        </h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${currentSelectedDay.recoveryInfo.badge}`}>
                        Recuperación {currentSelectedDay.readinessScore}% • {currentSelectedDay.recoveryInfo.label}
                    </span>
                </div>

                {/* Cuadrícula de Métricas de ese día */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    <div className="p-3 bg-sunken-4 rounded-xl border border-line-soft-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-4 block">
                            Sueño
                        </span>
                        <span className="text-lg font-black font-mono tabular-nums text-sleep">
                            {currentSelectedDay.sleep ? `${currentSelectedDay.sleep} h` : '--'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                            Score: {currentSelectedDay.sleepScore ? `${currentSelectedDay.sleepScore}%` : '--'}
                        </span>
                    </div>

                    <div className="p-3 bg-sunken-4 rounded-xl border border-line-soft-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-4 block">
                            VFC
                        </span>
                        <span className="text-lg font-black font-mono tabular-nums text-hrv">
                            {currentSelectedDay.hrv ? `${currentSelectedDay.hrv} ms` : '--'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                            Media 7d: {currentSelectedDay.hrv7dAvg || '--'} ms
                        </span>
                    </div>

                    <div className="p-3 bg-sunken-4 rounded-xl border border-line-soft-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-4 block">
                            FC Reposo
                        </span>
                        <span className="text-lg font-black font-mono tabular-nums text-hr">
                            {currentSelectedDay.rhr ? `${currentSelectedDay.rhr} lpm` : '--'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                            Media 7d: {currentSelectedDay.rhr7dAvg || '--'} lpm
                        </span>
                    </div>

                    <div className="p-3 bg-sunken-4 rounded-xl border border-line-soft-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-4 block">
                            Estrés / Pasos
                        </span>
                        <span className="text-lg font-black font-mono tabular-nums text-steps">
                            {currentSelectedDay.stress != null ? `${currentSelectedDay.stress}%` : (currentSelectedDay.steps ? `${Math.round(currentSelectedDay.steps / 1000)}k` : '--')}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                            {currentSelectedDay.steps ? `${Number(currentSelectedDay.steps).toLocaleString('es-ES')} pasos` : 'Nivel estrés'}
                        </span>
                    </div>
                </div>
            </Card>
        )}
    </>
);
