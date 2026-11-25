# Especificación SDD — spec-audit-08

## 1. Identificación
- **ID:** spec-audit-08
- **Título:** Hardening Edge Function `intervals-proxy` (rate limiting, validación, timeout)
- **Autor:** agente de implementación (Forma / calculadora-ivan)
- **Fecha:** 2026-11-05
- **Estado:** implementada

## 2. Objetivo
Endurecer la Edge Function `supabase/functions/intervals-proxy/index.ts` añadiendo rate limiting por usuario, validación estricta de la entrada (endpoint, athleteId, apiKey), timeout en la llamada a Intervals.icu y manejo seguro de errores, reduciendo la superficie de abuso y evitando llamadas colgantes o credenciales expuestas.

## 3. Contexto y justificación
- La función actual no tiene rate limiting: un usuario malintencionado (o un bucle en el cliente) puede agotar la cuota de Intervals.icu y los recursos de la Edge Function.
- El parámetro `endpoint` permite "passthrough genérico" (`athlete/{id}/${endpoint}`), lo cual expSurface de ataque (SSRF ligera / acceso a endpoints no deseados de Intervals.icu).
- No hay timeout en el `fetch` a Intervals.icu: si el servidor externo no responde, la Edge Function se queda colgada hasta su propio límite.
- CORS está configurado con `Access-Control-Allow-Origin: *` (demasiado permisivo).
- No se valida que el `athleteId` consultado pertenezca al usuario autenticado (el proxy reenvía cualquier athleteId con cualquier apiKey).
- `icuRes.json()` puede lanzar si Intervals.icu devuelve un cuerpo no JSON (ej. HTML de error).
- Esta spec está en el roadmap de MEMORY.md (Fase 4 — Estabilidad y tipo) como pendiente.

## 4. Requisitos funcionales
- [ ] Añadir rate limiting por usuario (por `user.id` de Supabase Auth) con ventana de tiempo configurable (ej. 60 req/min) usando Deno KV o un almacén en memoria persistente dentro de la instancia.
- [ ] Validación estricta de `endpoint`: permitir solo una lista blanca (`wellness`, `athlete`, `activities`); rechazar cualquier otro con 400.
- [ ] Validar que `athleteId` y `apiKey` sean strings no vacíos y con formato básico; `params` debe ser un objeto.
- [ ] Añadir timeout (ej. 10 segundos) al `fetch` hacia Intervals.icu; si se excede, devolver 504 con mensaje amigable.
- [ ] Manejo seguro de `icuRes.json()`: envolver en try/catch; si falla, devolver el texto crudo o un error 502 sin exponer stack traces.
- [ ] Reemplazar CORS `*` por una lista de orígenes permitidos (o al menos restringir métodos y headers).
- [ ] No exponer claves API ni detalles internos en los mensajes de error al cliente.
- [ ] Mantener la funcionalidad existente para endpoints válidos (retrocompatibilidad para el cliente).
- [ ] `npm run lint` pasa (si aplica a la función).
- [ ] La función se desplega con `supabase functions deploy intervals-proxy` (no se ejecuta en CI local, pero debe ser sintácticamente válida).

## 5. Criterios de aceptación
- [ ] Rate limiting por usuario implementado (rejilla de 60 req/min por defecto).
- [ ] Solo endpoints en lista blanca permitidos (`wellness`, `athlete`, `activities`).
- [ ] Timeout de 10s en el fetch a Intervals.icu con respuesta 504 al excederse.
- [ ] `icuRes.json()` protegido contra respuestas no JSON.
- [ ] Errores al cliente no revelan claves API ni stack traces internos.
- [ ] CORS restringido (orígenes/métodos/headers limitados).
- [ ] Commits con convención estándar: `feat(edge-function): <descripción>`.
- [ ] PR abierto hacia `develop`.
- [ ] `MEMORY.md` actualizado (spec-audit-08 marcada como implementada).
- [ ] `CHANGELOG.md` actualizado.

## 6. Diseño técnico
- **Archivo afectado (modificado):** `supabase/functions/intervals-proxy/index.ts`.
- **Rate limiting:** uso de `Deno.openKv` (Disponible en Deno Deploy/Supabase Edge Functions) con clave `rate_limit:{userId}` y expiración TTL. Alternativa: mapa en memoria con limpieza periódica si KV no está disponible.
- **Endpoints permitidos:** `wellness`, `athlete`, `activities`. Cualquier otro → 400.
- **Timeout:** `AbortController` con `signal` y `setTimeout` para abortar el `fetch` a los 10s.
- **Respuesta de error:** siempre JSON con `{ error, detail? }` sin internos.
- **CORS:** origen restringido (configurable por env var `ALLOWED_ORIGIN`, fallback a origen del request o lista cerrada).
- **Base de datos:** No aplica (solo la Edge Function).
- **Rama:** `feat/edge-function-intervals-proxy-hardening` creada desde `develop`.
- **Merge:** PR hacia `develop` (no a `main`).

## 7. Pruebas
- **Unitarias:** No hay tests de Edge Functions en el proyecto actualmente; se añadirá una nota. Opcional: test de lógica de validación si se extrae a un módulo separable.
- **Integración:** Desplegar en entorno de staging y verificar que endpoints válidos funcionan, endpoints no permitidos devuelven 400, y el rate limiting limita peticiones.
- **E2E:** No aplica directamente.

## 8. Notas adicionales
- Las Edge Functions de Supabase corren en Deno; usar APIs estándar de Deno (`Deno.openKv`, `AbortController`, `fetch` con signal).
- No commitear directamente a `main` ni a `develop`; siempre vía PR hacia `develop`.
- No iniciar la siguiente tarea hasta que esta esté mergeada.
- El despliegue en Supabase (`supabase functions deploy`) lo hace el usuario/DevOps; este agente solo prepara el código.

---
Versión: 0.1.0 — 2026-11-05
