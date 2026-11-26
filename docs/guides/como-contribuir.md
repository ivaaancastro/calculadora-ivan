# Cómo contribuir

## 1. Flujo de trabajo con agentes (SDD)

1. Crea una rama desde `develop`:
   ```bash
   git checkout -b feature/mi-feature develop
   ```
2. Escribe una spec en `docs/specs/` usando `docs/sdd/plantilla-especificacion.md`.
3. Registra la spec en `MEMORY` y en `docs/specs/README.md`.
4. El agente correspondiente implementa siguiendo la spec.
5. Ejecuta verificaciones:
   ```bash
   npm run lint
   npm run test:coverage
   npm run build
   ```
6. Abre un PR hacia `develop` para revisión.
7. Tras la aprobación, `doc-agent` actualiza `CHANGELOG.md` y `MEMORY`.

## 2. Reglas generales

- Nunca escribas código de producción sin una spec aprobada.
- Cada agente actualiza `MEMORY` al finalizar su tarea.
- `review-agent` debe aprobar antes de cualquier merge a `develop`.
- Las skills en `skills/` son la fuente de prompts y plantillas de cada agente.

## 3. Entorno de desarrollo

```bash
npm install
npm run dev          # servidor de desarrollo
npm run lint         # linter
npm run test:unit    # pruebas unitarias
npm run test:integration  # pruebas de integración
npm run test:e2e     # pruebas end-to-end
npm run build        # build de producción
```

## 4. Variables de entorno

Crea un archivo `.env` basado en `.env.example` con:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`
- `VITE_GEMINI_API_KEY`

---
Versión: 0.1.0 — 2026-11-05