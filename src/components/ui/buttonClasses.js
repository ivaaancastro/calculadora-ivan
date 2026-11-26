/**
 * Recetas de los botones (spec-rediseno-02-c2, 6.2; PR 5). Solo las que tienen ≥ 2 usos.
 *
 * Button:
 *  - `ghost` e `inverse`: los chips para añadir bloques del planificador del Calendario.
 *  - `link-muted`: "+ Trabajo" y "+ Descanso" de los circuitos del planificador.
 *  - `primary` y `link`: enviar y enlaces del acceso (≥ 44 px).
 *  - `danger-text`: quitar un bloque o un paso del planificador (solo el icono, sin fondo).
 *  - `secondary` y `danger`: Cancelar y Eliminar del diálogo de confirmar borrado (≥ 44 px).
 * IconButton (con `aria-label` obligatorio):
 *  - `soft`: volver del detalle de actividad (círculo con fondo).
 *  - `ghost`: mes anterior y siguiente del Calendario.
 *  - `quiet`: cerrar y volver del acceso (≥ 44 px).
 * Borrar actividad del detalle no entra: en oscuro, su color de base gana hoy al rojo del hover
 * (D-08) y pasarlo a tokens haría aparecer ese hover.
 * Los botones con fondo se comprimen al pulsar (`active:scale-press`, 0,98; RF-D5) y animan solo
 * pintura y transformación (`transition-paint`, nunca todas las propiedades).
 * El tamaño y el relleno van en `className`.
 */
import { cx } from './cx.js';

const BUTTON = {
  ghost: 'text-ink-3 rounded-full text-[12px] font-medium hover:bg-surface-2 active:scale-press transition-paint',
  inverse: 'bg-inverse text-ink-inverse rounded-full text-[12px] font-medium hover:bg-inverse-2 active:scale-press transition-paint shadow-sm',
  'link-muted': 'text-2xs text-ink-4-fixed hover:text-body-soft-fixed font-medium transition-colors',
  primary: 'w-full min-h-[48px] bg-action-solid hover:bg-action-hover text-on-action rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-paint disabled:opacity-50 active:scale-press',
  link: 'min-h-[44px] px-2 text-xs font-semibold text-ink-3 hover:text-ink underline-offset-4 hover:underline transition-colors',
  'danger-text': 'text-faint-fixed hover:text-danger transition-colors',
  secondary: 'min-h-[44px] px-4 border border-line text-ink-3 hover:bg-surface-2 rounded-xl text-sm font-semibold active:scale-press transition-paint disabled:opacity-50',
  danger: 'min-h-[44px] px-4 bg-danger-solid hover:bg-danger-hover text-on-action rounded-xl text-sm font-semibold active:scale-press transition-paint disabled:opacity-50',
};

const ICON = {
  soft: 'flex items-center justify-center bg-fill hover:bg-fill-hover active:scale-press rounded-full transition-paint text-body-soft-2',
  ghost: 'flex items-center justify-center bg-transparent hover:bg-surface-2 active:scale-press text-ink-3 transition-paint touch-manipulation',
  quiet: 'flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full text-ink-3 hover:text-ink hover:bg-surface-2 active:scale-press transition-paint',
};

function pick(kind, table, variant) {
  const r = table[variant];
  if (!r) throw new Error(`${kind}: variante desconocida "${variant}"`);
  return r;
}

export const buttonClass = ({ variant = 'ghost' } = {}) => cx(pick('Button', BUTTON, variant));
export const iconButtonClass = ({ variant = 'ghost' } = {}) => cx(pick('IconButton', ICON, variant));
