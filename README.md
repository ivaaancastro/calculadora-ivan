# Forma — Dashboard de rendimiento deportivo y salud

Aplicación web PWA de entrenamiento y rendimiento deportivo enfocada en triatlón,
ciclismo y carrera. Permite conectar Strava, analizar actividades, métricas de
fitness/fatiga (CTL/ATL/TSB), planificar entrenamientos y consultar un entrenador
IA basado en Google Gemini.

## 🚀 Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, Vite 7, Tailwind CSS |
| Ruteo | React Router DOM 7 |
| Estado global | Zustand, TanStack React Query |
| IA | Google Gemini (`gemini-1.5-flash`) |
| Backend / BaaS | Supabase (Auth, DB, RLS, Edge Functions) |
| Pruebas | Vitest (unit/integration), MSW, Playwright (E2E) |
| Calidad | ESLint flat config, PWA (`vite-plugin-pwa`), TypeScript (devDep) |

## 📋 Sistema de trabajo: SDD con agentes

Este proyecto sigue un flujo **Specification-Driven Development (SDD)** impulsado por agentes:

1. **Especificar** — `spec-agent` redacta una spec en `docs/specs/`.
2. **Planificar** — el agente lee la spec + `MEMORY` y genera un plan.
3. **Implementar** — `code-agent` (u otro agente) escribe el código.
4. **Verificar** — `test-agent` y `review-agent` corren pruebas, lint y build.
5. **Registrar** — `doc-agent` actualiza `CHANGELOG`, `MEMORY` y `docs/`.

Archivos clave del sistema SDD:
- `MEMORY` — estado persistente y contexto compartido entre agentes.
- `AGENTS` — definición de agentes, roles, flujos y reglas de colaboración.
- `docs/specs/` — especificaciones que impulsan el desarrollo.
- `skills/` — capacidades reutilizables (prompts, plantillas) por agente.
- `CHANGELOG.md` — registro de cambios por versión.

## 🛠️ Cómo empezar

### Requisitos
- Node.js 20+
- Cuenta de Supabase (URL y clave pública)
- Clave de API de Google Gemini

### Instalación
```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd calculadora-ivan

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env  # editar con VITE_SUPABASE_URL, VITE_SUPABASE_KEY, VITE_GEMINI_API_KEY

# Entorno de desarrollo
npm run dev
```

### Scripts disponibles
| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Build de producción |
| `npm run lint` | Linter (ESLint) |
| `npm run preview` | Vista previa del build |
| `npm run test:unit` | Pruebas unitarias (Vitest) |
| `npm run test:integration` | Pruebas de integración (Vitest + jsdom) |
| `npm run test:coverage` | Pruebas con cobertura |
| `npm run test:e2e` | Pruebas end-to-end (Playwright) |

### Variables de entorno (`.env`)
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_KEY=tu-clave-publica-de-supabase
VITE_GEMINI_API_KEY=tu-clave-de-gemini
```

## 📁 Estructura de carpetas

```
src/
  App.jsx              # Router principal + sesión Supabase
  supabase.js          # Cliente Supabase
  components/          # Componentes UI (Dashboard, pages, modals, layout, etc.)
  hooks/               # Custom hooks (useActivities, useFitnessAnalytics, etc.)
  services/            # Servicios externos (ai.js = Gemini)
  store/               # Estado global (Zustand)
  utils/               # Motores de cálculo (tssEngine, fitnessStatsEngine, etc.)
  __tests__/
    unit/              # Pruebas unitarias
    integration/       # Pruebas de integración
supabase/
  functions/           # Edge Functions (intervals-proxy)
migrations/            # Migraciones SQL versionadas
e2e/                   # Pruebas E2E (Playwright)
scratch/               # Scripts sueltos (revisar y migrar a specs)
docs/                  # Documentación técnica (arquitectura, specs, API, guías, SDD)
skills/                # Capacidades y prompts de los agentes SDD
.github/workflows/     # CI (se ejecuta en develop y PRs)
```

## 🤝 Cómo contribuir con agentes

1. Crea una rama desde `develop`: `git checkout -b feature/mi-feature develop`.
2. Escribe una spec en `docs/specs/` (usa `docs/sdd/plantilla-especificacion.md`).
3. El agente correspondiente implementa siguiendo la spec.
4. Ejecuta `npm run lint`, `npm run test:coverage` y `npm run build`.
5. Abre un PR hacia `develop` para revisión por `review-agent`.
6. Tras la aprobación, `doc-agent` actualiza `CHANGELOG` y `MEMORY`.

## 📄 Licencia

Privado — uso interno.

---
Versión: 0.1.0 — 2026-11-05