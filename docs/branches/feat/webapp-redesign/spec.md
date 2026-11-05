# Especificación SDD — spec-rediseno-01 (Rediseño integral de la webapp "Forma")

## 1. Identificación
- **ID:** spec-rediseno-01
- **Título:** Rediseño integral de la webapp "Forma" (dashboard de rendimiento deportivo)
- **Autor:** agente de implementación (Forma / calculadora-ivan)
- **Fecha:** 2026-11-05
- **Estado:** en curso
- **Rama:** `feat/webapp-redesign` (desde `develop`)
- **Skill aplicada:** `design-taste-frontend` (tasteskill 2.5)

## 2. Objetivo
Rediseñar la interfaz de usuario de la webapp "Forma" aplicando los principios de `design-taste-frontend`: un sistema de diseño único, una sección por pantalla, bordes iguales a izquierda y derecha, micro-interacciones de hover/press, copy claro (verbo+objeto, dato duro en la primera pantalla), el producto (su propio UI) como protagonista en el hero, y efectos/momentos solo porque es site-kind tech/software. Se mantiene toda la lógica de negocio y funcionalidad existente.

## 3. Contexto y justificación
La aplicación ya tiene una base funcional sólida (SRP, hooks separados, navegación móvil/desktop, tema claro/oscuro). Sin embargo, el diseño actual presenta deficiencias que la skill `design-taste-frontend` corrige:

- **Sin sistema de diseño único:** cada página aplica sus propios radios, sombras, espaciados y colores (mezcla de slate, zinc, blue, rose, amber sin paleta definida).
- **Tipografía no jerárquica:** solo Inter/SF Pro sin escala definida; la skill prohíbe "Inter, Roboto, Open Sans... ni el system look".
- **Efectos prohibidos para este kind:** `ParticleCanvas` (canvas animado solo), `FadeIn` (revelado al scroll), `animate-pulse`, `animate-spin` — la skill prohíbe revelados al scroll y movimiento sin interacción del usuario, salvo el efecto dealt del hero en tech.
- **Hero no cumple:** no está solo en la primera pantalla, usa eslóganes prohibidos (`copy.md`) y su CTA no es la acción principal clara.
- **Colores no sistemáticos:** uso de `bg-blue-600`, `text-blue-500`, etc. sin un único accent definido.
- **Botones y cards inconsistentes:** varios estilos sin una sola receta.
- **Copy genérico:** eslóganes y botones sin verbo+objeto claro.
- **Navegación no unificada:** Navbar desktop y BottomNav mobile con enfoques distintos; la skill exige `header.nav` fijo opaco y `nav.actionbar` en el pie.
- **Sin "una sección por pantalla":** las secciones no respetan `--h: 1` o `2`, bordes iguales ni el grid de 12 columnas.

## 4. Requisitos funcionales
- [ ] Definir el "kind" del proyecto: `page type`=`software`, `site-kind`=`software`, `kind`=`software` (tech). Declarar en `<html data-type data-radius data-buttons data-motion>` y metas `<meta name="page-type">` + `<meta name="site-kind">`.
- [ ] Crear sistema de diseño único: paleta (blanco/negro/gris con accent azul), tipografía dealt (nunca Inter/system look), tokens de ritmo, radius `soft`, un solo par de botones, una sola receta de card, grounds planos.
- [ ] Crear biblioteca de componentes base reutilizables: Button, Input, Select, Card, Badge, Avatar, EmptyState, Skeleton, Toast, Divider, SectionHeader.
- [ ] Rediseñar LandingPage: hero solo en primera pantalla, dato duro, copy claro, app-frame (UI propio de la app) como protagonista, máximo 2 acciones.
- [ ] Rediseñar LoginPage y flow de autenticación.
- [ ] Rediseñar Navbar (`header.nav` fijo, opaco, 1px hairline, sin blur/transparencia) y BottomNav con patrón unificado (desktop/mobile); añadir `nav.actionbar` en el pie (móvil).
- [ ] Rediseñar Dashboard, CalendarPage, HealthPage, FitnessStatsPage, ProfilePage, ActivityDetailPage respetando una sección por pantalla y bordes iguales.
- [ ] Rediseñar modales: AddActivityModal.
- [ ] Añadir estados de carga (skeleton), error y vacío por sección.
- [ ] Aplicar micro-interacciones (`motion.md`): card levanta 2px, foto zoom 1.02-1.03, botones step/press, subrayados que se dibujan, focus anillo 2px.
- [ ] Efectos (tech permitido): un efecto dealt en hero o `[data-visual]`, hasta 2 momentos en secciones propias, máximo 4 contextos WebGL, ninguna carta se mueve con el scroll.
- [ ] Copy: h1 con categoría+comprador, dato duro en primera pantalla, botones verbo+objeto, máximo 2 acciones en hero, 60-80 palabras por pantalla, un hecho una redacción.
- [ ] No modificar lógica de negocio, hooks, utils, servicios, store ni Supabase/Gemini.
- [ ] Todas las vistas existentes deben seguir funcionando tras el rediseño.
- [ ] Commit con convención `feat(design): ...` y PR hacia `develop`.
- [ ] `MEMORY.md` y `CHANGELOG.md` actualizados.

## 5. Criterios de aceptación
- [ ] Sistema de diseño documentado y aplicado en todos los componentes rediseñados.
- [ ] Al menos 8 componentes base reutilizables creados y usados.
- [ ] Todas las vistas principales rediseñadas (landing, login, dashboard, perfil, actividades, calendario, salud, stats, detalle actividad).
- [ ] Tema claro/oscuro funciona en toda la app.
- [ ] Una sección por pantalla (`--h: 1` o `2`), bordes iguales, hero solo en primera pantalla.
- [ ] Micro-interacciones de hover/press presentes y funcionales.
- [ ] Copy claro: dato duro en primera pantalla, botones verbo+objeto, sin eslóganes.
- [ ] Efectos solo donde `design-taste-frontend` lo permite (tech), máximo 1 efecto + 2 momentos + 4 contextos WebGL.
- [ ] `npm run build` pasa sin errores.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run test:unit` y `npm run test:e2e` siguen pasando.
- [ ] Commit `feat(design): ...` y push.
- [ ] PR hacia `develop`.

## 6. Diseño técnico
- **Archivos afectados (modificados):** `src/index.css` (tokens de diseño, utilidades), `src/components/pages/*.jsx`, `src/components/dashboard/*.jsx`, `src/components/layout/*.jsx`, `src/components/modals/AddActivityModal.jsx`, `src/App.jsx` (estructura de secciones si aplica).
- **Archivos afectados (nuevos):** `src/components/ui/` (componentes base reutilizables), `src/styles/design-tokens.css` (tokens del sistema).
- **Stack:** React 19, Tailwind CSS 3, lucide-react (iconos), recharts (gráficas), Zustand, Supabase.
- **Enfoque:** solo capa de presentación. No se toca `src/hooks/`, `src/utils/`, `src/services/`, `src/store/` ni `src/supabase.js`.
- **Rama:** `feat/webapp-redesign` creada desde `develop`.
- **Merge:** PR hacia `develop` (no a `main`).
- **Nombre de marca:** "Forma" es definitivo, ya en producción en `main` (no es un nombre acuñado que verificar).

## 7. Pruebas
- **Unitarias:** `npm run test:unit` debe seguir pasando.
- **E2E:** `npm run test:e2e` debe seguir pasando.
- **Build:** `npm run build` debe compilar sin errores.
- **Lint:** `npm run lint` debe pasar.

## 8. Notas adicionales
- El rediseño es puramente visual/UX. No cambia endpoints, lógica de cálculo ni estructura de datos.
- Implementar por páginas/vistas para permitir revisión incremental.
- No usar credenciales reales ni modificar `.env`.
- La rama `main` es producción desplegada en Vercel; no se commitea directamente.
- El usuario aprobó el plan el 2026-11-05 (color accent: azul; nombre "Forma" definitivo; usar fragmentos de UI live HTML como stand-ins).

---
Versión: 0.1.0 — 2026-11-05
