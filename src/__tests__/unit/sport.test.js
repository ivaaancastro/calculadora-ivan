import { describe, it, expect } from 'vitest';
import { sportOf, sportLabel, SPORT_LABELS } from '../../utils/sport';

describe('utils/sport', () => {
    it.each([
        ['Run', 'run'], ['TrailRun', 'run'], ['Carrera', 'run'], ['Correr', 'run'],
        ['Ride', 'bike'], ['VirtualRide', 'bike'], ['EBikeRide', 'bike'], ['Ciclismo', 'bike'], ['Bici', 'bike'],
        ['Swim', 'swim'], ['Natación', 'swim'], ['Nadar', 'swim'],
        ['Walk', 'walk'], ['Hike', 'walk'], ['Caminata', 'walk'], ['Senderismo', 'walk'], ['Andar', 'walk'],
        ['WeightTraining', 'strength'], ['Gym', 'strength'], ['Fuerza', 'strength'], ['Crossfit', 'strength'],
        ['Yoga', 'other'], ['Kayaking', 'other'], ['', 'other'], [null, 'other'], [undefined, 'other'],
    ])('sportOf(%s) → %s', (type, sport) => expect(sportOf(type)).toBe(sport));

    it('cada deporte tiene nombre en español', () => {
        expect(Object.keys(SPORT_LABELS).sort()).toEqual(['bike', 'other', 'run', 'strength', 'swim', 'walk']);
        expect(sportLabel('Ride')).toBe('Ciclismo');
        expect(sportLabel('Run')).toBe('Carrera');
    });
});
