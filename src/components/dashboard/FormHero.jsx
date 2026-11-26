import React from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import { Delta, Hero } from '../ui';

/**
 * Héroe del Dashboard (spec Capa 6, RF-D2): lo primero que se ve es Fitness (CTL), con su
 * variación a 28 días y el estado de forma como chip; la frase narrativa va debajo, como
 * contexto. Sin controles: el rango vive en la cabecera de la gráfica (RF-D3).
 * Sin datos suficientes no se pinta la cifra (RF-D6).
 */
export const FormHero = ({ summary, ctl, loadTrend, className }) => {
    const shown = useCountUp(Math.round(ctl));
    const hasData = summary.state !== 'insufficient';
    return (
        <Hero
            layout="stack"
            data-dash="hero"
            data-hero="form"
            className={className}
            eyebrow="Estado de forma"
            chip={{ label: summary.label, tone: summary.tone }}
            line={summary.sentence}
            sub={summary.advice}
            label="Fitness (CTL)"
            metric="ctl"
            value={hasData ? Math.round(shown) : null}
            delta={hasData && <Delta value={loadTrend} flat={2} digits={1} unit="%" label="en 28 días" />}
        />
    );
};
