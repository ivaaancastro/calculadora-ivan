/** Marco accesible de una gráfica (GRA-10): `role="img"` con resumen textual y nombre. */
export function ChartFigure({ label, summary, className, children }) {
  const text = summary ? `${label}. ${summary}` : label;
  return (
    <div role="img" aria-label={text} className={className}>
      {children}
    </div>
  );
}
