// Supabase Edge Function: intervals-proxy
// Proxies requests to Intervals.icu API server-side to bypass CORS
// Deploy with: supabase functions deploy intervals-proxy

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Configuración ──────────────────────────────────────────────────────────
const BASE = "https://intervals.icu/api/v1";
const RATE_LIMIT_WINDOW_SECONDS = 60; // ventana de 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 60;   // máximo 60 peticiones por usuario y ventana
const FETCH_TIMEOUT_MS = 10_000;      // 10 segundos de timeout en la llamada a Intervals.icu

// Endpoints permitidos (lista blanca). El passthrough genérico se elimina por seguridad.
const ALLOWED_ENDPOINTS = new Set(["wellness", "athlete", "activities"]);

// Orígenes CORS permitidos. Por defecto se acepta el origen de la petición si está definido;
// de lo contrario se usa una lista cerrada. Se puede sobrescribir con ALLOWED_ORIGIN.
const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:5173", "https://localhost:5173"];

function getAllowedOrigin(requestOrigin: string | null): string {
  const envOrigin = Deno.env.get("ALLOWED_ORIGIN");
  if (envOrigin) return envOrigin;
  if (requestOrigin && DEFAULT_ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }
  // Origen por defecto seguro (desarrollo). En producción configurar ALLOWED_ORIGIN.
  return DEFAULT_ALLOWED_ORIGINS[0];
}

const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
});

// ── Rate limiting (Deno KV) ────────────────────────────────────────────────
let kv: Deno.Kv | null = null;

async function getKv(): Promise<Deno.Kv> {
  if (!kv) {
    kv = await Deno.openKv();
  }
  return kv;
}

async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const store = await getKv();
  const key = ["rate_limit", userId];
  const now = Date.now();
  const windowStart = now - (now % (RATE_LIMIT_WINDOW_SECONDS * 1000));

  // Leer el contador actual de esta ventana
  const entry = await store.get<number>(key);
  const current = entry?.value ?? 0;

  if (current >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  // Incrementar contador (con expiración al final de la ventana para limpieza automática)
  await store.atomic()
    .sum(key, 1)
    .commit({ expireIn: RATE_LIMIT_WINDOW_SECONDS });

  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - current - 1 };
}

// ── Utilidades ─────────────────────────────────────────────────────────────
function jsonResponse(
  body: unknown,
  status: number,
  origin: string,
  headers: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json", ...headers },
  });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ── Handler principal ──────────────────────────────────────────────────────
serve(async (req) => {
  const origin = getAllowedOrigin(req.headers.get("Origin"));

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  // Solo se permiten POST
  if (req.method !== "POST") {
    return jsonResponse({ error: "Método no permitido" }, 405, origin);
  }

  try {
    // 1. Validar usuario vía Supabase Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "No autorizado" }, 401, origin);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: "No autorizado" }, 401, origin);
    }

    // 2. Rate limiting por usuario
    const rate = await checkRateLimit(user.id);
    if (!rate.allowed) {
      return jsonResponse(
        { error: "Demasiadas peticiones. Inténtalo de nuevo más tarde." },
        429,
        origin,
        { "Retry-After": String(RATE_LIMIT_WINDOW_SECONDS) }
      );
    }

    // 3. Parsear y validar el cuerpo de la petición
    let body: { endpoint?: unknown; athleteId?: unknown; apiKey?: unknown; params?: unknown };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Cuerpo de petición inválido (JSON esperado)" }, 400, origin);
    }

    const { endpoint, athleteId, apiKey, params = {} } = body;

    if (!isNonEmptyString(endpoint)) {
      return jsonResponse({ error: "Falta el parámetro 'endpoint'" }, 400, origin);
    }
    if (!ALLOWED_ENDPOINTS.has(endpoint)) {
      return jsonResponse({ error: "Endpoint no permitido" }, 400, origin);
    }
    if (!isNonEmptyString(athleteId)) {
      return jsonResponse({ error: "Falta o es inválido 'athleteId'" }, 400, origin);
    }
    if (!isNonEmptyString(apiKey)) {
      return jsonResponse({ error: "Falta o es inválido 'apiKey'" }, 400, origin);
    }
    if (!isPlainObject(params)) {
      return jsonResponse({ error: "'params' debe ser un objeto" }, 400, origin);
    }

    // 4. Construir URL de Intervals.icu (solo endpoints de lista blanca)
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const url = `${BASE}/athlete/${encodeURIComponent(athleteId)}/${endpoint}${
      queryString ? "?" + queryString : ""
    }`;

    // 5. Llamar a Intervals.icu con Basic Auth y timeout
    const authBasic = `Basic ${btoa(`API_KEY:${apiKey}`)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let icuRes: Response;
    try {
      icuRes = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: authBasic,
          Accept: "application/json",
        },
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr instanceof DOMException && fetchErr.name === "AbortError") {
        return jsonResponse(
          { error: "Tiempo de espera agotado consultando Intervals.icu" },
          504,
          origin
        );
      }
      return jsonResponse({ error: "Error consultando Intervals.icu" }, 502, origin);
    }
    clearTimeout(timeoutId);

    // 6. Leer la respuesta de forma segura (protegido contra cuerpos no JSON)
    let data: unknown;
    let rawText: string | null = null;
    try {
      const text = await icuRes.text();
      rawText = text;
      data = text ? JSON.parse(text) : null;
    } catch {
      // Si no es JSON válido, devolvemos 502 sin exponer el cuerpo crudo
      return jsonResponse(
        { error: "Respuesta inválida de Intervals.icu" },
        502,
        origin
      );
    }

    if (!icuRes.ok) {
      return jsonResponse(
        { error: `Intervals.icu error ${icuRes.status}`, detail: data },
        icuRes.status,
        origin
      );
    }

    return jsonResponse(data, 200, origin, {
      "X-RateLimit-Remaining": String(rate.remaining),
    });

  } catch (err) {
    // Errores inesperados: no exponer detalles internos al cliente
    console.error("intervals-proxy error:", err);
    return jsonResponse({ error: "Error interno del servidor" }, 500, origin);
  }
});
