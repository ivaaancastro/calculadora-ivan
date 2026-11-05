# Documentación de servicios y API

## 1. Servicio de IA — `src/services/ai.ts`

### `askGemini(userQuestion, contextData, structured?)`
Envía una pregunta a Google Gemini con contexto del atleta.

**Parámetros:**
- `userQuestion` (string): pregunta del usuario.
- `contextData` (object): `{ currentMetrics, recentActivities, nextRace }`.
- `structured` (boolean, opcional): si `true`, solicita una respuesta JSON estructurada y devuelve `{ text, json }`. Si se omite o es `false`, devuelve `string` (retrocompatibilidad).

**Retorna:**
- Por defecto: `Promise<string>` — respuesta de texto del modelo.
- Con `structured: true`: `Promise<{ text: string, json: GeminiStructuredResponse }>` donde `GeminiStructuredResponse` es:
  - `analisis` (string)
  - `recomendacion` (string)
  - `ajusteEntrenamiento` ('mantener' | 'reducir' | 'aumentar')
  - `confianza` (number, 0-100)
  - `metas` (string[])

**Variables de entorno:** `VITE_GEMINI_API_KEY`.

**Modelo:** `gemini-1.5-flash` (singleton lazy).

### Ejemplo (modo estructurado)
```ts
const { text, json } = await askGemini('¿Cómo estoy?', contextData, true);
// json.ajusteEntrenamiento: 'mantener' | 'reducir' | 'aumentar'
// json.confianza: 0-100
```

### Retrocompatibilidad
Las llamadas existentes sin el tercer parámetro siguen devolviendo un `string` sin cambios.

### Implementación
Ver `spec-001` (Servicio de IA con Gemini — respuestas estructuradas).

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