/**
 * «Un dato, un sitio» (spec Capa 6, RF-D1). Las cifras principales llevan `data-metric="<clave>"`
 * (ctl, atl, tsb, acwr, ramp, recovery, sleep, hrv, vo2max, load7, activities, impact…); la
 * lista completa y sus colores están en docs/design/forma.md.
 *
 * `duplicatedMetrics(page)` devuelve las claves que se ven más de una vez en la pantalla activa:
 * `{ ctl: ['52', 'CTL 52'], … }`. No cuenta lo que no se ve:
 *  - elementos sin caja, con `display: none`, `visibility: hidden` u opacidad 0;
 *  - lo que está dentro de `[hidden]`, `[inert]` o `[aria-hidden="true"]`;
 *  - tooltips (`[role="tooltip"]`, `.recharts-tooltip-wrapper`): solo salen al pasar el cursor;
 *  - lo que queda fuera de la ventana en horizontal o recortado por un contenedor con
 *    `overflow` (pestañas no activas de un carrusel).
 * Un readout de gráfico que solo aparece al pasar el cursor no cuenta mientras está oculto.
 */
export function duplicatedMetrics(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const hiddenByAncestor = (el) =>
      !!el.closest('[hidden], [inert], [aria-hidden="true"], [role="tooltip"], .recharts-tooltip-wrapper');
    const clipped = (el, r) => {
      for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (Number(s.opacity) === 0) return true;
        const b = n.getBoundingClientRect();
        // En horizontal, cualquier recorte (carrusel de pestañas); en vertical, solo un recorte
        // fijo (plegables con `max-h-0`): lo que queda bajo el pliegue de un scroll sí se ve.
        if (s.overflowX !== 'visible' && (r.right <= b.left + 1 || r.left >= b.right - 1)) return true;
        if (/hidden|clip/.test(s.overflowY) && (r.bottom <= b.top + 1 || r.top >= b.bottom - 1)) return true;
      }
      return false;
    };
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      if (r.right <= 0 || r.left >= vw) return false;
      return !hiddenByAncestor(el) && !clipped(el, r);
    };
    const groups = {};
    for (const el of document.querySelectorAll('[data-metric]')) {
      if (!visible(el)) continue;
      const key = el.getAttribute('data-metric');
      (groups[key] ||= []).push((el.innerText || el.textContent || '').trim().replace(/\s+/g, ' '));
    }
    return Object.fromEntries(Object.entries(groups).filter(([, texts]) => texts.length > 1));
  });
}
