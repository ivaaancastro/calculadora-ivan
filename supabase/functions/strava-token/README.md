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
   supabase secrets set STRAVA_CLIENT_ID=<id> STRAVA_CLIENT_SECRET=<secreto-nuevo>
   # Orígenes CORS separados por comas (por defecto solo localhost:5173):
   supabase secrets set ALLOWED_ORIGIN=https://<dominio-de-produccion>,http://localhost:5173
   ```
3. Desplegar: `supabase functions deploy strava-token`
4. Borrar `VITE_STRAVA_CLIENT_SECRET` del `.env` local y de las variables de entorno de Vercel.
