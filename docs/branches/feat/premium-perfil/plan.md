# Plan — `feat/premium-perfil`

Deriva de `spec.md`. PRs pequeños a `develop`; el coordinador mergea con CI verde. Se tocan solo `ProfilePage.jsx`, `profile/*`, un bloque nuevo y acotado «Perfil D7» al final de `skin-v2.css` (el bloque Capa 5 de Ajustes ~l.232 se amplía solo si hace falta) y tests de Ajustes.

| PR | Rama | Contenido |
|----|------|-----------|
| 1 | `feat/premium-perfil` | Spec+plan+tasks; cabecera v2 y barra de guardado con «cambios sin guardar» (+ tests); menú lateral con indicador; contenedor/columna de lectura; CHANGELOG. |
| 2 | `feat/premium-perfil-secciones` | General (héroe de identidad, fisiología primaria) y Zonas (`Segmented`, umbral como cifra, barras por zona). |
| 3 | `feat/premium-perfil-cuentas-seguridad` | Cuentas y Seguridad: zona de peligro diferenciada, Deep Sync, campos apilados en móvil; capturas v2 de Ajustes (solo las que cambian), MEMORY/CHANGELOG, marcar D7 en `premium-design/tasks.md`. |

Verificación por PR: `npm run verify` local (carril visual); E2E completo y `style-diff` en CI. Capturas v2 solo en el PR 3, con workflow `Update snapshots`; revisar una a una las que cambian. Antes de pedir merge: fusionar `origin/develop` y resolver conflictos (CHANGELOG.md, `skin-v2.css`: conservar todo y comprobar llaves).

Riesgos: (1) tests existentes usan etiquetas/roles de `ProfilePage`/secciones: conservarlos; (2) `skin-v2.css` lo editan otras sesiones: bloque propio al final; (3) detectar «cambios sin guardar» comparando `formData` con `currentSettings` normalizado (el efecto de inicialización añade campos por defecto): comparar contra el `formData` inicial guardado en un ref, no contra `currentSettings`; (4) capturas con datos deterministas, sin fechas.
