# Spec: Borrar una actividad desde el detalle, con confirmación

## 1. Identificación
- **ID:** `spec-detalle-borrar-actividad`
- **Título:** Conectar el botón de papelera del detalle de actividad y pedir confirmación antes de borrar
- **Autor:** agente (sesión SDD)
- **Fecha:** 2026-11-19
- **Estado:** pendiente (a la espera de aprobación del usuario; decisiones D1–D7 abiertas)

## 2. Objetivo
Que la papelera del detalle de actividad borre de verdad la actividad, previa confirmación explícita en un diálogo accesible (primitiva `Modal`), y que tras borrar el usuario vuelva a donde estaba con un aviso. Mismo comportamiento seguro en la lista de Actividades (D1).

## 3. Contexto y justificación
Hallazgos de la investigación (código a `develop` = `7c10d27`):

- **El botón no está conectado.** `ActivityRouteWrapper.jsx` monta `ActivityDetailPage` con `activity`, `settings`, `fetchStreams` y `onBack`, pero **no `onDelete`**. `DetailHeader.jsx` (dos botones: escritorio l.24 y móvil l.60, `title="Eliminar actividad"`) hace `onDelete && onDelete(activity.id)`, así que el clic no hace nada. El test `ActivityDetailPage.test.jsx` solo comprueba que se llama a la prop, por eso no lo detectó (mismo patrón que la regresión de «Volver»).
- **Cómo se borra hoy.** `useActivitiesData.deleteActivity(id)` → `deleteActivityMutation` (`useActivitiesQuery.ts`): `supabase.from('activities').delete().eq('id', id).eq('user_id', userId)`; en `onSuccess` filtra la caché `['activities']` (las métricas derivadas —CTL/ATL, calendario, resúmenes— se recalculan solas desde esa caché). Muestra `toast.success('Actividad borrada.')` o `toast.error('No se pudo borrar la actividad.')`. **No pide confirmación y captura el error sin relanzarlo ni devolver nada** (el llamador no sabe si salió bien). No hay tablas hijas de `activities` (`streams_data` va en la propia fila).
- **Otras pantallas.** `HistoryList.jsx` (l.236, `data-history="delete"`) llama a `onDelete(act.id)` **directamente, sin confirmar**: un clic accidental borra. `CalendarPage` recibe `onDelete` pero no lo usa para actividades. Para el resto del sistema ya hay confirmaciones con `window.confirm` (borrar todo, cuenta, entreno planificado, sincronización profunda) — feas y no accesibles, pero fuera de alcance.
- **Efecto colateral si se conecta sin más:** al borrar, la caché pierde la actividad y `ActivityRouteWrapper` hace `if (!activity) return null` → pantalla en blanco hasta que navegue. Hay que navegar sin parpadeo.
- **Strava.** `handleStravaSync` (`useStravaSync.js`) importa con `existingIds` = las actividades *actuales* (`strava_id`) y pide a Strava solo lo posterior a la actividad más reciente menos 1 día (`after=`). Consecuencia: una actividad de Strava borrada **vuelve a importarse en la siguiente sincronización solo si es la más reciente o está dentro de ~24 h de ella**; las más antiguas no se vuelven a pedir. No existe «lista de excluidas». Es un comportamiento preexistente de la lista de Actividades, no introducido aquí; se avisa en el diálogo (D4).
- **Primitivas.** `Modal` (`src/components/ui/Modal.jsx`) ya da `role="dialog"`, `aria-modal`, `aria-labelledby`, Escape (solo el de arriba), bloqueo de scroll y, con `trapFocus`, foco inicial/atrapado/devuelto. Recetas por variante en `modalClasses.js` (no hay una de «confirmación»).

## 4. Requisitos funcionales
- [ ] RF1. La papelera del detalle (escritorio y móvil) abre un diálogo de confirmación; **no borra** al primer clic.
- [ ] RF2. El diálogo (`Modal` con `trapFocus`) tiene título («¿Eliminar actividad?»), el nombre y la fecha de la actividad, el aviso «No se puede deshacer», y los botones **Cancelar** (primero en el orden de foco, foco inicial) y **Eliminar** (variante de peligro).
- [ ] RF3. Cancelar, Escape y (D6) tocar fuera cierran sin borrar; el foco vuelve a la papelera.
- [ ] RF4. Eliminar llama a `deleteActivity(id)`. Mientras se borra: botones deshabilitados (`aria-busy`), sin doble envío, Escape/fuera no cierran.
- [ ] RF5. Si sale bien: toast «Actividad borrada.» (ya existe), la actividad desaparece de caché/estado y se navega a la pantalla de origen (misma lógica que «Volver»: `navigate(-1)`, o `/history` en URL directa) **sin pantalla en blanco intermedia**.
- [ ] RF6. Si falla (red, RLS, sesión): toast de error (ya existe), el diálogo **sigue abierto** con los botones habilitados para reintentar o cancelar; la actividad no desaparece.
- [ ] RF7. `deleteActivity` pasa a **devolver `true`/`false`** (sin cambiar sus toasts) para que el llamador sepa el resultado. Sigue sin pedir confirmación (la confirmación vive en la UI, no en el hook).
- [ ] RF8. (D1) La papelera de `HistoryList` usa el mismo diálogo; `stopPropagation` se conserva (no abre el detalle).
- [ ] RF9. Si la actividad tiene `strava_id`, el diálogo añade el aviso de Strava (D4).
- [ ] RF10. v1 intacta: ningún valor visual nuevo se aplica fuera de `html[data-ui="v2"]` salvo el diálogo nuevo, que solo existe al abrirlo (volcado de estilos `style-diff` = 0 con el diálogo cerrado).
- [ ] RF11. v2 con primitivas (`Modal`, `Button`); sin hex sueltos (`lint:colors` no sube), sin `className` de estilo (solo colocación/espaciado), objetivos táctiles ≥ 44 px en móvil v2.

## 5. Criterios de aceptación
- [ ] En el detalle (v1 y v2, escritorio y móvil) pulsar la papelera abre el diálogo y no borra; Cancelar/Esc lo cierra, la actividad sigue ahí y el foco vuelve a la papelera.
- [ ] Confirmar borra la fila en Supabase (`DELETE …/activities?id=eq.X&user_id=eq.U`), muestra el toast, vuelve al origen (`/history` o `/calendar`) y la actividad no aparece en la lista ni en el calendario.
- [ ] Con la petición fallando (500/offline), sale el toast de error, el diálogo sigue abierto y nada se pierde; al reintentar con éxito, funciona.
- [ ] Doble clic en «Eliminar» envía una sola petición.
- [ ] Tab/Mayús+Tab no salen del diálogo; lector de pantalla anuncia el título y la descripción (`aria-labelledby` + `aria-describedby` si se añade, ver plan).
- [ ] La lista de Actividades también pide confirmación (D1) y el clic en la papelera no abre el detalle.
- [ ] `npm run lint`, `lint:ui`, `lint:colors`, tests unitarios/integración, build y E2E verdes; `style-diff` v1 = 0; capturas v2 del diálogo (claro/oscuro, móvil/escritorio) generadas solo en Docker y revisadas una a una.

## 6. Diseño técnico
- **Nuevo componente:** `src/components/activity/ConfirmDeleteActivityModal.jsx` — props `{ activity, open, busy, onConfirm, onCancel }`; usa `Modal` (`trapFocus`, `labelledBy`, `closeOnBackdrop` según D6) y `Button`. Una variante nueva `confirm` en `modalClasses.js` (diálogo centrado, `max-w-sm`, receta con tokens existentes; z-index `z-sheet`).
- **Nuevo hook:** `src/hooks/useConfirmDeleteActivity.js` — `{ request(activity), dialog }`: guarda la actividad pendiente y `busy`, ejecuta `await deleteActivity(id)` y, si devuelve `true`, cierra y llama a `onDeleted?.()`; si `false`, mantiene abierto (RF6). Lo comparten detalle y lista.
- **Componentes afectados:** `ActivityRouteWrapper.jsx` (recibe `deleteActivity`, pasa `onDelete`, conserva la última actividad en un `useRef` para no devolver `null` durante la salida y navega con `handleBack` tras borrar); `Dashboard.jsx` (pasa `deleteActivity` al wrapper y a `HistoryList`); `ActivityDetailPage.jsx` (usa el hook; el botón `onDelete(activity.id)` pasa a pedir confirmación); `DetailHeader.jsx` sin cambio de marcado (opcional: `aria-label`); `HistoryList.jsx` (D1).
- **Hooks afectados:** `useActivitiesData.js` (`deleteActivity` devuelve boolean).
- **Servicios / store / rutas / BD:** sin cambios. No hay migración ni tombstone (ver D4).
- **Estilos:** solo `modalClasses.js` (variante `confirm`) y recetas de `Button` existentes (`danger`/`ghost`; comprobar que hay variante de peligro con relleno, si no, reutilizar la que usa el visor/planificador).
- **Textos:** en español, en el propio componente (no hay i18n).

## 7. Pruebas
- **Unitarias** (`src/__tests__/unit/`): `useConfirmDeleteActivity` (abre/cancela/éxito/fallo/doble envío); `useActivitiesData.deleteActivity` devuelve `true`/`false` y mantiene los toasts; `modalClasses` incluye `confirm` (los tests de la primitiva ya existentes siguen verdes).
- **Integración** (`src/__tests__/integration/`): `ActivityDetailPage` — clic en papelera abre diálogo y no llama a `onDelete`; Cancelar/Esc no llama; Eliminar llama con `'a1'`; aviso de Strava solo con `strava_id` (actualizar el test existente, que hoy espera borrado directo); `ActivityRouteWrapper` — con `deleteActivity` simulado, navega al origen tras borrar y no renderiza `null` en medio; `HistoryList` — clic abre diálogo, confirma y no dispara `onSelectActivity`.
- **E2E** (`e2e/detail-delete.spec.js`, v1 y v2): ampliar `mockApp.js` para que `DELETE …/activities` elimine la fila de `state.activities` (hoy responde `[]` sin tocar); casos: cancelar, Esc, confirmar → vuelve a `/history` y la fila ya no está; error 500 → diálogo abierto + toast + reintento; desde `/calendar` vuelve a `/calendar`; URL directa vuelve a `/history`; teclado (foco inicial en Cancelar, trampa de foco, foco devuelto). Capturas visuales v2 del diálogo en `visual-v2` (Docker).

## 8. Notas adicionales
### Decisiones abiertas (recomendación primero)
| # | Decisión | Recomendación | Alternativa |
|---|---|---|---|
| D1 | Alcance: ¿también la lista de Actividades? | **Sí**: mismo diálogo en `HistoryList` (hoy borra sin confirmar; es el mismo riesgo y el coste es mínimo con el hook compartido). | Solo detalle; lista en otra spec. |
| D2 | Confirmación: ¿`window.confirm` o `Modal`? | **`Modal` + `Button`** (accesible, consistente v1/v2, testeable). | `window.confirm` (rápido, feo, difícil de probar en E2E/Docker). |
| D3 | Tras borrar: ¿destino? | **Origen** (`navigate(-1)`, o `/history` por URL directa), con toast existente. | Siempre `/history`. |
| D4 | Strava: ¿qué hacer con la reimportación? | **Aceptar el comportamiento actual y avisarlo** en el diálogo solo si hay `strava_id` («Si sigue en Strava, podría volver a importarse al sincronizar»). Sin tablas nuevas. | Tabla de excluidas (`deleted_strava_ids`, migración + filtro en sync): spec propia, tocaría producción/Supabase. |
| D5 | Fallo de red: ¿cerrar o mantener abierto? | **Mantener abierto** con toast de error para reintentar. | Cerrar y solo toast. |
| D6 | ¿Cerrar al tocar fuera (`closeOnBackdrop`)? | **No** en confirmaciones destructivas (solo Cancelar/Esc), para evitar cierres accidentales en móvil. | Sí, como el visor. |
| D7 | Botón destructivo: ¿foco inicial? | **Cancelar** (opción segura primero en el DOM). | Eliminar. |

### Fuera de alcance
Sustituir los demás `window.confirm`; deshacer («snackbar con Deshacer»: requeriría borrado diferido o papelera); tombstones de Strava (D4); borrar actividades en el Calendario.

### Riesgos
- La caché se vacía antes de navegar → mitigado con `useRef` en el wrapper.
- `Modal` solo bloquea scroll con una pila: no interfiere con el detalle (sin otros modales abiertos).
- El test existente de `ActivityDetailPage` cambia de contrato (clic ya no llama a `onDelete` al instante).

---
Versión: 0.1.0 — 2026-11-19
