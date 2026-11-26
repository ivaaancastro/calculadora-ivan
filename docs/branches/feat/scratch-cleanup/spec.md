# Especificación SDD — spec-scratch-01 (Limpiar scripts sueltos de scratch/)

## 1. Identificación
- **ID:** spec-scratch-01
- **Título:** Migrar o eliminar scripts sueltos de `scratch/`
- **Autor:** agente de implementación (Forma / calculadora-ivan)
- **Fecha:** 2026-11-05
- **Estado:** pendiente

## 2. Objetivo
Limpiar la carpeta `scratch/` que contiene scripts de migración `.cjs` ya ejecutados y un archivo de prueba suelto `test_peak_power.js`, migrando cualquier lógica relevante a specs documentadas o eliminando los archivos que ya no aportan valor.

## 3. Contexto y justificación
- El roadmap de `MEMORY.md` (sección "Pendientes anteriores") señala: "Migrar lógica de `scratch/*.cjs` a specs documentadas o eliminar."
- Los archivos `.cjs` son scripts de migración que ya ejecutaron cambios sobre `Dashboard.jsx`, `Navbar.jsx` y `BottomNav.jsx` (refactor SRP, rutas con `react-router-dom`, `Link` en lugar de botones). Esos cambios ya están aplicados en el código fuente.
- `test_peak_power.js` es una prueba suelta no integrada en la suite de tests (`src/__tests__/`).
- Mantener scripts sueltos en `scratch/` genera confusión y deuda técnica sin valor.

## 4. Requisitos funcionales
- [ ] Revisar cada archivo de `scratch/` para confirmar que los cambios que describen ya están aplicados en el código fuente.
- [ ] Eliminar `scratch/*.cjs` (migraciones ya aplicadas).
- [ ] Evaluar `scratch/test_peak_power.js`: si su lógica no está cubierta por tests existentes, migrarla a `src/__tests__/unit/` como test unitario; de lo contrario, eliminarla.
- [ ] No eliminar código de producción ni tests vigentes.
- [ ] Commit con convención estándar: `chore(scratch): <descripción>`.
- [ ] PR abierto hacia `develop`.
- [ ] `MEMORY.md` actualizado (tarea pendiente marcada).

## 5. Criterios de aceptación
- [ ] Carpeta `scratch/` vacía o eliminada.
- [ ] No se pierde lógica de producción ni tests útiles.
- [ ] `npm run lint` y `npm run test:unit` pasan.
- [ ] Commit `chore(scratch): ...` y push.
- [ ] PR hacia `develop`.
- [ ] `MEMORY.md` actualizado.

## 6. Diseño técnico
- Archivos afectados (eliminados): `scratch/fix_dashboard.cjs`, `scratch/fix_nav.cjs`, `scratch/fix_nav_2.cjs`, `scratch/refactor_dashboard.cjs`, `scratch/refactor_nav.cjs`, `scratch/rewrite_dashboard.cjs`.
- `scratch/test_peak_power.js`: eliminar o migrar a `src/__tests__/unit/peak-power.test.js`.
- Rama: `feat/scratch-cleanup` creada desde `develop`.
- Merge: PR hacia `develop` (no a `main`).

## 7. Pruebas
- `npm run lint`
- `npm run test:unit`

## 8. Notas adicionales
- No usar este archivo como base para nuevo código de producción; es solo limpieza de deuda técnica.

---
Versión: 0.1.0 — 2026-11-05