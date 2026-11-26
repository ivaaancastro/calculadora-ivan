# MEMORY — Estado persistente de "Forma" (calculadora-ivan)

> Versión corta, se lee al empezar cada sesión. El detalle histórico completo está en
> `docs/memory/memory-archivo-2026-11-12.md` (leer solo la sección que haga falta, con `offset`/`limit`).
> Cada agente actualiza este archivo al terminar su tarea, **sin añadir historia: la historia va a `tasks.md` de la rama**.

## 0. Reglas globales
- Flujo SDD: Especificar → Planificar → Presentar → Tareas → Implementar → Verificar → Registrar (ver `AGENTS.md`).
- Sin spec aprobada no hay código de producción. Ramas desde `develop`; nunca commit a `main`; merge solo vía PR y con autorización del usuario.
- Conventional Commits. Producción **no se toca** durante el rediseño: todo va a `develop`.

## 1. Estado actual
- **Capa 6 hecha** (#140–#163, `docs/branches/feat/capa6-v2-premium/`): v2 única (sin v1), CI de < 3 min sin capturas, secreto de Strava en la Edge Function `strava-token`, tema aplanado (`skin.css` mínimo, texto ≥ 11 px), paleta «Neón profundo» con una sola fuente de color, guía `docs/design/forma.md` y pantallas premium sin métricas repetidas. **Pendiente:** que el usuario apruebe las pantallas (capturas enlazadas en `tasks.md`) y decidir el merge a `main` (cambia producción). Siguiente capa: 7 (iOS).
- **Hecho antes (resumen en `CHANGELOG.md`, detalle en el historial de git):** Capas 0–5 del rediseño y Fase Premium A–D (PR #50–#139). Cada rama conserva su carpeta en `docs/branches/` (D12: se quedan en el repositorio, visibles en GitHub).
- **Pendiente después:** Capa 7 (iOS). Roadmap: `docs/branches/feat/webapp-redesign/plan.md`.
- **Pendientes de producto:** funciones de pago a futuro (no prometer gratuidad); Strava se replantea por sus límites de API y se estudiará **Garmin**. Deuda de la Capa 4: `robots.txt`/`og:image` y CSS bloqueante.
- `feat/webapp-redesign` remoto = intento descartado: no hacer `git pull` ahí ni usar `archive/webapp-redesign-v1` ni `stash@{0}`.
- **Skill de la landing:** `.taste-skill/` (ignorado por git), solo para las páginas públicas.

## 2. Reglas de trabajo del rediseño (resumen)
- **Colores:** una sola fuente, `src/styles/tokens.css` (`:root`/`.dark`) → `tailwindTokens.cjs` → Tailwind; `chartTheme.js` solo nombra tokens y lee sus valores de tokens.css. Nunca un hex suelto. `lint:colors` y `lint:motion` son trinquetes (solo bajan); `lint:palette` exige AA.
- **Diseño:** reglas y primitivas (`Hero`, `Stat`, `Delta`, `EmptyState`, `Segmented tabs`) en `docs/design/forma.md`. Un dato, un sitio (`e2e/metrics.spec.js`); cada control junto a lo que cambia.
- **Copias « 2»:** el repositorio vive en una carpeta sincronizada que crea copias `* 2.*` (también en `.git/refs`); están en `.gitignore`. Si `git fetch` falla con «bad object … 2», mover esa ref duplicada fuera de `.git`.
- **Primitivas:** `src/components/ui/` (`npm run lint:ui`, 14). «Centralizar sin unificar»; `className` solo para colocación y espaciado.
- **Cabecera:** mide exactamente `--nav-h` (60 px); nunca debe crecer.
- **Verificación (Capa 6, `AGENTS.md` §8 bis):** `npm run verify` en local; el CI rápido (< 5 min: `check` + `e2e` funcional y DOM, sin capturas ni `style-diff`); revisión visual del agente en el navegador integrado (puerto 5180) con capturas antes/después en los PR de diseño.
- Detalle de codemods, volcados, precedencia de `dark:` y trampas conocidas: archivo histórico, secciones «Cómo trabajar con…».

## 3. Contexto técnico
- Entrada `src/main.jsx` → `src/App.jsx`; store `src/store/useAppStore.js`; Supabase `src/supabase.js`; motores en `src/utils/`. `npm run lint:orphans` vigila que no queden ficheros sin importar.
- Tests: `src/__tests__/{unit,integration}`; E2E en `e2e/` (puerto 5273, datos simulados, fecha fija 2026-06-15); migraciones en `migrations/`.
- Auditoría vigente: `docs/branches/feat/capa6-v2-premium/auditoria.md`.

## 4. Specs
Todas en `docs/specs/` y `docs/branches/`. Tabla completa con estados: `docs/memory/` (archivo histórico, sección 3).

---
Última actualización: 2026-11-26
