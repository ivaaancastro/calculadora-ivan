# Especificación SDD — spec-rediseno-02 (Rediseño incremental por capas)

## 1. Identificación
- **ID:** `spec-rediseno-02` (sustituye a `spec-rediseno-01`)
- **Título:** Rediseño incremental de Forma por capas, sin interrumpir producción
- **Autor:** agente Claude Code
- **Fecha:** 2026-11-06
- **Estado:** en curso; aprobada por el usuario el 2026-11-06 para empezar por la Capa 0

## 2. Objetivo
Modernizar la interfaz de Forma mediante capas pequeñas, reversibles y entregables por separado. La funcionalidad se mantiene y `develop` sigue verde tras cada PR.

## 3. Contexto y justificación

### 3.1 Qué falló en el primer intento
Medido el 2026-11-06 comparando `develop` con `feat/webapp-redesign`, que se archivó en el tag `archive/webapp-redesign-v1`.

| Comprobación | `develop` | Rediseño |
|---|---|---|
| Lint de `src` | 0 errores | 4 errores (`Navbar.jsx`) |
| Unit e integración | 66/66 | 64/66 (`AddActivityModal`) |
| E2E | 8/8 | 6/8, incluso con los selectores reescritos sin commitear |
| Build | correcto | correcto |

Fallos visibles y de producto:
- **Navegación solapada:** la barra mide 72 px y es translúcida, y tapa la cabecera de todas las pantallas, tanto en escritorio como en móvil.
- **Modo oscuro roto en la landing:** el hero sale en blanco y el título es casi invisible.
- **Calendario estrechado:** queda limitado a unos 960 px y sus contenidos se parten en varias líneas.
- **Funciones eliminadas de la navegación:** "Borrar DB", los accesos a las secciones de ajustes y el botón de importar CSV. Ese botón ya estaba roto en `develop`, porque `Dashboard` no le pasa `onFileUpload`.
- **Dos sistemas en paralelo:** `design-system.css` declaraba tokens, pero ningún componente usa `var(--…)` salvo un caso, y hay 111 `#1f2de6` escritos a mano. Además, sobrescribe `body` y `.w-full` de forma global.
- **Kit de UI a medias:** `Avatar`, `Divider`, `EmptyState`, `Skeleton` y `Toast` no se usan en ningún sitio, y `Select` no se creó.
- **`tasks.md` no reflejaba la realidad:** marcaba como rediseñados Dashboard, Salud y BottomNav, que no aparecen en el diff. También indicaba lint correcto y build bloqueado, y ninguna de las dos cosas era cierta.
- **Cambio imposible de revisar:** 3.162 inserciones y 2.821 borrados en una sola rama, mezclando estilo, estructura y copy.

### 3.2 Causa raíz
1. **La skill se aplicó fuera de su alcance.** `design-taste-frontend` sirve para construir "professional company websites". Reglas como una sección por pantalla, el hero en solitario o 60-80 palabras por pantalla no encajan en un dashboard denso de datos. Sus verificadores trabajan sobre una página suelta, no sobre una app autenticada.
2. **No había una capa de abstracción.** El estilo está repartido en los propios componentes, así que cada cambio visual obliga a reescribir JSX.
3. **No había red de seguridad visual.** Ninguna prueba detecta un solape, y los E2E dependen del texto comercial.

### 3.3 Deuda de UI en `develop`
- 2.353 líneas en `CalendarPage`; `ActivityDetailPage`, `ProfilePage` y `HealthPage` rondan las 1.000.
- 904 líneas con `dark:` y 303 con grises `bg-*` escritos a mano.
- 170 líneas con colores hex, sobre todo en gráficas, y 10 archivos con Recharts.
- 11 familias de color de acento sin significado definido.
- 364 usos de texto de 8, 9 o 10 px.
- `tailwind.config.js` sin ninguna extensión de tema.
- Ningún `data-testid`, y `playwright-report` y `test-results` versionados.

## 4. Requisitos funcionales
- [ ] **RF1. Alcance de la skill:** se aplica según la tabla de la sección 6.2.
- [ ] **RF2. Capas:** el trabajo se entrega en el orden del `plan.md`, y cada capa es una o varias specs y PR propios.
- [ ] **RF3. Sin cambios de lógica:** los PR de rediseño no tocan `src/hooks`, `src/utils`, `src/services`, `src/store` ni `src/supabase.js`. Cualquier excepción necesita su propia spec.
- [ ] **RF4. Paridad funcional:** antes de cambiar una pantalla se inventarían sus acciones, y todas deben seguir disponibles después.
- [ ] **RF5. Tokens semánticos:** los colores, radios, sombras y tipografía de lo ya migrado salen de tokens en `tailwind.config.js` y CSS, sin valores sueltos.
- [ ] **RF6. Reversibilidad:** la nueva piel se activa con `html[data-ui="v2"]` y puede retirarse sin revertir JSX.
- [ ] **RF7. Separación:** ningún PR mezcla refactor estructural con cambio visual.
- [ ] **RF8. Accesibilidad:** el texto de la app no baja de 11 px, el foco es visible, los campos tienen etiqueta asociada, el contraste cumple WCAG AA y se permite el zoom.
- [ ] **RF9. Marca:** el nombre visible es **Forma** en toda la interfaz; desaparece "FormaLab".
- [ ] **RF10. Móvil primero:** cada pantalla se diseña y aprueba primero a 390 px. Los objetivos táctiles miden al menos 44 px y ningún dato o acción depende solo de `hover` o `title`.
- [ ] **RF11. Jerarquía de métricas:** cada pantalla responde primero a su pregunta principal. Las métricas secundarias se agrupan o se despliegan, sin eliminarse, y las cifras usan números tabulares con su unidad.
- [ ] **RF12. Preparada para app nativa:** el código nuevo no da por hecho que la app corre en un dominio web, ni que hay ratón o barra de navegador.

## 5. Criterios de aceptación (en cada PR)
- [ ] `npm run lint`, `npm run test:unit`, `npm run test:integration`, `npm run test:e2e` y `npm run build` pasan en verde, con los resultados copiados en el PR.
- [ ] Capturas revisadas a 390, 768 y 1440 px, en claro y oscuro, en todas las rutas afectadas, y en un iPhone real cuando cambie la interacción táctil.
- [ ] Ninguna barra fija tapa contenido ni hay desbordamiento horizontal, comprobado por prueba automática.
- [ ] Vista previa de Vercel revisada por el usuario antes de mergear.
- [ ] El PR se puede revisar: orientativamente, menos de 400 líneas si no es un codemod mecánico.
- [ ] `tasks.md` solo marca lo verificado.

## 6. Diseño técnico

### 6.1 Arquitectura
```
Pantallas        Dashboard, Calendario, Salud…
Primitivas       src/components/ui/  (Button, Card, Stat…)
Tema             tailwind.config.js → surface, ink, accent, positive…
Tokens           src/styles/tokens.css → valores v1 y html[data-ui="v2"]
```
La capa de tokens empieza con los valores actuales, así que no cambia nada visible. Después, la nueva piel consiste en definir otros valores para `data-ui="v2"`. `darkMode: 'class'`, `useTheme`, el router y la lógica de datos no cambian.

### 6.2 Aplicación de la skill
| Regla | Landing, login y confirmación | App autenticada |
|---|---|---|
| Sistema único, un acento, una receta de botón y tarjeta | Sí | Sí |
| Hover, press y foco discretos | Sí | Sí |
| Bordes iguales | Sí | Sí |
| Copy claro con verbo y objeto | Sí | Sí, en botones y estados vacíos |
| Paleta y tipografía del dealer | Sí | Solo tras validar legibilidad con datos y tablas |
| Una sección por pantalla, hero, 60-80 palabras | Sí | **No** |
| Efectos, escenas y momentos | Máximo lo que permita la skill | **No** |
| `consistency.mjs`, `check.mjs`, `perf.mjs` | Obligatorios, sobre la página pública | **No aplican**; se usa la red propia de la Capa 0 |

Skills de apoyo:
- **`dataviz`:** obligatoria al crear o modificar gráficas, indicadores y paneles de métricas.
- **`frontend-design`:** para decidir la dirección visual de la app en la Capa 3.
- **`web-design-guidelines` (Vercel):** auditoría de accesibilidad y UX en cada PR visual, si se aprueba instalarla.

### 6.3 App móvil
- **Tecnología propuesta:** Capacitor, con la misma app React dentro de un proyecto iOS nativo. `recharts` y `leaflet` dependen del DOM, así que React Native obligaría a reescribir toda la interfaz.
- **Requisito de Apple (4.2):** la app debe ir más allá de un "repackaged website", por lo que necesita funciones nativas reales, como Apple Health y notificaciones.
- **Puntos a adaptar:** `window.location.origin` en los enlaces de correo y el flujo OAuth de Strava, que hoy redirige la propia ventana.

### 6.4 Áreas afectadas
- **Componentes:** `src/components/**`, por capas.
- **Estilos:** `src/index.css`, `src/styles/tokens.css`, `tailwind.config.js`.
- **Pruebas y CI:** `e2e/`, `playwright.config.js`, `.gitignore`.
- **Hooks, servicios, store, utilidades y base de datos:** sin cambios.

## 7. Pruebas
- **Unitarias e integración:** las actuales, más pruebas de las primitivas.
- **E2E:** selectores por rol y etiqueta, no por texto comercial.
- **Regresión visual:** `toHaveScreenshot` con datos simulados y fecha fija, en las rutas principales.
- **Layout:** prueba automática de solapes y desbordamiento.

## 8. Notas adicionales
- **Copia del primer intento:** tag local `archive/webapp-redesign-v1` y `stash@{0}`. Sirve de referencia, no se reutiliza.
- **Rama remota:** `origin/feat/webapp-redesign` sigue con los commits antiguos.
- **Producción:** no se toca por ahora; ver el apartado "Previa" del `plan.md`.
- **Decidido (2026-11-06):** el nombre es Forma, y la skill de taste se aplica solo donde encaja, según la sección 6.2.
- **Estado móvil actual:** la app ya tiene `BottomNav`, deslizamiento entre pestañas, áreas seguras y PWA. Aun así, en un teléfono de 390 px la cabecera queda muy cargada, hay ocho tarjetas antes de la primera gráfica y el viewport bloquea el zoom.

---
Versión: 0.2.0 — 2026-11-06
