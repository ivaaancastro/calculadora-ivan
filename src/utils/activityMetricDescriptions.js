/**
 * Textos explicativos de las métricas del resumen del detalle de actividad.
 *
 * Centraliza aquí toda la copia explicativa para poder reusarla después en
 * Dashboard y Rendimiento sin duplicar. Cada entrada tiene:
 *  - id:    clave única usada para anclar la tarjeta explicativa.
 *  - label: nombre corto de la métrica (se muestra como título de la tarjeta).
 *  - description: explicación en lenguaje sencillo (1-3 frases).
 *
 * Sin hex sueltos ni lógica de UI: solo datos de texto.
 */

export const ACTIVITY_METRIC_DESCRIPTIONS = {
  tss: {
    id: 'tss',
    label: 'Carga (TSS)',
    description: 'La Carga de Entrenamiento (TSS) mide el esfuerzo global de la actividad teniendo en cuenta su duración e intensidad. Cuanto más larga y más intensa sea la sesión, mayor será la TSS. Sirve para comparar la carga de distintos entrenamientos y planificar el descanso.',
  },
  if: {
    id: 'if',
    label: 'IF',
    description: 'El Factor de Intensidad (IF) relaciona la intensidad media de la actividad con tu intensidad máxima sostenible (umbral). Un IF de 1,00 equivale a esforzarte al límite durante una hora. Valores más altos indican una sesión más exigente.',
  },
  np: {
    id: 'np',
    label: 'NP',
    description: 'La Potencia Normalizada (NP) es una potencia media ajustada que tiene en cuenta los cambios de ritmo y los esfuerzos puntuales. Refleja mejor el esfuerzo fisiológico real que la potencia media simple, sobre todo en sesiones con subidas, sprints o cambios de ritmo.',
  },
  work: {
    id: 'work',
    label: 'Trabajo',
    description: 'El Trabajo (kJ) es la energía mecánica total que has generado durante la actividad, expresada en kilojulios. En ciclismo equivale aproximadamente a las calorías quemadas al pedalear y es una buena referencia del volumen de trabajo realizado.',
  },
  hrAvg: {
    id: 'hrAvg',
    label: 'FC Media',
    description: 'La Frecuencia Cardíaca Media (FC Media) es el promedio de latidos por minuto durante la actividad. Te ayuda a calibrar la intensidad real del esfuerzo y a comparar sesiones similares en el tiempo.',
  },
  pace: {
    id: 'pace',
    label: 'Ritmo Medio',
    description: 'El Ritmo Medio es el tiempo promedio que tardas en recorrer un kilómetro (min/km). Un número menor significa que has ido más rápido. Se usa principalmente en actividades de carrera y marcha.',
  },
  speed: {
    id: 'speed',
    label: 'Vel. Media',
    description: 'La Velocidad Media es el ritmo promedio de la actividad en kilómetros por hora (km/h). Te da una idea rápida de qué tan rápido te has movido en conjunto, incluidas paradas y cambios de ritmo.',
  },
  distance: {
    id: 'distance',
    label: 'Distancia',
    description: 'La Distancia es el recorrido total cubierto durante la actividad, en kilómetros. Es la métrica más básica de volumen de entrenamiento.',
  },
  duration: {
    id: 'duration',
    label: 'Tiempo',
    description: 'El Tiempo es la duración total de la actividad, en horas, minutos y segundos. Incluye todo el tiempo transcurrido desde el inicio hasta el fin del registro.',
  },
  elevation: {
    id: 'elevation',
    label: 'Desnivel',
    description: 'El Desnivel positivo es el total de metros de ascenso acumulado durante la actividad. Cuanto mayor sea, más exigente ha sido la sesión desde el punto de vista muscular y cardiaco.',
  },
  cadence: {
    id: 'cadence',
    label: 'Cadencia',
    description: 'La Cadencia es el número de vueltas por minuto (rpm en bici, ppm en carrera). Indica la frecuencia de tus pasos o pedaleos y te ayuda a encontrar un ritmo eficiente y cómodo.',
  },
  wattsAvg: {
    id: 'wattsAvg',
    label: 'W Media',
    description: 'La Potencia Media (W Media) es el vatios promedio que has generado durante la actividad. Es la métrica principal de intensidad en ciclismo con potenciómetro y permite comparar sesiones de forma objetiva.',
  },
  ef: {
    id: 'ef',
    label: 'EF',
    description: 'El Factor de Eficiencia (EF) relaciona la potencia o velocidad con tu frecuencia cardíaca. Un EF más alto indica que te mueves con mayor eficiencia: generas más trabajo con menos esfuerzo cardiaco.',
  },
  decoupling: {
    id: 'decoupling',
    label: 'Drift',
    description: 'El Desacople Aeróbico (Drift) mide cuánto se desvía tu eficiencia entre la primera y la segunda mitad de la actividad. Un valor bajo significa que mantuviste un pulso estable para el mismo esfuerzo, señal de buena condición aeróbica.',
  },
};

/**
 * Devuelve la descripción de una métrica por su id. Si no existe, devuelve null.
 */
export function getActivityMetricDescription(metricId) {
  return ACTIVITY_METRIC_DESCRIPTIONS[metricId] || null;
}
