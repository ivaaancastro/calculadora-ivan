# Tareas — `feat/premium-perfil`

Spec y plan aprobados por el usuario (2026-11-23), P-1 y P-2 según lo recomendado, P-3 fuera de alcance.

## PR 1 — `feat/premium-perfil` (cabecera, guardado, menú, contenedor)
- [x] Detectar «cambios sin guardar» (ref con el `formData` inicial + `targetCtl`) y test
- [x] Cabecera v2: título «Ajustes» + subtítulo de sección; «Guardar» como barra con estado
- [x] Menú lateral con indicador activo, hit ≥ 44 px, sticky
- [x] Contenedor `max-w-6xl` y columna de lectura ≤ 720 px (bloque «Perfil D7» en `skin-v2.css`)
- [x] `npm run verify` verde; CHANGELOG

## PR 2 — `feat/premium-perfil-secciones` (General y Zonas)
- [ ] General: héroe de identidad, Fisiología primaria, bloque secundario
- [ ] Zonas: `Segmented`, umbral como cifra, barras por zona

## PR 3 — `feat/premium-perfil-cuentas-seguridad`
- [ ] Cuentas: estado con punto+texto, campos apilados en móvil
- [ ] Seguridad: zona de peligro diferenciada, botones de contorno
- [ ] Capturas v2 de Ajustes (solo las que cambian), MEMORY/CHANGELOG, marcar D7
