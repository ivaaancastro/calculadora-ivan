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
1. Especificar   → escribir spec en docs/branches/<rama>/spec.md
2. Planificar    → escribir plan en docs/branches/<rama>/plan.md (leer spec + MEMORY.md)
3. Presentar     → mostrar spec.md y plan.md al usuario para su aprobación
4. Tareas        → tras aprobación, crear docs/branches/<rama>/tasks.md con checkboxes
5. Implementar   → escribir/modificar código siguiendo la spec (solo tras aprobación del usuario y tasks.md creado)
6. Verificar     → correr tests, lint, build, type-check
7. Registrar     → actualizar CHANGELOG.md, MEMORY.md; marcar spec como implementada
```

**Prohibido:** saltarse el paso 3 (Presentar para aprobación). Sin spec y plan presentados y aprobados por el usuario, no se crea tasks.md ni hay código de producción.

### Estructura de documentación por rama

Cada rama de funcionalidad tiene su propia carpeta en `docs/branches/<nombre-rama>/` con:

| Archivo | Propósito | Cuándo se crea |
|---------|-----------|----------------|
| `spec.md` | Especificación completa siguiendo la plantilla de `docs/sdd/plantilla-especificacion.md` | Paso 1 (Especificar) |
| `plan.md` | Plan de tareas derivado de la spec + MEMORY.md | Paso 2 (Planificar) |
| `tasks.md` | Lista de tareas con checkboxes (`- [ ]` / `- [x]`) para ir marcando el progreso | Paso 4, solo tras aprobación del usuario |

Ejemplo:
```
docs/branches/fix/security-env-secrets/
├── spec.md
├── plan.md
└── tasks.md   (solo tras aprobación)
```

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
- **Mergear un PR sin autorización explícita del usuario.** El agente abre el PR, pero nunca lo mergea hasta que el usuario lo apruebe.

---

## 4. Reglas de colaboración (obligatorio)

1. **Un agente no implementa sin spec aprobada.**
2. **Cada agente actualiza `MEMORY.md` al finalizar su tarea.**
3. **Las skills en `skills/` son la fuente de prompts y plantillas.**
4. **Nunca commitear a `main`; las ramas salen de `develop`.**
5. **Un agente nunca mergea un PR sin autorización explícita del usuario.**

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

Las skills de este proyecto viven en `.opencode/skills/`. Actualmente instalada:

| Skill | Ruta | Propósito |
|-------|------|-----------|
| `git-release` | `.opencode/skills/git-release/` | Gestiona el ciclo de releases y etiquetado de versiones. |

Otras skills pueden instalarse desde el cliente OpenCode según necesidad, evitando los IDs descontinuados.

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

## 8. Economía de tokens (obligatorio)

El coste crece con cada turno porque se relee todo el contexto. Reglas:

1. **Una sesión por fase de `tasks.md`**, no por rama. Al cerrar una sección (o pasar de ~150 turnos), registrar el estado en `tasks.md`/`MEMORY.md` y abrir sesión nueva.
2. **Nunca leer capturas PNG en bloque.** Se comparan por píxeles (`style-diff`, Playwright). Solo se leen con `Read` las que cambian a propósito (las 12 de v2 en D7), una a una y, si se puede, reducidas.
3. **Salida de comandos en silencio:** lint, tests y build se ejecutan filtrando (`| tail -20`, `--reporter=dot`); solo se muestra el resumen o el fallo.
4. **`MEMORY.md` es corto.** El histórico va a `docs/memory/` y los detalles de cada rama a su `tasks.md`; leer secciones con `offset`/`limit`, no ficheros enteros de más de 20 KB.
5. **Modelo y esfuerzo:** Sonnet por defecto; esfuerzo bajo/medio en trabajo mecánico (CSS, tokens, tests, docs); Opus solo para decisiones de diseño o depuración difícil.
6. **Trabajo pesado cuando la tarea lo pida:** E2E Docker y capturas se ejecutan en el momento que toca según el plan, sin aplazarlos por cuota.

---

Versión: 0.2.0 — 2026-11-12