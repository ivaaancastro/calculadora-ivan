-- B8a · Agregados de solo lectura para calibrar la auditoría.
-- Ejecutar entero en Supabase → SQL Editor y copiar la tabla de resultados (3 columnas).
-- Solo SELECT. Devuelve recuentos, bytes y nombres de columnas/claves; nunca valores
-- (ni nombres, coordenadas, identificadores de usuario o credenciales).
-- Puede tardar unos segundos: recorre todos los streams.
-- Aparte, anota el valor de Project Settings → API (Data API) → «Max rows».

with
a as (
  select user_id,
         to_jsonb(t) as j,
         left(to_jsonb(t) ->> 'date', 10)::date as dia,
         to_jsonb(t) ->> 'strava_id' as strava_id,
         nullif(to_jsonb(t) -> 'streams_data', 'null'::jsonb) as s
  from public.activities t
),
st as (
  select case when dia >= current_date - 95 then 'ultimos_95d' else 'anteriores' end as tramo, s
  from a where s is not null
),
w as (select to_jsonb(t) as j, date as dia from public.wellness_data t),
p as (select to_jsonb(t) as j from public.profiles t),
pw as (select to_jsonb(t) as j from public.planned_workouts t)

select '1 filas' as seccion, 'activities' as clave, count(*)::numeric as valor from a
union all select '1 filas', 'activities: máximo por usuario', coalesce(max(n), 0) from (select count(*) n from a group by user_id) x
union all select '1 filas', 'activities: últimos 95 días', count(*) from a where dia >= current_date - 95
union all select '1 filas', 'activities: años de historial', round((current_date - min(dia)) / 365.25, 1) from a
union all select '1 filas', 'activities: con streams', count(*) from a where s is not null
union all select '1 filas', 'activities: de Strava sin streams', count(*) from a where s is null and strava_id is not null
union all select '1 filas', 'activities: strava_id repetidos (filas de más)', coalesce(sum(n - 1), 0) from (select count(*) n from a where strava_id is not null group by user_id, strava_id having count(*) > 1) x
union all select '1 filas', 'wellness_data', count(*) from w
union all select '1 filas', 'wellness_data: últimos 180 días', count(*) from w where dia >= current_date - 180
union all select '1 filas', 'planned_workouts', count(*) from pw
union all select '1 filas', 'profiles', count(*) from p

union all select '2 columnas activities (bytes totales)', k.key, sum(octet_length(k.value::text))
  from a, jsonb_each(a.j - 'streams_data') k group by k.key
union all select '3 respuestas (bytes JSON)', 'activities sin streams', coalesce(sum(octet_length((j - 'streams_data')::text)), 0) from a
union all select '3 respuestas (bytes JSON)', 'wellness_data 180 días', coalesce(sum(octet_length(j::text)), 0) from w where dia >= current_date - 180
union all select '3 respuestas (bytes JSON)', 'planned_workouts', coalesce(sum(octet_length(j::text)), 0) from pw
union all select '3 respuestas (bytes JSON)', 'profiles (una fila, media)', coalesce(round(avg(octet_length(j::text))), 0) from p
union all select '4 columnas wellness_data (filas con valor)', k.key, count(*) filter (where k.value <> 'null'::jsonb)
  from w, jsonb_each(w.j) k group by k.key
union all select '5 columnas profiles (nombre)', k.key, count(*) from p, jsonb_each(p.j) k group by k.key
union all select '5 columnas planned_workouts (nombre)', k.key, count(*) from pw, jsonb_each(pw.j) k group by k.key

union all select '6 streams ' || tramo, 'actividades', count(*) from st group by tramo
union all select '6 streams ' || tramo, 'bytes JSON totales', sum(octet_length(s::text)) from st group by tramo
union all select '6 streams ' || tramo, 'bytes JSON por actividad (media)', round(avg(octet_length(s::text))) from st group by tramo
union all select '6 streams ' || tramo, 'bytes JSON por actividad (máx.)', max(octet_length(s::text)) from st group by tramo
union all select '6 streams ' || tramo, 'bytes en disco (comprimido)', sum(pg_column_size(s)) from st group by tramo
union all select '6 streams ' || tramo, 'puntos por actividad (media)', round(avg(jsonb_array_length(s -> 'time' -> 'data'))) from st where jsonb_typeof(s -> 'time' -> 'data') = 'array' group by tramo
union all select '7 streams por clave: ' || tramo, k.key, sum(octet_length(k.value::text))
  from st, jsonb_each(st.s) k group by tramo, k.key
union all select '8 streams sin vueltas', 'laps vacío', count(*) from st where s -> 'laps' = '[]'::jsonb

union all select '9 índices', indexname, case when indexdef ilike 'create unique%' then 1 else 0 end
  from pg_indexes where schemaname = 'public' and tablename in ('activities', 'wellness_data', 'planned_workouts', 'profiles')

order by 1, 2;
