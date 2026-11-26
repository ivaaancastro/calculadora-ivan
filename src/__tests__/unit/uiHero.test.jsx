import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Hero } from '../../components/ui/Hero.jsx';
import { Delta } from '../../components/ui/Stat.jsx';
import { heroClass, heroChipClass, HERO_ACCENT } from '../../components/ui/heroClasses.js';

const order = (html, parts) => parts.map((p) => html.indexOf(`data-hero="${p}"`));

describe('ui/Hero recetas', () => {
  it('sin caja: filete superior y cifras tabulares', () => {
    expect(heroClass().root).toMatch(/^hero-rule relative grid /);
    expect(heroClass({ layout: 'stack' }).root).toContain('flex flex-col');
    // Cifra protagonista: tamaño xl y color de su métrica (RF-D2).
    expect(heroClass().value).toContain('text-ink');
    expect(heroClass({ size: 'xl', tone: 'ctl' }).value).toMatch(/sm:text-\[88px\].*text-metric-ctl/);
    expect(() => heroClass({ layout: 'card' })).toThrow();
  });

  it('chip por tono de forma y error si el tono no existe', () => {
    expect(heroChipClass('peak')).toContain('text-form-peak');
    expect(() => heroChipClass('rojo')).toThrow();
  });
});

describe('ui/Hero', () => {
  const props = {
    eyebrow: 'Estado de forma',
    chip: { label: 'Productivo', tone: 'productive' },
    line: 'Estás construyendo forma.',
    sub: 'Mantén la carga.',
    label: 'Fitness (CTL)',
    value: 52,
    unit: 'pts',
    metric: 'ctl',
    delta: <Delta value={3.1} unit="%" />,
  };

  it('split: texto (eyebrow, frase, consejo) y luego la cifra', () => {
    const html = renderToStaticMarkup(<Hero {...props} data-hero="form" className="pt-5" />);
    expect(html).toMatch(/^<section style="--hero-accent:rgb\(var\(--form-productive\)\)" class="hero-rule [^"]* pt-5" data-hero="form">/);
    const [eyebrow, sentence, advice, figure] = order(html, ['eyebrow', 'sentence', 'advice', 'figure']);
    expect(eyebrow).toBeLessThan(sentence);
    expect(sentence).toBeLessThan(advice);
    expect(advice).toBeLessThan(figure);
    expect(html).toContain(`<span class="${heroClass().chip} ${heroChipClass('productive')}">Productivo</span>`);
    expect(html).toContain('data-metric="ctl"');
    expect(html).toContain('>52<span class="ml-1 text-xl font-medium text-ink-4">pts</span>');
    expect(html).toContain('data-delta="good"');
  });

  it('stack: la cifra va antes que la frase (RF-D2)', () => {
    const html = renderToStaticMarkup(<Hero {...props} layout="stack" />);
    const [figure, sentence] = order(html, ['figure', 'sentence']);
    expect(figure).toBeLessThan(sentence);
  });

  it('`accent` explícito gana al del chip; sin chip ni accent no hay estilo', () => {
    expect(renderToStaticMarkup(<Hero value={1} accent="red" chip={{ label: 'x', tone: 'critical' }} />)).toContain('--hero-accent:red');
    const bare = renderToStaticMarkup(<Hero value={0} />);
    expect(bare).not.toContain('style=');
    expect(bare).toContain('>0</span>');
    expect(bare).not.toContain('data-hero="eyebrow"');
    expect(HERO_ACCENT.neutral).toBe('rgb(var(--line-strong))');
  });

  it('sin valor no pinta la cifra, pero sí lo que la acompaña', () => {
    const html = renderToStaticMarkup(<Hero line="Sin datos todavía" aside={<a href="/x">Conectar</a>} />);
    expect(html).not.toContain('data-hero="figure"');
    expect(html).toContain('<a href="/x">Conectar</a>');
  });
});
