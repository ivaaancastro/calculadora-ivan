import React from 'react';
import { Card, InfoTooltip } from '../ui';

/**
 * Tarjeta de Rendimiento (Capa 6, PR 18): la receta única `Card`, título en frase y, en la
 * cabecera, los selectores que cambian la tarjeta (RF-D3). Sustituye al envoltorio que
 * restilaba las diez tarjetas con variantes arbitrarias de descendientes.
 */
export const StatsCard = ({ id, title, info, badge, actions, className, children }) => (
    <Card as="section" data-stats="card" data-card={id} aria-label={title} figures="tnum" className={`p-card md:p-card-lg ${className ?? ''}`}>
        <header className="flex flex-wrap items-center justify-between gap-3 mb-5 md:mb-6">
            <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-base font-semibold text-ink tracking-tight">{title}</h3>
                {info && <InfoTooltip text={info} />}
                {badge}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
        {children}
    </Card>
);
