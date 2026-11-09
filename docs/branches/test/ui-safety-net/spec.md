# Especificación SDD — spec-rediseno-02-c0 (Red de seguridad de UI)

## 1. Identificación
- **ID:** `spec-rediseno-02-c0`
- **Título:** Capa 0 del rediseño: red de seguridad de UI
- **Autor:** agente Claude Code
- **Fecha:** 2026-11-06
- **Estado:** aprobada (2026-11-06, por el usuario: "la apruebo")

## 2. Objetivo
Conseguir que cualquier regresión visual, de layout o de funcionalidad se detecte automáticamente antes de empezar a cambiar el aspecto de la app.

## 3. Contexto y justificación
El primer intento rompió la navegación y eliminó acciones sin que ninguna prueba visual lo avisara. Además, 12 de los usos de selector de los E2E buscan por texto, y un cambio de copy los rompe. Esta capa no cambia el diseño.

## 4. Requisitos funcionales
- [ ] **RF1. Datos simulados:** un único módulo en `e2e/support/` con sesión, perfil, actividades y fecha fija, usado por las pruebas nuevas.
- [ ] **RF2. Regresión visual:** capturas de referencia con `toHaveScreenshot` de landing, dashboard, rendimiento, calendario, actividades, detalle, salud y perfil, a 390 y 1440 px, en claro y oscuro.
- [ ] **RF3. Prueba de layout:** en esas rutas y tamaños falla si una barra fija tapa contenido al cargar o si hay desbordamiento horizontal de la página.
- [ ] **RF4. Prueba táctil:** a 390 px informa de los controles de menos de 44 px. Empieza como informe sin bloquear, porque hoy existen casos.
- [ ] **RF5. Gestos:** deslizar sobre una gráfica o sobre los filtros horizontales no cambia de pestaña. Si hoy ocurre, se documenta como defecto conocido y se marca como fallo esperado.
- [ ] **RF6. Selectores:** los E2E usan rol y etiqueta en lugar de texto comercial, y los campos de `AddActivityModal` y del acceso tienen su etiqueta asociada.
- [ ] **RF7. Paridad:** `docs/branches/test/ui-safety-net/paridad.md` lista las acciones de cada pantalla y sirve de referencia para las capas siguientes.
- [ ] **RF8. Repositorio:** `playwright-report` y `test-results` dejan de estar versionados, y `.playwright-mcp` y `.taste-skill` se ignoran.
- [ ] **RF9. Marca:** "FormaLab" pasa a "Forma" en los 4 archivos afectados, con las capturas generadas después de este cambio.
- [ ] **RF10. Zoom:** el viewport deja de bloquearlo, quitando `maximum-scale` y `user-scalable=no`.
- [ ] **RF11. Arranque sin Gemini:** `VITE_GEMINI_API_KEY` deja de ser obligatoria en `src/main.jsx`, porque ningún componente usa `askGemini`. Así un Preview sin esa variable no queda en blanco y `services/ai` sigue avisando si se usa sin clave.

## 5. Criterios de aceptación
- [ ] `npm run lint`, `npm run test:unit`, `npm run test:integration`, `npm run test:e2e` y `npm run build` pasan en verde, en local y en CI.
- [ ] Aparte de lo indicado en RF6, RF9, RF10 y RF11, no cambia nada visible ni funcional.
- [ ] La red falla ante tres defectos introducidos a propósito y luego retirados: una barra que tapa contenido, un elemento más ancho que la pantalla y un cambio visual en una tarjeta.
- [ ] Las capturas son estables en dos ejecuciones seguidas de CI.
- [ ] Un build de producción con solo las variables de Supabase arranca y muestra la landing.

## 6. Diseño técnico
- **Componentes afectados:** solo atributos de etiqueta en formularios y el texto de marca.
- **Arranque:** `src/main.jsx`, `index.html`.
- **Pruebas:** `e2e/`, `playwright.config.js`, con un proyecto móvil además del de escritorio.
- **CI:** `.github/workflows/ci.yml`, con las capturas de referencia generadas en Linux, igual que en CI, usando la imagen oficial de Playwright. Las generadas en macOS no serían comparables.
- **Hooks, servicios, store, utilidades y base de datos:** sin cambios.

## 7. Pruebas
- **Unitarias e integración:** las actuales.
- **E2E:** las actuales con selectores nuevos, más visual, layout, táctil y gestos.

## 8. Notas adicionales
- **Decisión a validar (RF11):** la alternativa es añadir la variable en Vercel, pero expondría una clave en el cliente sin que nada la use.
- **Fuera de alcance:** producción y `main`.
- **Defectos ya detectados que no se corrigen aquí:** el botón de importar CSV, porque `Dashboard` no le pasa `onFileUpload`. Se registra en la lista de paridad.

---
Versión: 0.1.0 — 2026-11-06
