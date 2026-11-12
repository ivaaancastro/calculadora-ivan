# Especificación SDD — rama `feat/ui-skin-v2-extension` (PR 6: extensión de la piel v2)

## 1. Identificación
- **ID:** `spec-rediseno-02-c3-skin-ext` (extensión operativa de `spec-rediseno-02-c3-skin`)
- **Título:** Extender la dirección «Panel» a las pantallas restantes y completar `chartTheme` (D-10)
- **Fecha:** 2026-11-12
- **Estado:** aprobada 2026-11-12; implementada, pendiente de revisión de capturas y merge.
- **Spec de la capa:** `docs/branches/feat/ui-shell/spec.md` (RF9–RF11) — no se duplica.
- **Rama anterior:** `docs/branches/feat/ui-skin-v2-visual/` (PR 5, D7 aprobada 2026-11-12, #75, `7c4ef9a`).
- **Plan de la capa:** `docs/branches/feat/ui-skin-v2/plan.md`, PR 6.
- **Base:** `origin/develop` en `7c4ef9a` o posterior.

## 2. Objetivo
Aplicar la dirección «Panel», ya aprobada, a las **5 pantallas que aún se ven como v1 bajo `data-ui="v2"`** (Rendimiento `/stats`, Actividades `/history`, Detalle de actividad, Salud y Perfil), con sus gráficas, sin tocar v1. No se inventa dirección nueva: se reutilizan los tokens y la hoja `skin-v2.css` del PR 5.

## 3. Contexto
- Hoy `data-skin` solo existe en la raíz de `AdvancedAnalytics` (`dashboard`) y `CalendarPage` (`calendar`). Los bloques `@tokens:skin-v2` de `tokens.css` y las reglas de `skin-v2.css` se acotan a esos dos valores.
- `chartTheme.v2` hoy solo redefine series de forma, anatomía, tooltip y PMC; `zones`, `sports`, `distribution` y `map` se heredan de v1 (los valores `.dark` de esas entradas siguen repitiendo los de claro: **D-10**).
- El PR 5 dejó 6 capturas móviles de v2 (actividades, rendimiento, salud) con 34 px más de alto porque el pager móvil mide la pestaña más alta: esto cambiará más al extender la piel.
- v1 está congelada (RF10): el volcado `develop` vs rama debe dar **0 diferencias** y las 48 capturas de v1 no cambian.

## 4. Requisitos funcionales

- **RF1. Ámbito por pantalla:** `data-skin` en la raíz de las 5 pantallas (`stats`, `history`, `detail`, `health`, `profile`) y los selectores de `tokens.css` y `skin-v2.css` pasan de listar `dashboard`/`calendar` a cubrir todas. En v1 los atributos siguen inertes.
- **RF2. Mismos tokens, sin duplicar:** se reutilizan los bloques claro y oscuro del PR 5; solo se añaden tokens nuevos si una pantalla lo exige, con `check-palette.mjs` en verde (texto 4,5:1, series 3:1, ΔE ≥ 25).
- **RF3. `chartTheme` completo (D-10):** `chartTheme.v2` define `zones`, `sports`, `distribution`, `map` y la anatomía de Salud/Detalle con valores **`.dark` propios**; `chartTheme.test.js` valida cada entrada contra su bloque de `tokens.css`. `ChartSkinProvider` envuelve las 5 pantallas.
- **RF4. Semántica única (D-07/D-09 en lo que toque):** CTL/ATL/TSB ya usan el semáforo; se unifican los colores de categoría (carrera/fuerza/…) donde aparezcan en las 5 pantallas, con un solo significado por color.
- **RF5. Tipografía, radios y sombras:** las escalas de `skin-v2.css` se aplican a las 5 pantallas; ninguna cabecera, `--nav-h` ni objetivo táctil de 44 px cambia.
- **RF6. Escalas ordinales (RPE, sueño, VO2, potencia, IF, rampa):** solo si, tras aplicar RF2–RF4, alguna falla contraste o rompe un «un significado = un color». Si no, no se crean (ver D9).
- **RF7. Red de v2:** capturas de las 8 pantallas × 2 temas × 3 tamaños regeneradas en Docker; solo cambian las de las 5 pantallas (la landing de v2 sigue igual a v1, Capa 4). Informe táctil y contraste de texto de v2 sin regresiones.
- **RF8. v1 congelada:** volcado `develop` vs rama = 0 diferencias; capturas de v1 idénticas.
- **RF9. Sin lógica:** no se tocan `src/services`, `src/store`, `src/utils` ni `src/supabase.js`.

## 5. Criterios de aceptación
- [ ] `check-palette.mjs`, `lint`, `lint:colors` (sin subir), `lint:ui` (14), unit, integración y build en verde.
- [ ] E2E macOS y Docker con 0 ✘; volcado de v1 = 0 diferencias; capturas de v1 sin cambios.
- [ ] Cambian solo las capturas de v2 de las 5 pantallas, listadas una a una en el PR y revisadas por el usuario.
- [ ] Ninguna pantalla muestra a la vez rótulos o radios v1 y v2 bajo `data-ui="v2"`.

## 6. Diseño técnico (resumen)
- **Archivos:** `src/styles/tokens.css` (selectores), `src/styles/skin-v2.css` (selectores), `chartTheme.js`, `ChartSkin.jsx` (uso), `FitnessStatsPage`, `HistoryList`/`Dashboard` (raíz de `/history`), `ActivityDetailPage`, `HealthPage`, `ProfilePage` (atributo + proveedor), `chartTheme.test.js`, `scripts/check-palette.mjs` si cambia la lista de ámbitos.
- **Selector:** en lugar de listar valores, `[data-skin]` genérico con una lista corta de excepciones si alguna pantalla necesitara variante.
- **Pager móvil:** al estar las 5 pestañas bajo v2, revisar la medición del pager para no generar altura espuria.

## 7. Decisiones que necesitan tu aprobación
- **D9. Escalas ordinales.** **Propuesta:** no crearlas de entrada; solo si RF2–RF4 dejan una pantalla incumpliendo contraste. Alternativa: definirlas ahora para toda la app.
- **D10. Orden y paradas.** **Propuesta:** un solo PR (como marca el plan) con un commit por pantalla en este orden de riesgo: Perfil → Actividades → Rendimiento → Salud → Detalle, y parada de revisión de capturas al final. Alternativa: dos PRs (Perfil+Actividades+Rendimiento / Salud+Detalle) si el volumen de capturas lo pide.
- **D11. Lienzo y shell bajo v2.** **Propuesta:** no tocar `Navbar`, `BottomNav` ni el fondo de la app en este PR (siguen v1, como en Dashboard y Calendario); queda para la Capa 6. Alternativa: incluirlos ahora.

## 8. Fuera de alcance
Landing, acceso y `EmailConfirmedPage` (Capa 4); reescritura de pantallas y unificación de `TAB_PATHS` (Capa 5); v2 por defecto (Capa 6); cierre documental (PR 7).
