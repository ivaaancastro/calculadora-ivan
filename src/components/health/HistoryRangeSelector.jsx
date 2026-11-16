import React from 'react';
import { SectionHeader } from '../ui';

export const HistoryRangeSelector = ({ historyRange, setHistoryRange }) => (
    <>
        <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
                <SectionHeader as="p">Registro Histórico</SectionHeader>
                <span className="text-xs text-ink-4 font-medium">
                    Evolución diaria y biometrías día a día
                </span>
            </div>

            <div data-health="range" className="flex items-center p-1 bg-fill-4 rounded-xl gap-1">
                {[
                    { days: 7, label: '7D' },
                    { days: 14, label: '14D' },
                    { days: 30, label: '30D' }
                ].map(r => (
                    <button
                        key={r.days}
                        type="button"
                        onClick={() => setHistoryRange(r.days)}
                        className={`py-1 px-3 text-xs font-bold rounded-lg transition-all active:scale-95 ${
                            historyRange === r.days
                                ? 'bg-surface-4 text-ink shadow-xs'
                                : 'text-ink-3 hover:text-ink-2-soft'
                        }`}
                    >
                        {r.label}
                    </button>
                ))}
            </div>
        </div>
    </>
);
