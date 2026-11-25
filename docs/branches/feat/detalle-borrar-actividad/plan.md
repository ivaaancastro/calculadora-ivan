# Plan: Borrar actividad desde el detalle, con confirmación

Deriva de `spec.md` (spec-detalle-borrar-actividad) y `MEMORY.md`. **Sin `tasks.md` ni código hasta que el usuario apruebe spec + plan y cierre D1–D7.**

Rama: `feat/detalle-borrar-actividad` (desde `develop`). PR a `develop`; el agente nunca lo mergea. Commits Conventional; `git add` por ruta explícita (nunca `-A`: hay duplicados « 2» de Finder). Salidas de lint/test/build filtradas (`| tail -20`). Una sesión basta (cambio pequeño, ~1 día).

## Fase 0 — Cierre de decisiones
- Usuario responde D1–D7 (recomendaciones en la spec). Se crea `tasks.md` solo entonces.

## Fase 1 — Núcleo sin UI (TDD, primero en rojo)
| Tarea | Detalle |
|---|---|
| T1 | `useActivitiesData.deleteActivity` devuelve `true`/`false`; test unitario (éxito, error, toasts intactos). |
| T2 | `useConfirmDeleteActivity` (estado `pending`/`busy`, doble envío, éxito cierra y llama `onDeleted`, fallo mantiene abierto — D5); tests unitarios. |

## Fase 2 — Diálogo
| Tarea | Detalle |
|---|---|
| T3 | Variante `confirm` en `modalClasses.js` (tokens existentes, `z-sheet`); ajustar `uiModal.test.jsx`. Comprobar variante `danger` de `Button`; si falta, reutilizar la del visor. |
| T4 | `ConfirmDeleteActivityModal.jsx` (título, nombre/fecha, «No se puede deshacer», aviso Strava si `strava_id`, Cancelar + Eliminar, `busy`, `trapFocus`, `closeOnBackdrop` según D6); test de integración de accesibilidad (rol, nombre, foco inicial, Esc, Tab). |

## Fase 3 — Conexión
| Tarea | Detalle |
|---|---|
| T5 | `Dashboard.jsx` pasa `deleteActivity` a `ActivityRouteWrapper`; este pasa `onDelete`, guarda la última actividad en `useRef` (sin `null` en medio) y navega con `handleBack` al borrar. Test `ActivityRouteWrapper`. |
| T6 | `ActivityDetailPage.jsx` usa el hook y monta el diálogo; actualizar `ActivityDetailPage.test.jsx` (la papelera abre el diálogo; confirmar llama a `onDelete('a1')`). |
| T7 | (D1) `HistoryList.jsx` usa el hook/diálogo; test: no propaga a `onSelectActivity`. |

## Fase 4 — E2E y verificación
| Tarea | Detalle |
|---|---|
| T8 | `e2e/support/mockApp.js`: `DELETE …/activities` quita la fila de `state.activities` (y permite forzar 500). |
| T9 | `e2e/detail-delete.spec.js` (v1 y v2): cancelar, Esc, confirmar (vuelve a origen y desaparece), error + reintento, calendario, URL directa, teclado. Ajustar `activities.spec.js` si borraba sin confirmar. |
| T10 | `npm run lint`, `lint:ui`, `lint:colors`, `npm test` (dot), `build`, `tsc` si aplica; `node scripts/style-diff.mjs` develop vs rama = 0 (v1). Capturas v2 del diálogo **solo en Docker** (`test:e2e:docker`, `:update` para las nuevas), revisar una a una. |

## Fase 5 — Registro
| Tarea | Detalle |
|---|---|
| T11 | `CHANGELOG.md` (Fixed/Added), `MEMORY.md` (estado, ≤ unas líneas), marcar spec «implementada», crear `tasks.md` con checks. |
| T12 | Commits por fase, push y PR a `develop` (cuerpo con resumen, pruebas, capturas, decisiones). Enlazar con `bind_pr`. Sin merge. |

## Orden de commits previsto
1. `docs(detalle): spec y plan de borrar actividad con confirmación` (esta fase)
2. `fix(actividades): deleteActivity devuelve el resultado` (T1–T2)
3. `feat(ui): diálogo de confirmación para borrar actividad` (T3–T4)
4. `fix(detalle): conectar la papelera con confirmación` (T5–T6, T8–T9)
5. `fix(actividades): confirmar antes de borrar en la lista` (T7)
6. `docs: registrar borrar actividad (CHANGELOG, MEMORY, tasks)` (T11)

## Riesgos y mitigaciones
- Pantalla en blanco al vaciarse la caché → `useRef` + navegar tras `true` (T5).
- Reimportación de Strava de la última actividad → aviso en diálogo; tombstones quedan como spec futura (D4).
- Capturas inestables → solo Docker; sin lectura en bloque de PNG (AGENTS §8).
