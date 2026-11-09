/**
 * Recetas de los botones (spec-rediseno-02-c2, 6.2; PR 5). Solo las que tienen ≥ 2 usos.
 *
 * Button:
 *  - `ghost` e `inverse`: los chips para añadir bloques del planificador del Calendario.
 *  - `link-muted`: "+ Trabajo" y "+ Descanso" de los circuitos del planificador.
 *  - `danger-text`: quitar un bloque o un paso del planificador (solo el icono, sin fondo).
 * IconButton (con `aria-label` obligatorio):
 *  - `soft`: volver del detalle de actividad (círculo con fondo).
 *  - `ghost`: mes anterior y siguiente del Calendario.
 *  - `bare`: volver del formulario de contraseña olvidada (acceso y landing).
 * Borrar actividad del detalle no entra: su `dark:text-zinc-500` gana hoy al `hover:text-red-500`
 * (D-08) y moverlo a tokens cambiaría el hover en oscuro.
 * El tamaño y el relleno van en `className`.
 */
import { cx } from './cx.js';

const BUTTON = {
  ghost: 'text-ink-3 rounded-full text-[11px] font-medium hover:bg-surface-2 transition-all',
  inverse: 'bg-inverse text-ink-inverse rounded-full text-[11px] font-medium hover:bg-inverse-2 transition-all shadow-sm',
  'link-muted': 'text-[10px] text-ink-4-fixed hover:text-body-soft-fixed font-medium transition-colors',
  'danger-text': 'text-faint-fixed hover:text-danger transition-colors',
};

const ICON = {
  soft: 'flex items-center justify-center bg-fill hover:bg-fill-hover active:scale-90 rounded-full transition-all text-body-soft-2',
  ghost: 'flex items-center justify-center bg-transparent hover:bg-surface-2 active:scale-95 text-ink-3 transition-all touch-manipulation',
  bare: 'text-ink-4-fixed hover:text-body-2 transition-colors',
};

function pick(kind, table, variant) {
  const r = table[variant];
  if (!r) throw new Error(`${kind}: variante desconocida "${variant}"`);
  return r;
}

export const buttonClass = ({ variant = 'ghost' } = {}) => cx(pick('Button', BUTTON, variant));
export const iconButtonClass = ({ variant = 'ghost' } = {}) => cx(pick('IconButton', ICON, variant));
