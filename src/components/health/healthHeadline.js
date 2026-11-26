/** Frase narrativa del hero de Salud (v2) según la recuperación de hoy. */
const HEADLINES = {
    'Óptima': { lead: 'Estás', accent: 'listo', tail: 'para una sesión intensa.' },
    'Adaptándose': { lead: 'Tu cuerpo se está', accent: 'adaptando', tail: ': mantén la intensidad controlada.' },
    'Fatiga Alta': { lead: 'Hoy toca', accent: 'descansar', tail: ': tu sistema pide una descarga.' },
};
const UNKNOWN = { lead: 'Sin datos', accent: 'suficientes', tail: 'para valorar tu estado hoy.' };

export const healthHeadline = (label) => HEADLINES[label] || UNKNOWN;
