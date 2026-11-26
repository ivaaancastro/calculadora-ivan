import React from 'react';

/** Nivel del banco: color de estado y una palabra (la cifra vive en el héroe). */
const level = (v) =>
    v > 60 ? { label: 'Alta', bar: 'bg-positive', text: 'text-positive-ink' }
    : v > 30 ? { label: 'Media', bar: 'bg-warning', text: 'text-warning-ink' }
    : { label: 'Baja', bar: 'bg-danger', text: 'text-danger-ink' };

/**
 * Banco de energía como barra de contexto del héroe (spec Capa 6, RF-D1): cuánto queda de la
 * recuperación tras la carga del día. No repite la cifra; la barra y una palabra bastan.
 */
export const EnergyBank = ({ energyBankAmount }) => {
    if (typeof energyBankAmount !== 'number') return null;
    const l = level(energyBankAmount);
    return (
        <div data-health="energy" className="motion-safe:animate-rise motion-safe:[animation-delay:0.18s]">
            <div className="flex items-baseline justify-between gap-3 mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-4">Banco de energía</span>
                <span className="text-[12px] text-ink-3">
                    Energía <span className={`font-semibold ${l.text}`}>{l.label.toLowerCase()}</span> tras la carga de hoy
                </span>
            </div>
            <div
                data-health="energy-bar"
                role="meter"
                aria-label="Banco de energía"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={energyBankAmount}
                aria-valuetext={`Energía ${l.label.toLowerCase()}`}
                className="relative w-full h-2 rounded-full bg-fill-4 overflow-hidden"
            >
                <div
                    className={`h-full rounded-full origin-left motion-safe:animate-fill-x ${l.bar}`}
                    style={{ width: `${Math.max(2, energyBankAmount)}%` }}
                />
                <span data-health="energy-mark" className="absolute inset-y-0 w-0.5 bg-surface pointer-events-none" style={{ left: '30%' }} aria-hidden="true" />
                <span data-health="energy-mark" className="absolute inset-y-0 w-0.5 bg-surface pointer-events-none" style={{ left: '60%' }} aria-hidden="true" />
            </div>
        </div>
    );
};
