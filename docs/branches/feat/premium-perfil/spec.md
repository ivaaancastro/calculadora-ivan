# Spec — `feat/premium-perfil` (Fase D7: Ajustes/Perfil premium)

Estado: **pendiente de aprobación del usuario**. Todo detrás de `html[data-ui="v2"]`; v1 no cambia. Cubre `ProfilePage.jsx` y `profile/*`. Resuelve **JER-7** de `../premium-design/auditoria.md`. Modelo: `../premium-dashboard/spec.md`.

## 1. Referencias y principios
- Memoria `reference-design-inspiration`: tarjetas de borde fino y radio generoso, jerarquía clara, mucho aire, etiqueta 11/600 en mayúsculas, objetivos táctiles ≥ 44 px.
- Fase B/C: tokens (`--skin-radius-*`, `rgb(var(--line))`), `tabular-nums`, `text-wrap: balance`, radios concéntricos, foco visible.
- Reutiliza primitivas `src/components/ui/` (`Card`, `Input`, `SectionHeader`, `Segmented`); sin hex sueltos (`lint:colors` no sube).

## 2. Problema (JER-7)
- Las 4 secciones usan el mismo patrón «lista agrupada iOS» con el mismo peso: nada indica qué es importante (identidad, umbrales que alimentan todos los cálculos) y qué es mantenimiento.
- La «Zona de peligro» solo se distingue por el texto del título; «Eliminar cuenta» y «Borrar actividades» parecen tarjetas normales y conviven con «Seguridad» y «Gestión de datos».
- Cabecera con `Ajustes — {sección}` y «Guardar» global sin estado (no avisa de cambios sin guardar); filas con texto de 10 px; en escritorio el menú lateral es un bloque de botones sin indicador, y la columna queda estrecha (`max-w-5xl`).

## 3. Propuesta

### 3.1 Cabecera y navegación
- Cabecera v2: título de pantalla 22–24 px/600 («Ajustes») con la sección como subtítulo; botón «Guardar» pasa a **barra de guardado**: deshabilitado/neutro sin cambios, cobalto con punto «Cambios sin guardar» cuando `formData` difiere del original (derivado, sin cambiar la lógica de `onUpdate`).
- Escritorio ≥ 768 px: menú lateral de 224 px con **indicador activo** (filete cobalto a la izquierda), icono 20 px, etiqueta 14 px, hit ≥ 44 px; sticky bajo la cabecera. Móvil: se conserva el `Segmented` actual.
- Contenedor `max-w-5xl` → `max-w-6xl`; contenido de sección en columna de lectura ≤ 720 px para que los formularios no se estiren.

### 3.2 Escala de importancia por sección
1. **General**: la ficha de perfil pasa a **héroe de identidad** (avatar 80 px con anillo, nombre 22 px, correo, insignia); debajo, «Fisiología» como tarjeta primaria con 3 métricas (peso, FC reposo, CTL) y su descripción a 12 px; «Datos personales» y «Apariencia» como bloque secundario sin iconos de color (icono gris neutro).
2. **Zonas**: el selector Correr/Ciclismo pasa a `Segmented`; cada deporte con cabecera (umbral LTHR/FTP/ritmo como cifra grande tabular) y tabla de 7 zonas con **barra de color por zona** (tokens de zona); «Auto-detectar LTHR» como acción secundaria de la cabecera, no como tarjeta propia.
3. **Cuentas**: tarjeta por servicio con estado «Conectado/No configurado» (punto + texto, no solo color), campos con etiqueta encima en móvil (sin `w-40` fijo), acción «Sincronizar» primaria.
4. **Seguridad y datos**: tres niveles: *Seguridad* (contraseña), *Datos* (Deep Sync con barra de progreso y recuento tabular) y **Zona de peligro** separada: tarjeta con borde `danger` a baja opacidad, fondo tintado, icono de aviso, texto de consecuencia y botones destructivos **secundarios (contorno rojo)**; la confirmación existente (`window.confirm`) se mantiene (diálogo propio queda fuera de alcance).

### 3.3 Acabado
- Tipografía mínima 11 px (hoy 10 px en descripciones); `text-wrap: balance` en títulos.
- Foco visible en todos los controles; sin `transition-all`; entrada de sección con opacidad + 6 px (180 ms), apagada con `prefers-reduced-motion`.
- Estados: guardando (botón con spinner), subida de avatar, error de campo (borde `danger` + texto) en peso/FC/CTL fuera de rango (solo aviso; no cambia validación existente).

## 4. Criterios de aceptación
- v1 sin cambios (todo detrás de `isV2` / `html[data-ui="v2"]`); atributos `data-profile`/`data-skin` existentes y roles/etiquetas que usan los tests se conservan.
- La zona de peligro se distingue sin leer el texto; en cada sección hay un elemento dominante.
- Móvil 390 px sin scroll horizontal; escritorio 1280/1440 con columna de lectura centrada; objetivos ≥ 44 px; contraste AA claro/oscuro.
- `npm run verify` verde (`lint`, `lint:ui`, `lint:colors`, vitest, build); tests existentes de `ProfilePage` y `profileSections` pasan; tests nuevos para el indicador de cambios sin guardar.
- Capturas v2 de Ajustes (4 secciones, móvil y escritorio) solo las que cambian, vía workflow `Update snapshots` o Docker bajo mutex; datos deterministas, sin contenido dependiente de la fecha (`e2e/support/visual.js`).

## 5. Decisiones abiertas
- **P-1** Barra de guardado con estado «cambios sin guardar» (propuesta) vs dejar «Guardar» como está. Recomendado: la barra (es la mejora de jerarquía más útil y no toca la lógica).
- **P-2** Zona de peligro: botones de contorno rojo (propuesta) vs rellenos. Recomendado: contorno, para que lo destructivo no sea lo más llamativo.
- **P-3** Diálogo propio de confirmación en lugar de `window.confirm`: **fuera de alcance** salvo que lo pidas.

## 6. Fuera de alcance
Lógica de guardado, Supabase, motores de zonas (`zonesCalc`, `tssEngine`), borrado real de cuenta, interruptor v1/v2, otras pantallas (Calendario, Actividades, Dashboard…), tokens compartidos.
