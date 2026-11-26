// Puntos de la serie PMC (spec-capa6-v2-premium, RF-C2 / BUG-1).
// La serie de `calculatePMC` usa claves de día UTC ('YYYY-MM-DD' de toISOString) y añade 7 días
// proyectados después de hoy; «hoy» se calcula igual para que coincida con las métricas del héroe.

/** Clave del día de hoy con el mismo criterio que la serie PMC. */
export const pmcTodayKey = (now = new Date()) => now.toISOString().slice(0, 10);

/**
 * Punto de HOY en la serie (el último con fecha <= hoy), no el último proyectado.
 * Si toda la serie es futura devuelve el primero; sin datos, null.
 */
export const pickTodayPoint = (data, todayKey = pmcTodayKey()) => {
    if (!Array.isArray(data) || data.length === 0) return null;
    for (let i = data.length - 1; i >= 0; i--) {
        if (String(data[i].date) <= todayKey) return data[i];
    }
    return data[0];
};

/** Texto de la etiqueta de la banda proyectada según su ancho en px (BUG-10): completo, abreviado o nada. */
export const projectionLabelText = (width) => {
    if (width >= 64) return 'PROYECCIÓN';
    if (width >= 32) return 'PROY.';
    return null;
};
