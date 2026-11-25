// Supabase Edge Function: strava-token
// Canjea el código OAuth de Strava y refresca tokens en el servidor, para que el
// secreto de cliente (STRAVA_CLIENT_SECRET) nunca llegue al bundle del navegador.
// Despliegue: supabase functions deploy strava-token (ver README.md).
//
// Autenticación (doble):
//  1. El gateway de Supabase verifica el JWT (verify_jwt = true, el valor por defecto
//     al desplegar sin --no-verify-jwt).
//  2. La función vuelve a validarlo con supabase.auth.getUser() usando la cabecera
//     Authorization, así que una sesión revocada o la clave anon sola no pasan.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Configuración ──────────────────────────────────────────────────────────
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_VALUE_LENGTH = 512; // los códigos y refresh tokens de Strava son cortos

// Orígenes CORS. ALLOWED_ORIGIN admite uno o varios separados por comas.
const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:5173", "https://localhost:5173", "http://localhost:5180"];

function getAllowedOrigin(requestOrigin: string | null): string {
  const envOrigins = (Deno.env.get("ALLOWED_ORIGIN") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  // Sin ALLOWED_ORIGIN se devuelve el origen que llama: la función exige un JWT de Supabase en la
  // cabecera (no hay cookies), así que abrir CORS no permite nada que no permita ya el token.
  if (envOrigins.length === 0) return requestOrigin ?? DEFAULT_ALLOWED_ORIGINS[0];
  if (requestOrigin && envOrigins.includes(requestOrigin)) return requestOrigin;
  return envOrigins[0];
}

const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

function jsonResponse(body: unknown, status: number, origin: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function isValidValue(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_VALUE_LENGTH &&
    /^[A-Za-z0-9._~-]+$/.test(value)
  );
}

// ── Handler principal ──────────────────────────────────────────────────────
serve(async (req) => {
  const origin = getAllowedOrigin(req.headers.get("Origin"));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Método no permitido" }, 405, origin);
  }

  try {
    // 1. Usuario autenticado en Supabase
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "No autorizado" }, 401, origin);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: "No autorizado" }, 401, origin);
    }

    // 2. Cuerpo: { grant_type: 'authorization_code', code } | { grant_type: 'refresh_token', refresh_token }
    let body: { grant_type?: unknown; code?: unknown; refresh_token?: unknown; client_id?: unknown } | null;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Cuerpo de petición inválido (JSON esperado)" }, 400, origin);
    }

    const params = new URLSearchParams();
    if (body?.grant_type === "authorization_code") {
      if (!isValidValue(body.code)) {
        return jsonResponse({ error: "Falta o es inválido 'code'" }, 400, origin);
      }
      params.set("grant_type", "authorization_code");
      params.set("code", body.code);
    } else if (body?.grant_type === "refresh_token") {
      if (!isValidValue(body.refresh_token)) {
        return jsonResponse({ error: "Falta o es inválido 'refresh_token'" }, 400, origin);
      }
      params.set("grant_type", "refresh_token");
      params.set("refresh_token", body.refresh_token);
    } else {
      return jsonResponse({ error: "'grant_type' no permitido" }, 400, origin);
    }

    // 3. Credenciales de la app (solo en el servidor)
    // El id de cliente es público (va en la URL de autorización): si no está como secreto, se acepta
    // el que envía la app. El secreto solo vive en el servidor.
    const bodyClientId = typeof body?.client_id === "string" && /^\d{1,12}$/.test(body.client_id) ? body.client_id : null;
    const clientId = Deno.env.get("STRAVA_CLIENT_ID") || bodyClientId;
    const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      console.error("strava-token: faltan STRAVA_CLIENT_ID o STRAVA_CLIENT_SECRET");
      return jsonResponse({ error: "Configuración del servidor incompleta" }, 500, origin);
    }
    params.set("client_id", clientId);
    params.set("client_secret", clientSecret);

    // 4. Llamada a Strava (cuerpo form-urlencoded: el secreto no viaja en la URL)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let stravaRes: Response;
    try {
      stravaRes = await fetch(STRAVA_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: params.toString(),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      if (fetchErr instanceof DOMException && fetchErr.name === "AbortError") {
        return jsonResponse({ error: "Tiempo de espera agotado consultando Strava" }, 504, origin);
      }
      return jsonResponse({ error: "Error consultando Strava" }, 502, origin);
    } finally {
      clearTimeout(timeoutId);
    }

    let data: Record<string, unknown> | null;
    try {
      const text = await stravaRes.text();
      data = text ? JSON.parse(text) : null;
    } catch {
      return jsonResponse({ error: "Respuesta inválida de Strava" }, 502, origin);
    }

    if (!stravaRes.ok || !data) {
      // Solo el estado; nunca se registran tokens ni credenciales.
      console.error(`strava-token: Strava respondió ${stravaRes.status}`);
      const message = typeof data?.message === "string" ? data.message : "Error de Strava";
      return jsonResponse({ error: message }, stravaRes.status >= 500 ? 502 : 400, origin);
    }

    // 5. Devolver solo lo que necesita el cliente
    return jsonResponse(
      {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        expires_in: data.expires_in,
        token_type: data.token_type,
      },
      200,
      origin,
    );
  } catch (err) {
    console.error("strava-token error:", err instanceof Error ? err.name : "desconocido");
    return jsonResponse({ error: "Error interno del servidor" }, 500, origin);
  }
});
