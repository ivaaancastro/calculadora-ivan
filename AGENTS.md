# AGENTS — Definición del sistema de agentes SDD

> **Este es el primer archivo que debe leer cualquier agente al iniciar una nueva sesión.**
> Define el sistema Specification-Driven Development (SDD), el flujo obligatorio de trabajo,
> las reglas de ramas/commits y los estándares del proyecto.

---

## 0. Principio rector (obligatorio)

**Todo cambio en el código parte de una especificación en `docs/specs/`.**
Ningún agente escribe código de producción sin una spec aprobada y sin haber leído `MEMORY.md` y este archivo.

---

## 1. Reglas de ramas y despliegue (obligatorio)

| Regla | Descripción |
|-------|-------------|
| **Rama base** | Todas las ramas de funcionalidad salen de `develop`. |
| **Nunca commitear a `main`** | `main` es la rama de producción, desplegada en Vercel. No se hace push directo ni commits directos a `main`. |
| **Rama de trabajo** | Crear rama desde `develop`: `git checkout -b feature/<nombre> develop` |
| **Merge** | Las ramas se merguean a `develop` vía Pull Request. |
| **Despliegue** | `main` se despliega automáticamente en Vercel. `develop` es la rama de integración. |
| **CI** | Se ejecuta en push a `main`/`develop` y en PRs (ver `.github/workflows/ci.yml`). |

### Flujo de rama estándar
```bash
# 1. Partir de develop (siempre al día)
git checkout develop
git pull origin develop

# 2. Crear rama de funcionalidad
git checkout -b feature/<nombre-corto> develop

# 3. Implementar siguiendo el flujo SDD (ver sección 2)

# 4. Commit con convención estándar (ver sección 4)
git add .
git commit -m "feat(...): descripción del cambio"

# 5. Push y abrir PR hacia develop
git push -u origin feature/<nombre-corto>
```

---

## 2. Flujo SDD obligatorio (ciclo de vida)

Cada agente debe seguir este orden estricto:

```
1. Especificar   → escribir/actualizar spec en docs/specs/
2. Planificar    → leer spec + MEMORY.md, generar plan de tareas
3. Implementar   → escribir/modificar código siguiendo la spec
4. Verificar     → correr tests, lint, build, type-check
5. Registrar     → actualizar CHANGELOG.md, MEMORY.md; marcar spec como implementada
```

**Prohibido:** saltarse el paso 1 (Especificar). Sin spec aprobada, no hay código de producción.

---

## 3. Convención de commits (obligatorio)

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>[ámbito opcional]: <descripción>
```

### Tipos permitidos
| Tipo | Cuándo usarlo |
|------|---------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Cambios en documentación |
| `style` | Formato, punto y coma, etc. (sin cambio de lógica) |
| `refactor` | Refactorización sin cambiar comportamiento |
| `perf` | Mejoras de rendimiento |
| `test` | Añadir o corregir pruebas |
| `chore` | Tareas de mantenimiento, dependencias, config |
| `build` | Cambios en build system o dependencias externas |
| `ci` | Cambios en CI/CD |

### Ejemplos válidos
```
feat(actividades): añadir filtro por rango de fechas
fix(auth): corregir redirección tras login
docs(readme): documentar flujo SDD
test(ai): añadir pruebas unitarias para askGemini
chore(deps): actualizar vite a v7
```

### Prohibido
- Commits sin mensaje descriptivo.
- Commits directos a `main` o `develop` (siempre vía PR).
- Mensajes en español sin el prefijo de tipo en inglés.

---

## 4. Reglas de colaboración (obligatorio)

1. **Un agente no implementa sin spec aprobada.**
2. **Cada agente actualiza `MEMORY.md` al finalizar su tarea.**
3. **Las skills en `skills/` son la fuente de prompts y plantillas.**
4. **Nunca commitear a `main`; las ramas salen de `develop`.**

---

## 5. Archivos clave del sistema SDD

| Archivo / Carpeta | Propósito |
|-------------------|-----------|
| `AGENTS.md` | Este archivo: flujo obligatorio, reglas, convenciones. |
| `MEMORY.md` | Estado persistente y contexto compartido. |
| `docs/specs/` | Especificaciones que impulsan el desarrollo (una por archivo). |
| `docs/sdd/plantilla-especificacion.md` | Plantilla obligatoria para nuevas specs. |
| `skills/` | Capacidades reutilizables (prompts y plantillas). |
| `CHANGELOG.md` | Registro de cambios por versión (Keep a Changelog + SemVer). |
| `README.md` | Documentación del producto, stack y cómo contribuir. |

---

## 6. Skills y MCPs obligatorias

### Skills de OpenCode (activar en el cliente)

| Skill | Por qué es obligatoria |
|-------|------------------------|
| `vercel-react-best-practices` | React 19 + Vite: rendimiento, componentes, data fetching, optimización de bundle. |
| `web-design-guidelines` | Revisar UI/UX y accesibilidad. App móvil-first (BottomNav, swipe navigation, gestos, liquid glass). |
| `apple-design` | Interfaces móviles con gestos táctiles, swipe navigation, materiales translúcidos, feedback físico. |
| `vercel-composition-patterns` | Componentes reutilizables (compound components, context). Evita proliferación de booleanos en props. |
| `writing-guidelines` | Revisar docs/prose: README, CHANGELOG, AGENTS.md, specs, MEMORY.md. |
| `vercel-cli-with-tokens` | Desplegar a Vercel usando tokens (no login interactivo). `main` es producción en Vercel. |
| `vercel-optimize` | Optimizar costos y rendimiento en Vercel (Function Invocations, Build Minutes, Core Web Vitals, Bot Management). |

### MCPs (configurar en `.opencode/mcp.json`)

| MCP | Por qué es obligatorio | Uso |
|-----|------------------------|-----|
| `context7` | Documentación actualizada de librerías del stack: React, Vite, Tailwind CSS, Supabase, Google Gemini, Playwright, Vitest, React Router, Zustand, TanStack Query, Recharts, Leaflet. | Consultar APIs, versiones, patrones. |
| `opencode` | Gestión de worktrees, sesiones, recursos MCP y herramientas de OpenCode. | Flujo de agentes, creación de ramas, gestión de sesión. |
| `supabase` | MCP de Supabase (`https://github.com/supabase-community/opencode-supabase.git`). Interactuar con Supabase (Auth, DB, RLS, Edge Functions). | Operaciones sobre base de datos y Edge Functions. |

El archivo `.opencode/mcp.json` declara todos los MCPs como requeridos.

---

## 7. Cómo iniciar una nueva sesión (checklist del agente)

Al iniciar cualquier nueva sesión, el agente debe:

1. [ ] Leer `AGENTS.md` (este archivo).
2. [ ] Leer `MEMORY.md` para conocer el estado actual del proyecto.
3. [ ] Verificar que está en una rama de funcionalidad (no en `main` ni `develop` directamente).
4. [ ] Si va a implementar, leer la spec asociada en `docs/specs/`.
5. [ ] Seguir el flujo SDD: Especificar → Planificar → Implementar → Verificar → Registrar.
6. [ ] Usar convención de commits para cada commit.
7. [ ] Abrir PR hacia `develop` (no a `main`) para revisión.

---

Versión: 0.1.0 — 2026-11-05