# Plan — spec-rediseno-02-c2 (Capa 2: primitivas)

Basado en `spec.md` (misma carpeta), en el roadmap (`docs/branches/feat/webapp-redesign/plan.md`, "Capa 2 — Primitivas"), en el cierre de la Capa 1 (`docs/branches/feat/ui-tokens/tasks.md`) y en `MEMORY.md` (5b).

## Ramas y PR
Cada rama sale de `develop` actualizado justo después de mergear la anterior, y su PR va hacia `develop`. No se mergea nada sin autorización explícita. Ni `main` ni producción se tocan.

| PR | Rama | Familia | Qué retira | Depende de |
|---|---|---|---|---|
| 0 | `feat/ui-primitives` | Infraestructura: `ui/`, volcado ampliado, `lint:ui`, inventario; esta spec y este plan | 14 clases sin uso de `index.css`, `MetricHelp` | — |
| 1 | `feat/ui-primitives-card` | `Card`, `SectionHeader` | `ios-card`, `ios-touch`, `ios-header`, `IosCard` | 0 |
| 2 | `feat/ui-primitives-stat` | `Stat`, `StatTile` | `MetricCard` | 1 (`StatTile` compone `Card`) |
| 3 | `feat/ui-primitives-segmented` | `Segmented` | `PillTab` | 0 |
| 4 | `feat/ui-primitives-field` | `Input`, `Select` | — (recetas locales) | 0 |
| 5 | `feat/ui-primitives-button` | `Button`, `IconButton` | — (recetas locales) | 0 |
| 6 | `feat/ui-primitives-modal` | `Modal` | — | 4 y 5 (los modales contienen campos y botones ya migrados) |
| 7 | `feat/ui-primitives-tooltip` | `ChartTooltip` (+ `InfoTooltip` si D4 d) | `CustomTooltip`, `CustomChartTooltip`, `HistoryChartTooltip`, `tooltipStyleFor` en `chartTheme.js` | 0 |
| 8 | `feat/ui-primitives-loading` | `LoadingState` | `LazyFallback` ×2 | 0 |
| Cierre | `docs/ui-primitives-close` | Cobertura final, `MEMORY.md`, `CHANGELOG.md`, roadmap | — | todos |

**Por qué este orden:** primero lo que más se repite y retira las clases `ios-*` (Card), y después lo que se apoya en ello (Stat). Siguen los controles que aparecen dentro de las tarjetas (Segmented) y los de formulario (Field y Button, de menor cobertura). Modal va después porque contiene campos y botones, y así su PR solo toca la estructura del modal. Tooltip y LoadingState son independientes y van al final porque D4 (c, d) puede cambiar su alcance. Los PR del 3 al 5 se pueden reordenar si alguno se bloquea.

## PR 0 — Infraestructura (`feat/ui-primitives`)
1. `src/components/ui/index.js` y `cx.js`, con prueba. `index.js` empieza vacío: `lint:ui` exige uso, así que cada primitiva llega con su familia.
2. `scripts/ui-inventory.mjs <familia>`: el recorrido del AST de la sección 3.4 de la spec (recetas por elemento, sin clases de colocación y espaciado), con salida `archivo:línea → receta`. Con pruebas.
3. `scripts/check-ui.mjs` y `scripts/ui-retired.json`, `npm run lint:ui` y un paso en CI después de `lint:colors`. Con pruebas.
4. `e2e/tools/style-dump.spec.js`: `STYLE_DUMP_PROPS=full` (spec 6.5) y los estados nuevos (planificador, visor de entreno, tooltip activo en Salud "Historial" y en Rendimiento). Dos volcados seguidos de `develop` con `full` dan 0 diferencias. Si alguna propiedad no es estable, se excluye en su ámbito y se anota.
5. **Prueba de que la red detecta lo nuevo:** un cambio de relleno de 2 px en una `ios-card` y de `rounded-2xl` → `rounded-xl` en otra se detecta con `full` y no con el volcado de color. Después se retira.
6. Retirar de `index.css` las 14 clases sin uso y de `ActivitySharedUI.jsx` `MetricHelp`. Volcado `full` frente a `develop`: 0 diferencias.
7. Verificación completa, `tasks.md` y PR (incluye `spec.md` y `plan.md`).

## PR 1 a 8 — Una familia por PR
Los mismos pasos en cada PR:
1. `node scripts/ui-inventory.mjs <familia>` en `develop`: lista de usos y recetas, copiada en `tasks.md`.
2. Elegir las variantes según RF2: receta con ≥ 2 usos idénticos o necesaria por la familia. Lo que no encaja se lista con su motivo.
3. Tokens exactos que hagan falta (D2), con su tabla `.json`, `--tokens` y prueba de paridad si son de gráfica.
4. Escribir la primitiva y sus pruebas unitarias.
5. Sustituir los usos (mecánico, un commit) y eliminar las clases o componentes retirados (otro commit). Si D4 aprueba un cambio de comportamiento para esta familia, va en un tercer commit con su prueba E2E.
6. `lint:colors -- --update` si baja, y `ui-retired.json`.
7. Verificación (abajo), cobertura en `tasks.md` y PR.

Notas por familia:
- **PR 1, Card:** las clases `ios-*` estaban en `@layer utilities` y ganaban a las utilidades de Tailwind (ver spec 6.2, corrección): el borde y el texto de peligro de "Zona de peligro" y el `mb-3` de 4 títulos de Salud no se veían y se retiran, sin `tone`. La sombra de la tarjeta pasa a `--shadow-card` (`shadow-card`); `dark:shadow-none` se mantiene como clase. Lo confirma el volcado `full` (`box-shadow`, `margin`, `border-color`, `color`).
- **PR 2, Stat:** el borde de `MetricCard` pasa al token `hairline-5` (D2). `StatTile` solo cubre el Dashboard (`lg`, `sm`); las fichas de Salud se quedan con `Card pressable` (alcance acordado el 2026-11-09, ver spec 6.2).
- **PR 3, Segmented:** antes de tocar nada, comprobar que los E2E y el volcado (estados `calendario-forma`, `detalle-mapa`) localizan las opciones por rol `button` y nombre: `aria-pressed` no cambia ni el rol ni el nombre. Hecho. `pill` solo cubre `PillTab` (alcance acordado el 2026-11-09, ver spec 6.2), y los conmutadores `mini` se comparan con una prueba temporal porque el volcado no los ve.
- **PR 4, Field:** las pruebas de integración de `AddActivityModal`, `HistoryList` y `ProfilePage` deben pasar sin tocarlas. Los campos de acceso con D-08 no entran.
- **PR 5, Button:** se respeta el `type` de cada botón original (`submit` en los formularios de acceso y de añadir).
- **PR 6, Modal:** el volcado ya cubre `modal-anadir` y `modal-acceso`. El PR 0 añade el planificador y el visor. El z-index de cada modal (`z-50`, `z-[60]`) se conserva.
- **PR 7, Tooltip:** la prueba nueva de toque fija que hoy se abren al tocar en Dashboard, Salud (Historial) y Rendimiento (spec 3.5, corregida). El estado `dashboard-punto-activo` del volcado cubre el marco `glass`.

## Verificación de cada PR
En este orden. Los resultados se copian en `tasks.md` y en el PR:
1. `npm run lint`, `npm run lint:colors` (sin subir en ningún archivo), `npm run lint:ui`.
2. `npm run test:unit` y `npm run test:integration`.
3. `npm run build`.
4. `npm run test:e2e` en macOS: 79 ✓ más las pruebas nuevas, con `E2E_PORT` 5273. El servidor del usuario en 5173 no se toca.
5. `npm run test:e2e:docker` (OrbStack; si está parado, `orb start`): 48 capturas sin diferencias. El ✘ de `gestures.spec.js:37` es D-01, el fallo esperado. Si cambiara alguna referencia, se revisa una a una y se para a consultar antes de aceptarla.
6. Volcado `full` de `develop` y de la rama (`STYLE_DUMP_PROPS=full STYLE_DUMP_DIR=<dir> npx playwright test e2e/tools/style-dump.spec.js`, con otro `E2E_PORT` si se usa un worktree) y `node scripts/style-diff.mjs <develop> <rama>`: **0 diferencias**.
7. CI del PR en verde. Si difiere de local, manda el CI.
8. Informe táctil (`e2e/touch.spec.js`): la cifra por pantalla se anota y no debe subir (D5).

## Riesgos
| Riesgo | Mitigación |
|---|---|
| El volcado ampliado no es estable (animaciones, mapa) | Paso 4 del PR 0: dos volcados de `develop` iguales antes de empezar, con exclusiones documentadas |
| Una primitiva cambia la precedencia al juntar clases | Volcado `full` con estados forzados; la receta afectada queda fuera (RF2) |
| `className` como vía para colar estilos | `lint:ui` (RF3) y revisión del diff |
| Variantes con nombre de pantalla, imposibles de unificar | Nombres por papel y tamaño (spec 6.2); la Capa 3 fusiona variantes en `ui/` |
| PR demasiado grandes (Stat, Segmented) | Sustitución mecánica en un commit aparte; si pasa de ~600 líneas, se parte por pantalla |
| Conflictos con otro trabajo en `develop` | Una rama por familia, recién salida de `develop` |

## Lo que no se toca
`src/hooks`, `src/utils`, `src/services`, `src/store`, `src/supabase.js`, `main`, producción, `.opencode/skills/git-release/SKILL.md` (no entra en ningún commit), `feat/webapp-redesign` (sin `git pull`), `archive/webapp-redesign-v1` y `stash@{0}`. Sin `git stash`.

## Primer paso tras la aprobación
1. Recoger en `spec.md` (sección 8) lo que decidas sobre D1 a D6.
2. Crear `tasks.md` en esta carpeta.
3. Empezar el PR 0 en `feat/ui-primitives`, que ya existe y sale de `develop` en `f77aea0`.

---
Versión: 0.1.0 — 2026-11-09
