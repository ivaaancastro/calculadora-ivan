# Métricas de entrenamiento

Una sola implementación por cifra (spec B1, `docs/branches/feat/calculos-centralizados/`). Si una
pantalla necesita una de estas cifras, la lee de aquí: no la recalcula ni la vuelve a redondear.

| Qué | Dónde |
|-----|-------|
| TSS, PMC (CTL, ATL, TSB), TSS planificado | `src/utils/tssEngine.ts` |
| Carga por periodo, ACWR, rampa, tendencia, monotonía | `src/utils/load.js` |
| Distribución de carga | `src/utils/loadDistribution.js` |
| Zonas de FC, potencia y ritmo | `src/utils/zones.js` |
| Días y semanas | `src/utils/dates.js` |
| Estado de forma | `src/utils/formState.js` |

## 1. Fechas
- Un día es una clave `YYYY-MM-DD`; las semanas van de lunes a domingo.
- Actividad: cuenta el día escrito en su fecha (Strava manda la hora local marcada con `Z`).
- Entreno planificado: se guarda como instante; cuenta el día local.
- Un rango de N días son N días contando hoy.

## 2. TSS de una sesión (`calculateActivityTSS`)
Se usa la primera fuente disponible:
1. **Potencia (bici).** Potencia normalizada (media móvil de 30 s, a la cuarta potencia; los
   huecos de más de 10 s se acortan a 10 s): `TSS = s × NP² / (FTP² × 36)`. Sin streams, la misma
   fórmula con los vatios medios.
2. **FC en streams (hrTSS).** TRIMP de Banister, `Σ min × d × y × e^(b·d)`, con
   `d = (FC − reposo) / (máx − reposo)`; `y, b` = 0,64 y 1,92 (hombre) o 0,86 y 1,67 (mujer).
   `TSS = 100 × TRIMP / TRIMP de 1 h al LTHR`. Los huecos de más de 5 min no cuentan.
3. **FC media:** la misma fórmula con una FC constante.
4. **Solo duración:** 40 TSS/h en fuerza y 25 TSS/h en el resto.

Los streams solo se usan en los **últimos 95 días** (`STREAMS_WINDOW_DAYS`, los que la app carga
siempre); lo anterior se calcula con datos resumidos aunque sus streams lleguen después.

## 3. Forma: CTL, ATL y TSB (`calculatePMC`)
- Media móvil exponencial diaria: `X(d) = X(d−1)·k + carga(d)·(1 − k)`, con `k = e^(−1/τ)`;
  τ = 42 días (CTL) y 7 (ATL), configurables (`ta`, `tf`).
- Hasta hoy cuenta lo realizado; los 90 días siguientes, los entrenos planificados.
- Peso de cada deporte (CTL / ATL): bici, carrera, natación y otros 1 / 1; fuerza 0 / 1;
  caminata 0 / 0,5; yoga 0 / 0,2.
- El ajuste manual (`offsetCtl`) se suma al CTL después de la media: no decae.
- **TSB, convención «hoy»:** `TSB = redondeo(CTL) − redondeo(ATL)` del mismo día. Siempre cuadra
  con lo que se ve; baja justo después de entrenar.
- Estado de forma por TSB: > 25 transición; 5 a 25 pico; −10 a 5 productiva; −30 a −10
  sobrecarga; < −30 fatiga crítica. Sin CTL, sin datos.

## 4. Carga y derivadas
- **Carga** de un periodo (semana, 7 d, mes): suma del TSS de **todos** los deportes, sin pesos y
  sin rellenar sesiones sin TSS.
- **Rampa:** `CTL(d) − CTL(d − 7)`; sin 8 días de historia no se muestra.
- **Tendencia de fitness:** variación porcentual del CTL frente a hace 28 días.
- **ACWR:** media diaria de 7 días / media de 28, sobre la carga ponderada por fatiga. Baja
  < 0,8; óptima hasta 1,3; vigilar hasta 1,5; riesgo por encima. Sin 28 días, sin datos.
- **Monotonía** = media / desviación de la carga diaria de 7 días (tope 4 si todos son iguales);
  **strain** = carga de la semana × monotonía (Foster, 1998). Sin 7 días, sin datos.

## 5. Zonas
- Siete zonas de FC (% del LTHR, Friel, o % de la FC máxima, o a mano), siete de potencia (% del
  FTP) y siete de ritmo (% de la velocidad umbral). Valores en `zones.js`.
- Para clasificar solo cuentan los límites inferiores: cada valor cae en la última zona cuyo
  mínimo no supera, así que los huecos entre rangos mostrados no pierden segundos.
- Ciclismo usa las zonas de bici; el resto, las de carrera.

## 6. Distribución de carga (`loadDistribution`)
Reparte el TSS de cada sesión en tres categorías:

| Categoría | Zonas | Objetivo |
|-----------|-------|----------|
| Aeróbico bajo | Z1–Z2 | 60–80 % |
| Aeróbico alto | Z3–Z5 | 10–25 % |
| Anaeróbico | Z6–Z7 | 5–15 % |

- Peso de cada zona: `segundos en la zona × TSS/h de la zona`; el reparto suma el TSS de la sesión.
- Fuente, por orden: potencia en streams (bici, con FTP) → FC en streams → FC media (toda la
  sesión a una zona; se cuenta como **estimada**) → sin clasificar.
- TSS/h por zona: en potencia, `IF² × 100` con la intensidad central de la zona (la Z1 desde
  0,40); en FC, `computeZoneTssPerHour`.
- No cuentan las muestras a cero ni los huecos de más de 5 min.
- Entran carrera, bici, natación y «otros»; fuerza, yoga y caminata no. Rangos de 7, 28 y 90 días.
- Los enteros mostrados se reparten por mayores restos: las tres categorías suman la carga
  clasificada y los porcentajes suman 100.

**Límites.** Es una aproximación propia inspirada en el «Enfoque de carga» de Garmin. Aquel parte
del EPOC estimado latido a latido (Firstbeat, propietario) y usa objetivos personales; aquí los
objetivos son fijos, la FC responde tarde en intervalos cortos (infravalora lo anaeróbico sin
potenciómetro) y las sesiones estimadas no distinguen intervalos. Las cifras no coinciden.
