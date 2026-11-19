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
- [ ] B1. Spec de rama con tokens exactos; aprobación.
- [ ] B2. Tokens v2 + Anexo A (concéntricos, `tabular-nums`, `text-wrap`, sin `transition: all`, hit areas 44 px, estados).
- [ ] B3. Verificar, D7 del usuario, registrar.

## Fase C — Capa de gráficas Forma (alto nivel; `feat/premium-charts`)
- [ ] C1. Spec de rama (piezas y orden D6; dependencias con medida y OK).
- [ ] C2. Lenguaje base + `EvolutionChart`.
- [ ] C3. Sparkline, gauge y anillos; banda/umbrales y proyección; brush/zoom; heatmap.
- [ ] C4. Tests, bundle, D7, registrar.

## Fase D — Pantallas (alto nivel; **bloqueada** hasta referencias)
- [ ] D0. El usuario aporta webs de referencia.
- [ ] D1. Detalle de actividad: propuesta → aprobación → implementación → D7.
- [ ] D2. Resto de pantallas y landing, cada una con aprobación y D7.
