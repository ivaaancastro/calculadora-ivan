# MEMORY — Estado persistente de "Forma" (calculadora-ivan)

> Versión corta, se lee al empezar cada sesión. El detalle histórico completo está en
> `docs/memory/memory-archivo-2026-11-12.md` (leer solo la sección que haga falta, con `offset`/`limit`).
> Cada agente actualiza este archivo al terminar su tarea, **sin añadir historia: la historia va a `tasks.md` de la rama**.

## 0. Reglas globales
- Flujo SDD: Especificar → Planificar → Presentar → Tareas → Implementar → Verificar → Registrar (ver `AGENTS.md`).
- Sin spec aprobada no hay código de producción. Ramas desde `develop`; nunca commit a `main`; merge solo vía PR y con autorización del usuario.
- Conventional Commits. Producción **no se toca** durante el rediseño: todo va a `develop`.

## 1. Estado actual
- **Capa 6 en curso** (`docs/branches/feat/capa6-v2-premium/`: spec v0.3, plan de 21 PR, auditoría y `tasks.md` con el progreso). v2 es la única interfaz; v1 retirada (PR 4 y 5a–c). Siguiente: tema y piel aplanada (7a/7b), bugs y utils (8–11), paleta elegida por el usuario (12–13) y pantallas premium (14–19).
- **Hecho antes (resumen en `CHANGELOG.md`, detalle en el historial de git):** Capas 0–5 del rediseño y Fase Premium A–D (PR #50–#139). Las carpetas de `docs/branches/` de esas ramas se borraron en la Capa 6 (D12).
- **Pendiente después:** Capa 7 (iOS). Roadmap: `docs/branches/feat/webapp-redesign/plan.md`.
- **Pendientes de producto:** funciones de pago a futuro (no prometer gratuidad); Strava se replantea por sus límites de API y se estudiará **Garmin**. Deuda de la Capa 4: `robots.txt`/`og:image` y CSS bloqueante.
- `feat/webapp-redesign` remoto = intento descartado: no hacer `git pull` ahí ni usar `archive/webapp-redesign-v1` ni `stash@{0}`.
- **Skill de la landing:** `.taste-skill/` (ignorado por git), solo para las páginas públicas.

## 2. Reglas de trabajo del rediseño (resumen)
- **Colores:** tokens en `src/styles/tokens.css` → `tailwindTokens.cjs` → Tailwind. Gráficas: `chartTheme.js` + `useChartTheme()`; nunca un hex suelto. `npm run lint:colors` es trinquete (solo baja).
- **Primitivas:** `src/components/ui/` (`npm run lint:ui`, 14). «Centralizar sin unificar»; `className` solo para colocación y espaciado.
- **Cabecera:** mide exactamente `--nav-h` (60 px); nunca debe crecer.
- **Verificación (Capa 6, `AGENTS.md` §8 bis):** `npm run verify` en local; el CI rápido (< 5 min: `check` + `e2e` funcional y DOM, sin capturas ni `style-diff`); revisión visual del agente en el navegador integrado (puerto 5180) con capturas antes/después en los PR de diseño.
- Detalle de codemods, volcados, precedencia de `dark:` y trampas conocidas: archivo histórico, secciones «Cómo trabajar con…».

## 3. Contexto técnico
- Entrada `src/main.jsx` → `src/App.jsx`; store `src/store/useAppStore.js`; Supabase `src/supabase.js`; motores en `src/utils/`. `npm run lint:orphans` vigila que no queden ficheros sin importar.
- Tests: `src/__tests__/{unit,integration}`; E2E en `e2e/` (puerto 5273, datos simulados, fecha fija 2026-06-15); migraciones en `migrations/`.
- Auditoría vigente: `docs/branches/feat/capa6-v2-premium/auditoria.md`.

## 4. Specs
Specs vivas en `docs/specs/` y `docs/branches/`. Las cerradas, en el historial de git y en `docs/memory/` (archivo histórico, sección 3).

---
Última actualización: 2026-11-19
