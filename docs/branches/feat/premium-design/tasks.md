# Tasks — `feat/premium-design` (Fase Premium)

Spec aprobada (D1–D10 + ampliación, 2026-11-19). **No empezar la Fase A hasta que #106 esté mergeado.** Una sesión por fase (AGENTS §8).

## Fase A — Auditoría de diseño (rama `docs/premium-audit`, 1 PR, sin código)
- [x] A1. Rama desde `develop` actualizado; leer `AGENTS.md`, `MEMORY.md` y la spec.
- [ ] A2 (omitido: auditoría estática; capturas se piden en Fase B). Levantar v2 con datos simulados; capturas solo en Docker (390 px y escritorio, claro/oscuro), sin leer PNG en bloque.
- [x] A3. Auditar con `frontend-design` y `dataviz` (y `ui-design-review:*` si el plugin está activo) **todo el diseño**: shell y navegación, tipografía, color, bordes, sombras, espaciado, jerarquía, densidad, estados vacío/carga/error, microinteracciones.
- [x] A4. Pantallas: landing y acceso, Dashboard, Rendimiento, Salud, Actividades, Detalle (bici, carrera, senderismo, fuerza), Calendario, Ajustes, Perfil.
- [x] A5. Componentes: primitivas de `src/components/ui/`, tarjetas, modales, tooltips, listas y todas las gráficas.
- [x] A6. Escribir `auditoria.md`: P0/P1/P2, esfuerzo S/M/L, archivo y fase destino (B/C/D).
- [x] A7. Evaluar con medida dependencias (d3, Motion) y Tailwind 4; recomendación y petición de OK.
- [ ] A8. PR a `develop`, presentar y **parar** para aprobar prioridades (D7).
- [x] A9. Registrar `MEMORY.md` y `CHANGELOG.md`.

## Fase B — Tokens y acabado (alto nivel; `feat/premium-tokens`)
- [x] B1. Spec de rama con tokens exactos (`docs/branches/feat/premium-tokens/spec.md`).
- [x] B2a (PR 1, `feat/premium-tokens`). Radios concéntricos, elevación en 3 niveles, lienzo oscuro, escala tipográfica, foco, `text-wrap`, `transition-all` acotado + trinquete, pulsación única, contorno de imágenes.
- [x] B2b (PR 2, `feat/premium-palette`). Paleta Forma de 7 tonos validada con `validate_palette.js` (claro/oscuro); identidad propia por serie, un solo color por deporte (run naranja, bike azul, walk esmeralda, strength violeta, resto cian); hex sueltos de calendario/zonas/predicciones → `chartTheme`. Quedan hex en utils/hooks (protegidos).
- [x] B2c (en #110). Primitivas `Skeleton`/`EmptyState`/`ErrorState` (EST-1/2/3) usadas en Actividades, Salud, Balance, Detalle y `ErrorBoundary`.
- [ ] B2d. RAD-4 (necesita captura), TIP-3 (medida de fuente), migrar `transition-all` a `transition-[…]` por componentes.
- [ ] B3. Verificar, D7 del usuario, registrar.

## Fase C — Capa de gráficas Forma (alto nivel; `feat/premium-charts`)
- [x] C1. Spec de rama (piezas y orden D6; dependencias con medida y OK).
- [x] C2. Lenguaje base + `EvolutionChart`.
- [x] C3. Sparkline, gauge y anillos; banda/umbrales y proyección; brush/zoom; heatmap.
- [x] C4. Tests, bundle, D7, registrar.

## Fase D — Pantallas (alto nivel; **bloqueada** hasta referencias)
- [ ] D0. El usuario aporta webs de referencia.
- [x] D1. Detalle de actividad (PRs #117, #122 y PR 3 de `feat/premium-detalle-lateral`); pendiente D7 del usuario. Diferidos: cursor compartido con el mapa y `ErrorState` de telemetría.
- [x] D4. Salud (PRs #120, #121 y #123, `feat/premium-salud`): hero narrativo, banco de energía, biomarcadores por estado con sparklines, historial v2; pendiente D7 del usuario. Detalle en `docs/branches/feat/premium-salud/tasks.md`.
- [x] D7-Ajustes. Ajustes/Perfil (PRs #126, #129 y #130, mergeados como #130; `feat/premium-perfil*`): cabecera con guardado de cambios pendientes, menú con indicador, General/Zonas/Cuentas/Seguridad con zona de peligro diferenciada; pendiente D7 visual del usuario (6 capturas `perfil-*`). Detalle en `docs/branches/feat/premium-perfil/tasks.md`.
- [ ] D2. Resto de pantallas y landing, cada una con aprobación y D7.
