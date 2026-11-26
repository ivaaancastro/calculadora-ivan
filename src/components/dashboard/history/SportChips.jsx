import React from 'react';

const CHIPS = [
    { value: 'all', label: 'Todo' },
    { value: 'run', label: 'Carrera' },
    { value: 'bike', label: 'Ciclismo' },
    { value: 'swim', label: 'Natación' },
    { value: 'gym', label: 'Fuerza' },
];

/** Filtro de deporte como chips: todas las opciones visibles, con scroll horizontal en móvil. */
export const SportChips = ({ value, onChange }) => (
    <div data-history="chips" role="group" aria-label="Deporte" className="flex gap-1.5 overflow-x-auto hide-scrollbar -mx-1 px-1">
        {CHIPS.map((c) => (
            <button
                key={c.value}
                type="button"
                data-history="chip"
                aria-pressed={value === c.value}
                onClick={() => onChange(c.value)}
                className="shrink-0 h-11 px-4 rounded-full border text-[13px] font-semibold transition-colors bg-surface border-line text-ink-3 aria-pressed:bg-ink aria-pressed:border-ink aria-pressed:text-surface"
            >
                {c.label}
            </button>
        ))}
    </div>
);
