# Plan: Tarjetas explicativas en cada dato del resumen del detalle

Rama: `feat/tarjetas-explicativas-detalle` (desde `develop` en `22a93c0`)
Spec: `docs/branches/feat/tarjetas-explicativas-detalle/spec.md`

## Contexto del proyecto (MEMORY.md)
- Stack: React 19, Vite 7, Tailwind 3, Zustand, TanStack Query, Supabase, Vitest/MSW/Playwright.
- v1 congelada: cualquier valor visual nuevo va detrás de `html[data-ui="v2"]` y con capturas propias.
- Colores: tokens en `src/styles/tokens.css` → `tailwindTokens.cjs` → Tailwind. Nunca un hex suelto.
- Primitivas: `src/components/ui/` (14). «Centralizar sin unificar»; `className` solo para colocación y espaciado.
- Tests: `src/__tests__/{unit,integration}` con Vitest. E2E en `e2e/` (Docker, puerto único, candado `/tmp/forma-docker.lock`).
- Componente `Stat` en `src/components/ui/Stat.jsx` (recetas en `statClasses.js`).
- Componente `Modal` en `src/components/ui/Modal.jsx` (variante `sheet` disponible para bottom-sheet).
- `InfoTooltip` ya existe como referencia de comportamiento (burbuja, Escape, clic fuera).
- `ActivityDetailPage.jsx` muestra métricas con `Stat` en el header (desktop) y en cuadrícula bajo el mapa (móvil).

## Tareas de implementación

### T1. Módulo de textos centralizados
Crear `src/utils/activityMetricDescriptions.js`:
- Exportar objeto `ACTIVITY_METRIC_DESCRIPTIONS` claveado por `metricId`.
- Cada entrada: `{ id, label, description }` (texto sencillo, 1-3 frases).
- Cubrir al menos: `tss`, `if`, `np`, `work`, `hrAvg`, `pace`, `speed`, `distance`, `elevation`, `cadence`, `wattsAvg`, `ef`, `decoupling`.
- Sin hex sueltos ni lógica de UI; solo datos de texto.

### T2. Componente de tarjeta explicativa (`MetricTooltip`)
Crear `src/components/ui/MetricTooltip.jsx` (+ `metricTooltipClasses.js` si aplica):
- Recibe `metricId` (o `label`/`description` directos) y los hijos (el elemento que dispara).
- **Sin ícono `?` visible:** el disparador es el `Stat` completo (etiqueta + número + unidad).
- Escritorio: popover anclado al disparador (posición absoluta relativa).
- Móvil (`< sm`): bottom-sheet usando `Modal` variante `sheet`.
- Accesibilidad: `role`, `aria-describedby`, foco al abrir, Escape cierra, clic fuera cierra.
- Área táctil del disparador ≥ 44 px en v2. **Sin `border-b` (no hay rayita inferior).**
- No usar hex sueltos; usar tokens de Tailwind/tokens.css.

### T3. Integración en ActivityDetailPage
- Envolver cada `Stat` del resumen superior con `MetricTooltip`, pasando el `metricId` correspondiente.
- Cada `Stat` del detalle **no tiene borde perimetral ni rayita inferior** (se deja como en v1 original). Esto solo afecta al detalle de actividad.
- Mantener el comportamiento visual existente de `Stat` en otras partes de la app.
- Asegurar que el área táctil cumpla los 44 px en v2.

### T4. Tests unitarios
- `src/__tests__/unit/activityMetricDescriptions.test.js`: todas las métricas tienen `label` y `description` no vacíos; `id` único.
- `src/__tests__/unit/uiMetricTooltip.test.jsx`: pinta disparador + contenido; abre/cierra; Escape cierra; clic fuera cierra; atributos ARIA.
- Tests existentes de `Stat` y `Modal` siguen pasando.

### T5. Test de integración
- `src/__tests__/integration/activityDetailMetricTooltip.test.jsx`: renderiza una métrica del detalle, pulsa, verifica que aparece el texto explicativo; pulsa Escape / fuera, verifica que se cierra.

### T6. Verificación
- `npm run lint`, `npm run lint:colors`, `npm run lint:ui`.
- `npm run test:unit` (o el script de tests unitarios) y tests de integración.
- `npm run build`.
- `node scripts/style-diff.mjs` entre develop y la rama: 0 diferencias en v1.

### T7. Registro
- Marcar spec como implementada en `spec.md` y `docs/specs/README.md`.
- Actualizar `CHANGELOG.md` y `MEMORY.md`.

## Criterios de aprobación (definición de "hecho")
Todas las tareas T1–T7 completas, tests verdes, build pasa, style-diff 0 en v1, y el usuario aprueba la implementación antes del PR.
