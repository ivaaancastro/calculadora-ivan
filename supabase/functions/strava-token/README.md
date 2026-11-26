# strava-token

Edge Function que canjea el código OAuth de Strava (`grant_type=authorization_code`) y
refresca el token (`grant_type=refresh_token`) en el servidor. El secreto de cliente vive
solo en los secretos de Supabase; el navegador ya no lo recibe (SEG-1).

## Contrato

`POST /functions/v1/strava-token` con el JWT del usuario en `Authorization: Bearer …`
(lo añade `supabase.functions.invoke`; en el cliente, `src/services/stravaToken.js`).

| Cuerpo | Respuesta 200 |
|--------|---------------|
| `{ "grant_type": "authorization_code", "code": "…" }` | `{ access_token, refresh_token, expires_at, expires_in, token_type }` |
| `{ "grant_type": "refresh_token", "refresh_token": "…" }` | ídem |

Errores, siempre JSON `{ error }`: `400` (entrada inválida o Strava rechaza el código),
`401` (sin sesión válida), `405`, `500` (faltan secretos), `502`/`504` (Strava caído o lento).

**JWT:** se verifica dos veces: en el gateway (`verify_jwt`, activo por defecto; no desplegar
con `--no-verify-jwt`) y en la propia función con `supabase.auth.getUser()`.

## Pasos (los ejecuta el usuario)

1. **Rotar el secreto** en <https://www.strava.com/settings/api>: el anterior estuvo en el bundle.
2. Guardar las credenciales como secretos de Supabase:
   ```bash
   supabase secrets set STRAVA_CLIENT_SECRET=<secreto-nuevo>
   # Opcionales: STRAVA_CLIENT_ID (si no, se usa el id público que envía la app) y
   # ALLOWED_ORIGIN, orígenes CORS separados por comas (si no, se acepta el origen que llama:
   # la función exige el JWT de Supabase en la cabecera y no usa cookies).
   ```
3. Desplegar: `supabase functions deploy strava-token`
4. Borrar `VITE_STRAVA_CLIENT_SECRET` del `.env` local y de las variables de entorno de Vercel.
