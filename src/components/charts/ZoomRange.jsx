/**
 * Zoom de rango Forma (Fase Premium C, PR 4): dos controles nativos (teclado y táctil) que
 * recortan la ventana visible de varias gráficas sincronizadas. `range` = [inicio, fin] en %.
 */
export function ZoomRange({ range, onChange, label = 'Zoom del recorrido' }) {
  const [lo, hi] = range;
  const zoomed = lo > 0 || hi < 100;
  return (
    <div data-chart="zoom" className="flex items-center gap-3 px-3.5 sm:px-6 py-2 border-b border-line-soft-3">
      <span className="text-[9px] font-bold text-ink-4 uppercase tracking-widest shrink-0">Zoom</span>
      <input
        type="range" min={0} max={100} step={1} value={lo}
        aria-label={`${label}: inicio`}
        aria-valuetext={`${lo} %`}
        onChange={(e) => onChange([Math.min(Number(e.target.value), hi - 5), hi])}
        className="flex-1 min-w-0 accent-current"
      />
      <input
        type="range" min={0} max={100} step={1} value={hi}
        aria-label={`${label}: fin`}
        aria-valuetext={`${hi} %`}
        onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + 5)])}
        className="flex-1 min-w-0 accent-current"
      />
      <button
        type="button"
        disabled={!zoomed}
        onClick={() => onChange([0, 100])}
        className="shrink-0 min-h-[44px] px-2 text-[10px] font-semibold text-ink-3 disabled:opacity-40"
      >
        Restablecer
      </button>
    </div>
  );
}
