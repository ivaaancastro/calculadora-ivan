# Especificación SDD — spec-audit-01

## 1. Identificación
- **ID:** spec-audit-01
- **Título:** Seguridad: remover secretos de `.env`, agregar a `.gitignore`, crear `.env.example`, validar env vars al arranque
- **Autor:** agente de implementación (Forma / calculadora-ivan)
- **Fecha:** 2026-11-05
- **Estado:** implementada

## 2. Objetivo
Dejar de versionar secretos (`.env` rastreado por git), asegurar que `.env` / `.env.*` no se suban al repositorio, proveer una plantilla `.env.example` para nuevos desarrolladores y CI, y validar las variables de entorno críticas al arranque de la aplicación para fallar temprano si faltan.

## 3. Contexto y justificación
- El archivo `.env` contiene secretos reales (URL y key de Supabase, client secret de Strava, API key de Gemini) y está rastreado por git (`git ls-files .env` lo confirma).
- `.gitignore` no incluye `.env`, ni `.env.*`, ni `coverage/`.
- `src/supabase.js` lee `VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY` sin validar.
- `src/services/ai.js` lee `VITE_GEMINI_API_KEY` sin validar.
- No hay validación temprana al arranque: si falta una variable crítica, la app falla de forma impredecible en tiempo de ejecución.

## 4. Requisitos funcionales
- [ ] Agregar `.env`, `.env.*`, `coverage/` y `dist/` a `.gitignore`.
- [ ] Eliminar `.env` del seguimiento de git (`git rm --cached .env`) conservando el archivo local.
- [ ] Crear `.env.example` con las variables requeridas, sin valores reales (ni secretos).
- [ ] Validar al arranque que existan `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY` y `VITE_GEMINI_API_KEY`; fallar temprano con mensaje claro si faltan.

## 5. Criterios de aceptación
- [ ] `.env` y `.env.*` aparecen en `.gitignore`.
- [ ] `git ls-files .env` no devuelve `.env` (dejado de rastrear) y el archivo local `.env` sigue existiendo.
- [ ] `.env.example` existe con las variables requeridas y sin valores secretos.
- [ ] La app falla temprano con mensaje claro al arranque si falta cualquiera de las tres variables críticas.
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa.
- [ ] `npm run test:coverage` pasa.
- [ ] Commit con convención de commits (ej. `fix(security): ...`).
- [ ] PR abierto hacia `develop`.
- [ ] `MEMORY.md` actualizado (spec-audit-01 marcada como implementada).
- [ ] `CHANGELOG.md` actualizado.

## 6. Diseño técnico
- **Archivos afectados:** `.gitignore`, `.env.example` (nuevo), `src/main.jsx` (validación al arranque).
- **Servicios afectados:** `src/supabase.js` (usa `VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY`), `src/services/ai.js` (usa `VITE_GEMINI_API_KEY`).
- **Rama:** `fix/security-env-secrets` creada desde `develop`.
- **Merge:** PR hacia `develop` (no a `main`).

## 7. Pruebas
- **Unitarias:** no se añaden pruebas nuevas en esta spec (alcance limitado a configuración y validación de arranque).
- **Integración:** `npm run test:coverage` debe pasar.
- **E2E:** no aplica.

## 8. Notas adicionales
- No subir valores reales de secretos a ningún lado (ni commit, ni `.env.example`, ni PR).
- No modificar código de producción fuera del alcance de esta spec.
- No commitear directamente a `main` ni a `develop`; siempre vía PR hacia `develop`.
- No iniciar la siguiente tarea hasta que esta esté mergeada.

---
Versión: 0.1.0 — 2026-11-05
