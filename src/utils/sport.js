// Clasificación única de deporte (spec-capa6-v2-premium, RF-C6 / DUP-2).
// Las reglas viven en `getSportCategory` (tssEngine): aquí solo se traducen a las claves de la UI.
import { getSportCategory } from './tssEngine';

/** @typedef {'run'|'bike'|'swim'|'walk'|'strength'|'other'} Sport */

const BY_CATEGORY = { run: 'run', ride: 'bike', swim: 'swim', walk: 'walk', strength: 'strength' };

/** Deporte normalizado de un tipo de actividad (inglés de Strava o español de la app). @returns {Sport} */
export const sportOf = (type) => BY_CATEGORY[getSportCategory(type ?? '')] ?? 'other';

/** Nombre en español de cada deporte (COP-1). */
export const SPORT_LABELS = {
    run: 'Carrera',
    bike: 'Ciclismo',
    swim: 'Natación',
    walk: 'Caminata',
    strength: 'Fuerza',
    other: 'Otros',
};

/** Nombre en español del deporte de un tipo de actividad. */
export const sportLabel = (type) => SPORT_LABELS[sportOf(type)];
