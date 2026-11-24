import { supabase } from '../supabase';

/**
 * stravaToken — canje y refresco del token OAuth de Strava a través de la
 * Edge Function `strava-token` (supabase/functions/strava-token). El secreto
 * de cliente vive solo en el servidor; aquí nunca aparece.
 *
 * `supabase.functions.invoke` añade el JWT de la sesión en `Authorization`.
 */

const FUNCTION_NAME = 'strava-token';

/** Extrae el mensaje `{ error }` que devuelve la función, si lo hay. */
async function errorMessage(error) {
  try {
    const body = await error?.context?.json?.();
    if (body?.error) return body.error;
  } catch {
    // cuerpo no JSON: se usa el mensaje genérico
  }
  return error?.message || 'Error al obtener el token de Strava';
}

async function invokeStravaToken(body) {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, { body });
  if (error) throw new Error(await errorMessage(error));
  if (!data?.access_token) throw new Error('Respuesta de token de Strava inválida');
  return data;
}

/** Canjea el `code` del callback OAuth por `{ access_token, refresh_token, expires_at }`. */
export function exchangeStravaCode(code) {
  return invokeStravaToken({ grant_type: 'authorization_code', code });
}

/** Pide un access token nuevo a partir del refresh token guardado. */
export function refreshStravaToken(refreshToken) {
  return invokeStravaToken({ grant_type: 'refresh_token', refresh_token: refreshToken });
}
