// Datos del planificador del Calendario (extraído de CalendarPage.jsx, PR 8a).

// --- WORKOUT TEMPLATES BY SPORT ---
export const WORKOUT_TEMPLATES = {
    Run: [
        {
            name: 'Rodaje fácil', cat: 'BASE', tss: 40, duration: 45, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: '', unit: 'time' },
                { id: 2, type: 'main', duration: 8, zone: 'Z2', details: 'Ritmo cómodo conversacional', unit: 'dist' },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Series 4x1km', cat: 'INT', tss: 70, duration: 50, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z2', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 4, steps: [
                        { id: 1, type: 'active', duration: 1, zone: 'Z4', unit: 'dist' },
                        { id: 2, type: 'recovery', duration: 2, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Tempo 30\'', cat: 'UMBRAL', tss: 65, duration: 50, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z2', details: '', unit: 'time' },
                { id: 2, type: 'main', duration: 30, zone: 'Z3', details: 'Ritmo tempo sostenido', unit: 'time' },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Tirada larga', cat: 'FONDO', tss: 90, duration: 90, blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z1', details: '', unit: 'time' },
                { id: 2, type: 'main', duration: 15, zone: 'Z2', details: 'Ritmo constante aeróbico', unit: 'dist' },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Fartlek 6x500m', cat: 'MIXTO', tss: 55, duration: 40, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z2', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 6, steps: [
                        { id: 1, type: 'active', duration: 0.5, zone: 'Z4', unit: 'dist' },
                        { id: 2, type: 'recovery', duration: 0.5, zone: 'Z2', unit: 'dist' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 6, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
    ],
    Ride: [
        {
            name: 'Base aeróbica', cat: 'BASE', tss: 70, duration: 90, blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z1', details: '', unit: 'time' },
                { id: 2, type: 'main', duration: 65, zone: 'Z2', details: 'Pedaleo suave constante', unit: 'time' },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Sweet Spot 2x20', cat: 'SST', tss: 85, duration: 75, blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z2', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 2, steps: [
                        { id: 1, type: 'active', duration: 20, zone: 'Z3', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 5, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Intervalos VO2', cat: 'VO2', tss: 80, duration: 60, blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z2', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 5, steps: [
                        { id: 1, type: 'active', duration: 3, zone: 'Z5', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 3, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 15, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Recuperación', cat: 'REC', tss: 25, duration: 45, blocks: [
                { id: 1, type: 'main', duration: 45, zone: 'Z1', details: 'Pedaleo muy suave regenerativo', unit: 'time' }
            ]
        },
    ],
    WeightTraining: [
        {
            name: 'Tren inferior', cat: 'PIERNA', tss: 50, duration: 55, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 4, steps: [
                        { id: 1, type: 'active', duration: 8, zone: 'Z3', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 2, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Tren superior', cat: 'TORSO', tss: 45, duration: 50, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 4, steps: [
                        { id: 1, type: 'active', duration: 7, zone: 'Z3', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 2, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Full body', cat: 'FULL', tss: 60, duration: 60, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 3, steps: [
                        { id: 1, type: 'active', duration: 12, zone: 'Z3', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 3, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Core + estabilidad', cat: 'CORE', tss: 25, duration: 30, blocks: [
                { id: 1, type: 'warmup', duration: 5, zone: 'Z1', details: '', unit: 'time' },
                { id: 2, type: 'main', duration: 20, zone: 'Z2', details: 'Plancha, bird-dog, pallof press', unit: 'time' },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
    ],
    Swim: [
        {
            name: 'Técnica + base', cat: 'BASE', tss: 45, duration: 45, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: '', unit: 'time' },
                { id: 2, type: 'main', duration: 30, zone: 'Z2', details: 'Drills + nado continuo', unit: 'time' },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
    ],
};
