# Plan: Capa 6, v2 por defecto, CI rápido y acabado premium

Este plan desarrolla `spec.md` v0.3 (`spec-capa6-v2-premium`) y tiene en cuenta `MEMORY.md`.

Reglas comunes a todos los PR:
- Cada PR sale de `develop` y vuelve a `develop`, y su tamaño debe ser revisable. Los borrados mecánicos se declaran como tales.
- Ningún PR se mergea sin la autorización del usuario.

## Orden
1. **CI rápido y E2E limpio.** Con el CI actual, cada PR posterior costaría unos 25 minutos.
2. **El mapa.** Es el bug que más se nota y su corrección es pequeña.
3. **Secreto de Strava.** Es un problema de seguridad activo.
4. **Retirar v1 y limpiar el repositorio.**
5. **Aplanar el tema.** Base tipográfica y espaciado.
6. **Bugs y utils comunes.** Datos correctos antes de rediseñar.
7. **Propuesta de paleta** (capturas) y elección del usuario.
8. **Sistema y pantallas premium**, con datos sin repetir, el CTL protagonista y los controles junto a lo que cambian.
9. **Cierre.**

## PR

| # | Rama | Contenido (RF) | Tamaño est. |
|---|---|---|---|
| 0 | `feat/capa6-v2-premium` | Spec, plan y `auditoria.md` | documentación |
| 1 | `ci/rapido` | A1–A4: nuevo `ci.yml`, borrar infraestructura visual y capturas, E2E funcional limpio, `layout` en DOM, AGENTS y MEMORY | −3.000 / +300 |
| 2 | `fix/mapa-detalle` | C0: `map_polyline` en la consulta, streams que llegan tarde, streams por id bajo demanda, E2E del mapa | ~150 |
| 3 | `fix/strava-token-edge` | C1 | ~300 |
| 4 | `feat/v2-por-defecto` | B1 | ~150 |
| 5a–c | `refactor/retirar-v1-{publico,panel,analisis}` | B2 por zonas | borrado mecánico |
| 6 | `chore/limpieza` | E1–E3: huérfanos, raíz, icono, codemods, `docs/branches` cerradas (D12), `.opencode` (D11), `lint:orphans` | borrado mecánico |
| 7a | `refactor/tema-base` | B3 (tipografía con mínimo de 11 px, mono D8, `lint:type`, `axisProps`) y D5 (escala de espaciado y ancho máximo en el tema) | ~350 |
| 7b | `refactor/piel-aplanada` | B3 y B4 | ~400 (codemod) |
| 8 | `fix/bugs-auditoria` | C2: BUG-3, 4, 5, 8, 11 | ~150 |
| 9 | `refactor/utils-comunes` | C6: utils comunes, `dates`, `formatNumber` | ~350 |
| 10 | `fix/estado-forma-y-calendario` | C2: BUG-1, 2, 6, 7, 9, 10, 12 | ~300 |
| 11 | `fix/copy-y-a11y` | C3 y C4 | ~350 |
| 12 | `docs/paleta-propuestas` | D4: 2–3 direcciones de paleta como capturas reales (Dashboard, Detalle y Salud, en claro y oscuro), con una rama de prueba por dirección. **Parada: el usuario elige.** | capturas |
| 13 | `feat/paleta` | D4: aplicar la paleta elegida a tokens y `chartTheme`, y comprobar el contraste | ~300 |
| 14 | `feat/premium-sistema` | D5 y D6: `docs/design/forma.md`, `Hero`/`Stat`, `EmptyState` con `tone`, transiciones; helper `data-metric` (D1) | ~400 |
| 15 | `feat/premium-dashboard` | D1, D2 y D3: el CTL primero, el selector en la tarjeta de la gráfica con los totales del periodo, el readout solo al pasar el cursor, rejilla equilibrada, KPI en móvil y el CTA de Strava condicional | ~300 |
| 16 | `feat/premium-detalle` | D5 (disposición tipo Strava con el mapa grande), D1 (Coach sin repetir) y C5 (rendimiento del cursor) | ~400 |
| 17 | `feat/premium-salud` | D1 (recuperación una sola vez, sueño una sola vez) y D3 (Hoy/Historial) | ~300 |
| 18 | `feat/premium-rendimiento` | D7 y D1 (héroe sin duplicados y pestañas) | ~400 |
| 19 | `feat/premium-resto` | D8 y D1: Calendario, Actividades y Ajustes | ~350 |
| 20 | `chore/cierre` | D6 (PWA), CHANGELOG, MEMORY, estados de las specs y `lint:orphans` = 0 | ~200 |

## Dependencias y paralelismo
- **Secuencia:** 0 → 1. Desde ahí:
  - Los PR **2 y 3 son independientes** y pueden ir en paralelo con el 4.
  - Después del 4 vienen 5a–c, luego 6, y luego 7a → 7b.
- **PR 8:** puede ir en paralelo con el bloque 5.
- **PR 9, 10 y 11:** van después del 7b.
- **PR 12:** puede prepararse en paralelo con el 8–11. El 13 espera a que el usuario elija la paleta.
- **PR 14:** va después del 13.
- **PR 15–19:** cada uno toca su pantalla, así que pueden llevarse en sesiones o worktrees separados. Se integran de uno en uno, rebasando sobre `develop`.

## Verificación
- **En local:** `npm run verify` (lint, tests, build y `lint:orphans`) en menos de 1 minuto. En el CI, el CI rápido.
- **PR 1:** mide el tiempo de los 3 primeros PR y lo anota en su `tasks.md`.
- **PR visuales:** el agente revisa en el navegador integrado a 390 y 1440 px, en claro y oscuro, con datos reales, y adjunta capturas antes y después.
- **PR 2:** se comprueba además en vivo con una actividad antigua de tu cuenta.

## Acciones del usuario
1. **Aprobar** la spec, el plan y las decisiones D1–D12.
2. **Iniciar sesión** en Forma en el navegador integrado (`http://localhost:5180`).
3. **Tras el PR 3:** rotar el secreto en Strava, ejecutar `supabase secrets set STRAVA_CLIENT_SECRET=…` y `supabase functions deploy strava-token`.
4. **Elegir la paleta** en el PR 12.
5. **Aprobar** cada PR visual.
6. **Opcional:** limpieza de ramas y worktrees locales, y resolver el checkout principal (va 218 commits por detrás).

## Riesgos
- **R1. Sin regresión visual automática, un cambio de estilo puede colarse.** Mitigación: `layout` en DOM, `lint:type`, `lint:colors`, el helper `data-metric` y la revisión visual del agente. Es un riesgo aceptado por el usuario.
- **R2. Retirar v1 cambia producción cuando se mergee a `main`.** Esa decisión se toma aparte.
- **R3. Unificar los umbrales de TSB cambia el diagnóstico de Rendimiento.** Es intencionado.
- **R4. Aplanar la piel (7b) y cambiar la paleta (13) son los PR con más riesgo visual.** Se revisan pantalla a pantalla con capturas.
