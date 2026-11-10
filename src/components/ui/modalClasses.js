/**
 * Recetas de los modales (spec-rediseno-02-c2, 6.2; PR 6). Cada variante es uno de los 4 modales
 * de hoy, con su fondo, su panel y su z-index tal cual (ninguno cambia de presentación):
 *  - `sheet`: añadir actividad manual. Hoja inferior en móvil y diálogo centrado desde `sm`.
 *  - `auth`: acceso de la landing. Diálogo centrado; el velo es una capa aparte dentro del fondo.
 *  - `planner`: planificar o editar un entreno del Calendario. Diálogo centrado.
 *  - `viewer`: ver un entreno planificado del Calendario. Diálogo centrado, por encima (z-modal).
 * `backdrop` es la capa fija a pantalla completa; `layer`, el velo separado (solo `auth`);
 * `panel`, la caja del diálogo; `style`, el estilo en línea que ya llevaba el fondo.
 */
const MODAL = {
  sheet: {
    backdrop:
      'fixed inset-0 z-sheet flex items-end sm:items-center justify-center p-0 sm:p-4 bg-scrim backdrop-blur-sm overscroll-contain animate-in fade-in duration-200',
    panel:
      'bg-surface rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md border-t sm:border border-line-4 transform transition-all max-h-[92dvh] flex flex-col overflow-hidden pb-safe',
  },
  auth: {
    backdrop: 'fixed inset-0 z-sheet flex items-center justify-center p-4',
    layer: 'absolute inset-0 bg-scrim-2 backdrop-blur-sm',
    panel:
      'relative w-full max-w-md bg-surface-8 backdrop-blur-2xl rounded-2xl border border-line-muted-3 shadow-2xl p-8 animate-[modalIn_0.3s_ease-out]',
  },
  planner: {
    backdrop: 'fixed inset-0 bg-scrim-3 backdrop-blur-sm z-sheet flex items-center justify-center p-4',
    panel:
      'bg-surface rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-line-muted flex flex-col max-h-[90vh]',
  },
  viewer: {
    backdrop: 'fixed inset-0 bg-scrim-4 backdrop-blur-sm z-modal flex items-center justify-center p-4 sm:p-8',
    style: { overscrollBehavior: 'contain' },
    panel:
      'bg-surface rounded-lg w-full max-w-4xl shadow-2xl overflow-hidden border border-line max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200',
  },
};

export function modalRecipe(variant) {
  const r = MODAL[variant];
  if (!r) throw new Error(`Modal: variante desconocida "${variant}"`);
  return r;
}
