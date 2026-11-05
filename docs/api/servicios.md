# Documentación de servicios y API

## 1. Servicio de IA — `src/services/ai.js`

### `askGemini(userQuestion, contextData)`
Envía una pregunta a Google Gemini con contexto del atleta y devuelve la respuesta como string.

**Parámetros:**
- `userQuestion` (string): pregunta del usuario.
- `contextData` (object): `{ currentMetrics, recentActivities, nextRace }`.

**Retorna:** `Promise<string>` — respuesta de texto del modelo.

**Variables de entorno:** `VITE_GEMINI_API_KEY`.

**Modelo:** `gemini-1.5-flash` (singleton lazy).

### Nota
Esta spec está pendiente de evolución hacia respuestas estructuradas (ver `docs/specs/spec-001.md`).

## 2. Cliente Supabase — `src/supabase.js`

Instancia única de `@supabase/supabase-js` creada con `VITE_SUPABASE_URL` y `VITE_SUPABASE_KEY`.

## 3. Edge Function — `supabase/functions/intervals-proxy`

Proxy a Intervals.icu para sincronización de datos de entrenamiento y bienestar.

## 4. Variables de entorno requeridas

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | Sí |
| `VITE_SUPABASE_KEY` | Clave pública (anon) de Supabase | Sí |
| `VITE_GEMINI_API_KEY` | Clave de API de Google Gemini | Sí (para el asistente IA) |

---
Versión: 0.1.0 — 2026-11-05