# Especificación SDD — spec-e2e-01 (Pruebas E2E críticas)

## 1. Identificación
- **ID:** spec-e2e-01
- **Título:** Pruebas E2E críticas (auth, dashboard, Strava sync, exportación de datos)
- **Autor:** agente de implementación (Forma / calculadora-ivan)
- **Fecha:** 2026-11-05
- **Estado:** implementada

## 2. Objetivo
Añadir pruebas E2E (Playwright) que cubran los flujos críticos de la aplicación: autenticación, carga y visualización del dashboard, sincronización con Strava y exportación de datos (CSV), garantizando que los caminos felices y los casos de error comunes funcionen en el navegador real.

## 3. Contexto y justificación
- Actualmente `e2e/` solo tiene `auth.spec.js` (1 test, sin login real) y `dashboard.spec.js` (test vacío/comentado). No hay cobertura E2E de flujos críticos.
- El informe de auditoría (sección 4.3 E2E faltantes) y el roadmap (MEMORY.md, fase 13 — `feat/e2e-critical-flows`) señalan esta necesidad con prioridad Media-Alta.
- Flujos faltantes: login exitoso, añadir actividad → ver en dashboard → ver detalle, sincronización Strava (OAuth/callback/sync), exportación de datos (CSV), eliminación de cuenta, PWA offline/install.
- Las pruebas E2E dan confianza de que la app funciona end-to-end antes de cada despliegue en Vercel (`main`).

## 4. Requisitos funcionales
- [ ] `e2e/auth.spec.js`: ampliar con login exitoso (mockeando sesión Supabase o usando credenciales de test), redirección tras login y cierre de sesión.
- [ ] `e2e/dashboard.spec.js`: implementar test real de carga del dashboard autenticado (mock de sesión) y verificación de métricas clave (CTL, ATL, TSB).
- [ ] `e2e/activities.spec.js` (nuevo): flujo completo de añadir actividad (CSV/manual), verla en el historial del dashboard y abrir su detalle.
- [ ] `e2e/strava.spec.js` (nuevo): flujo de sincronización Strava (conectar, callback, importar actividades) mockeando el OAuth de Strava.
- [ ] `e2e/export.spec.js` (nuevo): exportación de datos a CSV y descarga del archivo.
- [ ] `e2e/account.spec.js` (nuevo): eliminación de cuenta y confirmación de borrado de datos.
- [ ] Mocker APIs externas (Supabase, Strava, Intervals.icu, Gemini) para que los tests sean deterministas y no requieran credenciales reales ni red externa.
- [ ] Configurar `playwright.config.js` con `baseURL` y `webServer` (ya existe) y ejecutar en CI (push a `main`/`develop` y PRs).
- [ ] `npm run test:e2e` pasa en entorno local y CI.
- [ ] No commitear credenciales reales ni `.env` con secretos.

## 5. Criterios de aceptación
- [ ] Al menos 5 archivos de spec E2E con tests que pasan (`npm run test:e2e`).
- [ ] Flujo auth (login/logout) cubierto.
- [ ] Flujo dashboard (carga autenticada + métricas) cubierto.
- [ ] Flujo actividades (añadir → listar → detalle) cubierto.
- [ ] Flujo Strava sync cubierto (mockeado).
- [ ] Flujo exportación CSV cubierto.
- [ ] APIs externas mockeadas (no dependen de red real ni credenciales).
- [ ] Commit con convención estándar: `feat(e2e): <descripción>`.
- [ ] PR abierto hacia `develop`.
- [ ] `MEMORY.md` actualizado (spec-e2e-01 marcada como implementada).
- [ ] `CHANGELOG.md` actualizado.
- [ ] `docs/specs/README.md` actualizado.

## 6. Diseño técnico
- **Archivos afectados (nuevos):**
  - `e2e/auth.spec.js` — ampliar (login real, logout).
  - `e2e/dashboard.spec.js` — implementar test real de dashboard autenticado.
  - `e2e/activities.spec.js` — nuevo: flujo añadir → listar → detalle.
  - `e2e/strava.spec.js` — nuevo: sincronización Strava mockeada.
  - `e2e/export.spec.js` — nuevo: exportación CSV.
  - `e2e/account.spec.js` — nuevo: eliminación de cuenta.
- **Archivos afectados (modificados):**
  - `playwright.config.js` — asegurar configuración de baseURL, webServer y proyectos (ya existe, revisar si necesita ajustes).
  - `vitest.setup.js` / helpers — opcional: helpers de autenticación para E2E (setSession cookie).
- **Mockeo:** usar `page.route()` de Playwright para interceptar llamadas a Supabase/Strava/Intervals.icu y devolver respuestas fixtures.
- **Base de datos:** No aplica (tests contra entorno local con mocks).
- **Rama:** `feat/e2e-critical-flows` creada desde `develop`.
- **Merge:** PR hacia `develop` (no a `main`).

## 7. Pruebas
- **Unitarias:** No aplica.
- **Integración:** No aplica directamente.
- **E2E:** `e2e/*.spec.js` — ejecutar con `npm run test:e2e` (Playwright).

## 8. Notas adicionales
- No usar credenciales reales en los tests; usar fixtures y mocks.
- Los tests deben ser deterministas y no depender de la fecha/hora actual (mockear `Date` si es necesario).
- El despliegue en Vercel (`main`) ejecuta CI que incluye E2E; asegurar que los tests pasen en CI.
- No commitear directamente a `main` ni a `develop`; siempre vía PR hacia `develop`.
- No iniciar la siguiente tarea hasta que esta esté mergeada.

---
Versión: 0.1.0 — 2026-11-05
Estado: implementada — todos los criterios de aceptación verificados (8/8 tests E2E pasan).
