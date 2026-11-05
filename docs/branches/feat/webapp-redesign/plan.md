# Plan de tareas — spec-rediseno-01 (Rediseño integral de la webapp "Forma")

**Spec:** `docs/branches/feat/webapp-redesign/spec.md`
**Rama sugerida:** `feat/webapp-redesign` (desde `develop`)
**Skill:** `design-taste-frontend` (tasteskill 2.5)

## Tareas

| # | Tarea | Descripción | Estado |
|---|-------|-------------|--------|
| 1 | Crear rama | `git checkout -b feat/webapp-redesign develop` | [x] |
| 2 | Escribir spec.md | Especificación completa con principios de design-taste-frontend | [x] |
| 3 | Escribir plan.md | Plan de tareas derivado de la spec + MEMORY.md | [x] |
| 4 | Presentar para aprobación | Mostrar spec.md y plan.md al usuario | [x] |
| 5 | Crear tasks.md | Lista de tareas con checkboxes | [x] |
| 6 | Definir sistema de diseño | Colores (accent azul), tipografía dealt, tokens, radius, botones, cards, grounds | [ ] |
| 7 | Crear componentes base UI | Button, Input, Select, Card, Badge, Avatar, EmptyState, Skeleton, Toast, Divider, SectionHeader | [ ] |
| 8 | Rediseñar LandingPage | Hero solo, dato duro, app-frame protagonista, copy claro | [ ] |
| 9 | Rediseñar LoginPage | Flow de autenticación | [ ] |
| 10 | Rediseñar Navbar y BottomNav | header.nav fijo opaco + actionbar móvil, patrón unificado | [ ] |
| 11 | Rediseñar Dashboard | Métricas CTL/ATL/TSB, gráficas, lista actividades | [ ] |
| 12 | Rediseñar páginas internas | Profile, Calendar, Health, FitnessStats, ActivityDetail | [ ] |
| 13 | Rediseñar modales | AddActivityModal | [ ] |
| 14 | Añadir estados | Skeleton, error y vacío por sección | [ ] |
| 15 | Aplicar micro-interacciones | motion.md: hover/press/focus en toda la app | [ ] |
| 16 | Aplicar efectos (tech) | Un efecto dealt, hasta 2 momentos, máximo 4 contextos WebGL | [ ] |
| 17 | Verificar | build, lint, test:unit, test:e2e pasan | [ ] |
| 18 | Registrar | MEMORY.md, CHANGELOG.md, marcar spec como implementada | [ ] |
| 19 | Commit `feat(design): ...` y push | | [ ] |
| 20 | Abrir PR hacia `develop` | | [ ] |
| 21 | Merge a `develop` | [ ] Esperando autorización del usuario | [ ] |

## Alcance

### ✅ SÍ
- Rediseño visual y UX de todas las vistas existentes aplicando design-taste-frontend.
- Sistema de diseño y componentes base reutilizables.
- Tema claro/oscuro consistente.
- Micro-interacciones de hover/press/focus.
- Efectos solo donde el kind tech lo permite (un efecto, hasta 2 momentos, 4 contextos WebGL).

### ❌ NO
- Modificar lógica de negocio, hooks, utils, servicios, store o Supabase.
- Cambiar endpoints o estructura de datos.
- Añadir nuevas funcionalidades (solo presentar lo existente de forma mejorada).
- Usar credenciales reales ni modificar `.env`.

## Estado
Aprobado por el usuario el 2026-11-05. Listo para implementar.

---
Versión: 0.1.0 — 2026-11-05
