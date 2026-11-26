/**
 * Recetas de Hero (Capa 6, PR 14; DUP-5). Guía: docs/design/forma.md.
 *
 * El héroe responde a la pregunta principal de la pantalla: eyebrow (+ chip de estado), una
 * cifra protagonista con unidad y variación, y una línea narrativa. Sin caja: lo separa el
 * filete superior `hero-rule` (skin.css), teñido con `--hero-accent`.
 *  - `split`: texto a la izquierda y cifra a la derecha desde md (héroe del Dashboard de hoy).
 *  - `stack`: una columna, la cifra primero y la frase debajo como contexto (RF-D2).
 */
import { cx } from './cx.js';

/** Chip de estado; los tonos son los del estado de forma (TSB) más los semánticos. */
export const HERO_CHIP = {
  neutral: 'text-body-soft bg-fill-3 border-line-muted-2',
  peak: 'text-form-peak bg-form-peak-tint border-form-peak/25',
  productive: 'text-form-productive bg-form-productive-tint border-form-productive/25',
  overload: 'text-form-overload bg-form-overload-tint border-form-overload/25',
  critical: 'text-form-critical bg-form-critical-tint border-form-critical/25',
};

/** Color del filete superior según el tono del chip (si no se pasa `accent`). */
export const HERO_ACCENT = {
  neutral: 'rgb(var(--line-strong))',
  peak: 'rgb(var(--form-peak))',
  productive: 'rgb(var(--form-productive))',
  overload: 'rgb(var(--form-overload))',
  critical: 'rgb(var(--form-critical))',
};

const FIGURES = "[font-feature-settings:'tnum'_1,'cv11'_1,'ss03'_1]";

const LAYOUT = {
  split: {
    root: 'grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end',
    figureCol: 'flex items-end justify-between gap-4 md:flex-col md:items-end',
  },
  stack: {
    root: 'flex flex-col gap-3',
    figureCol: 'flex flex-wrap items-end justify-between gap-4',
  },
};

/** Color de la cifra protagonista: el de su métrica (un color por métrica en toda la app). */
const VALUE_TONE = { ink: 'text-ink', ctl: 'text-metric-ctl', atl: 'text-metric-atl', tsb: 'text-metric-tsb' };
/** Tamaño de la cifra: `lg` (por defecto) o `xl` para la cifra que responde a la pregunta de la pantalla. */
const VALUE_SIZE = {
  lg: 'text-[48px] sm:text-[3.5rem]',
  xl: 'text-[72px] sm:text-[88px]',
};

export function heroClass({ layout = 'split', size = 'lg', tone = 'ink' } = {}) {
  const l = LAYOUT[layout];
  if (!l) throw new Error(`Hero: disposición desconocida "${layout}"`);
  return {
    root: cx('hero-rule relative', l.root, FIGURES),
    text: 'space-y-3 min-w-0',
    figureCol: l.figureCol,
    eyebrow: 'flex flex-wrap items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3',
    chip: 'text-2xs font-bold px-2 py-0.5 rounded-full border uppercase tracking-[0.05em]',
    line: 'motion-safe:animate-rise text-[18px] leading-snug font-medium tracking-[-0.01em] text-ink [text-wrap:balance] max-w-[46ch]',
    sub: 'text-xs text-ink-3',
    figure: 'min-w-0 motion-safe:animate-rise motion-safe:[animation-delay:0.12s]',
    label: 'text-2xs font-semibold uppercase tracking-[0.08em] text-ink-4',
    row: 'mt-1 flex items-baseline gap-2',
    value: cx(VALUE_SIZE[size] ?? VALUE_SIZE.lg, 'leading-none font-semibold tracking-[-0.04em] tabular-nums', VALUE_TONE[tone] ?? VALUE_TONE.ink),
    unit: 'ml-1 text-xl font-medium text-ink-4',
  };
}

export function heroChipClass(tone = 'neutral') {
  if (!HERO_CHIP[tone]) throw new Error(`Hero: tono de chip desconocido "${tone}"`);
  return HERO_CHIP[tone];
}
