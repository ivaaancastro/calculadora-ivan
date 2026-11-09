/** Estilo del tooltip oscuro de las tarjetas de Forma; los colores salen de `useChartTheme()`. */
export const tooltipStyleFor = (ct) => ({
    backgroundColor: ct.tooltip.bg,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${ct.tooltip.edge}`,
    borderRadius: '12px',
    color: ct.tooltip.ink,
    fontSize: '11px',
    fontWeight: '600',
    padding: '10px 14px',
    zIndex: 1000,
    pointerEvents: 'none',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
});
