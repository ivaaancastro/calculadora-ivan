// Origen de cada VO₂max mostrado (spec-capa6-v2-premium, RF-C3 / COP-2).
// La app enseña hasta tres valores distintos; cada uno dice de dónde sale.

export const VO2_SOURCES = Object.freeze({
    run: { label: 'VO₂max carrera', source: 'estimado de ritmo y FC' },
    bike: { label: 'VO₂max ciclismo', source: 'estimado de potencia' },
    device: { label: 'VO₂max del dispositivo', source: 'sincronizado de Intervals.icu' },
});

/** «VO₂max carrera (estimado de ritmo y FC)». */
export const vo2SourceText = (key) => {
    const s = VO2_SOURCES[key];
    return s ? `${s.label} (${s.source})` : 'VO₂max';
};

/**
 * VO₂max principal de Analítica avanzada con su origen. Prioridad: ciclismo estimado, dispositivo
 * y carrera estimada (la de siempre); antes la etiqueta decía «Sincronizado» aunque el valor fuese el estimado de bici.
 * @returns {{value: number|null, source: 'bike'|'device'|'run'|null}}
 */
export const pickPrimaryVo2 = ({ bike, device, run } = {}) => {
    if (bike > 0) return { value: bike, source: 'bike' };
    if (device > 0) return { value: device, source: 'device' };
    if (run > 0) return { value: run, source: 'run' };
    return { value: null, source: null };
};
