/**
 * tssEngine.js — Single source of truth for all TSS / HRSS calculations.
 *
 * Uses the Banister TRIMP model, identical to intervals.icu's HRSS:
 *   TRIMP = Σ(dt_min × d × y × e^(b×d))
 *   d = (HR − HRrest) / (HRmax − HRrest)   (Heart Rate Reserve fraction)
 *   Male:   y = 0.64,  b = 1.92
 *   Female: y = 0.86,  b = 1.67
 *   HRSS = (TRIMP / TRIMP_1h@LTHR) × 100
 */

// ── Zone percentages (Joe Friel 7-zone, % of LTHR) ──────────────────────────
export const LTHR_ZONE_PCT = [
    { pMin: 0, pMax: 0.81 },  // Z1 Recovery
    { pMin: 0.81, pMax: 0.89 },  // Z2 Aerobic
    { pMin: 0.90, pMax: 0.93 },  // Z3 Tempo
    { pMin: 0.94, pMax: 0.99 },  // Z4 SubThreshold
    { pMin: 1.00, pMax: 1.02 },  // Z5 SuperThreshold
    { pMin: 1.03, pMax: 1.06 },  // Z6 Aerobic Capacity
    { pMin: 1.06, pMax: 1.15 },  // Z7 Anaerobic
];

// ── Per-sport contribution to PMC ────────────────────────────────────────────
// fitness: % contribution to CTL    fatigue: % contribution to ATL
// countsForWeekly: whether to include in the weekly TSS summary (intervals.icu style)
export const SPORT_LOAD_CONFIG = {
    cardio: { fitness: 1.0, fatigue: 1.0, countsForWeekly: true },
    strength: { fitness: 0.0, fatigue: 1.0, countsForWeekly: false },
    yoga: { fitness: 0.0, fatigue: 0.2, countsForWeekly: false },
    walk: { fitness: 0.0, fatigue: 0.3, countsForWeekly: false },
    swim: { fitness: 1.0, fatigue: 1.0, countsForWeekly: true },
    other: { fitness: 0.5, fatigue: 0.5, countsForWeekly: false },
};

// ── Sport classification ─────────────────────────────────────────────────────
export function getSportCategory(typeStr) {
    const t = String(typeStr).toLowerCase();
    if (t.includes('weighttraining') || t.includes('fuerza') || t.includes('crossfit') || t.includes('workout')) return 'strength';
    if (t.includes('yoga') || t.includes('stretch')) return 'yoga';
    if (t.includes('walk') || t.includes('hike') || t.includes('caminata') || t.includes('senderismo')) return 'walk';
    if (t.includes('swim') || t.includes('natación') || t.includes('natacion')) return 'swim';
    if (t.includes('run') || t.includes('ride') || t.includes('ciclismo') || t.includes('bici') || t.includes('correr') || t.includes('carrera')) return 'cardio';
    return 'other';
}

// ── Zone generation from LTHR ────────────────────────────────────────────────
export function calcZonesFromLTHR(lthr, maxHr) {
    return LTHR_ZONE_PCT.map((z, i) => ({
        min: i === 0 ? 0 : Math.round(lthr * z.pMin),
        max: i === 6 ? (maxHr || Math.round(lthr * z.pMax)) : Math.round(lthr * z.pMax),
    }));
}

// ── Banister gender constants ────────────────────────────────────────────────
function genderConstants(gender) {
    const isMale = gender !== 'female';
    return { kY: isMale ? 0.64 : 0.86, kB: isMale ? 1.92 : 1.67 };
}

// ── Resolve sport-specific settings ──────────────────────────────────────────
function resolveSportSettings(sportType, settings) {
    const t = String(sportType).toLowerCase();
    const isBike = t.includes('ride') || t.includes('bici') || t.includes('ciclismo');
    const isSwim = t.includes('swim') || t.includes('natacion');
    return isBike ? settings.bike : isSwim ? (settings.swim || settings.run) : settings.run;
}

// ── TRIMP normalization (1h @ LTHR) ──────────────────────────────────────────
function trimpNorm1h(lthr, hrMax, hrRest, kY, kB) {
    const hrRange = hrMax - hrRest;
    if (hrRange <= 0) return 1;
    const d = (lthr - hrRest) / hrRange;
    return 60 * d * kY * Math.exp(kB * d);
}

// ── 1. Calculate TSS for a REAL activity (from HR stream or avg HR) ──────────
export function calculateActivityTSS(act, settings) {
    const { kY, kB } = genderConstants(settings.gender);
    const hrRest = Number(settings.fcReposo) || 50;
    const sportSettings = resolveSportSettings(act.type, settings);
    const hrMax = Number(sportSettings?.max) || 200;
    const lthr = Number(sportSettings?.lthr) || 170;
    const hrRange = hrMax - hrRest;
    const durMin = act.duration || 0;

    if (hrRange <= 0 || durMin <= 0) return 0;

    const norm = trimpNorm1h(lthr, hrMax, hrRest, kY, kB);

    // ① Stream HR data → exact second-by-second TRIMP
    if (act.streams_data?.heartrate?.data && act.streams_data?.time?.data) {
        const hrData = act.streams_data.heartrate.data;
        const timeData = act.streams_data.time.data;
        let trimp = 0;
        for (let i = 1; i < hrData.length; i++) {
            const dt = (timeData[i] - timeData[i - 1]) / 60;
            const d = Math.max(0, (hrData[i] - hrRest) / hrRange);
            trimp += dt * d * kY * Math.exp(kB * d);
        }
        return Math.round((trimp / norm) * 100);
    }

    // ② Average HR only → TRIMP at constant HR
    const hrAvg = Number(act.hr_avg);
    if (hrAvg && hrAvg > hrRest) {
        const d = (hrAvg - hrRest) / hrRange;
        const trimp = durMin * d * kY * Math.exp(kB * d);
        return Math.round((trimp / norm) * 100);
    }

    // ③ No HR data → rough duration estimate
    const cat = getSportCategory(act.type);
    if (cat === 'strength') return Math.round((durMin / 60) * 40);
    return Math.round((durMin / 60) * 25);
}

// ── 2. Compute TSS/hour for each zone (for planning estimation) ──────────────
export function computeZoneTssPerHour(sportType, settings) {
    const { kY, kB } = genderConstants(settings.gender);
    const hrRest = Number(settings.fcReposo) || 50;
    const sportSettings = resolveSportSettings(sportType, settings);
    const lthr = Number(sportSettings?.lthr) || 170;
    const hrMax = Number(sportSettings?.max) || 200;
    const hrRange = hrMax - hrRest;

    const fallback = { Z1: 20, Z2: 40, Z3: 60, Z4: 80, Z5: 100, Z6: 120, Z7: 140, R12: 30, R23: 50 };
    if (hrRange <= 0) return fallback;

    const dLthr = (lthr - hrRest) / hrRange;
    const trimpPerMinAtLthr = dLthr * kY * Math.exp(kB * dLthr);

    const zones = sportSettings?.zones;
    const tph = {};
    const minExerciseHR = lthr * 0.65; // Floor: nobody exercises below ~65% LTHR

    if (zones && zones.length > 0) {
        zones.forEach((z, i) => {
            // For Z1 (starts at 0), clamp min to a realistic exercise HR
            const effectiveMin = Math.max(z.min, minExerciseHR);
            const typicalHR = effectiveMin + (z.max - effectiveMin) * 0.6;
            const d = Math.max(0, (typicalHR - hrRest) / hrRange);
            const trimpPerMin = d * kY * Math.exp(kB * d);
            tph[`Z${i + 1}`] = Math.round((trimpPerMin / trimpPerMinAtLthr) * 100);
        });
    }

    // Fallback if zones are missing
    for (let i = 1; i <= 7; i++) {
        if (!tph[`Z${i}`]) tph[`Z${i}`] = fallback[`Z${i}`];
    }
    tph.R12 = Math.round((tph.Z1 + tph.Z2) / 2);
    tph.R23 = Math.round((tph.Z2 + tph.Z3) / 2);
    return tph;
}

// ── 3. Estimate TSS from planned workout blocks ──────────────────────────────
export function estimateTssFromBlocks(blocks, sportType, settings) {
    if (!blocks || blocks.length === 0) return null;
    const tph = computeZoneTssPerHour(sportType, settings);

    let totalTSS = 0;
    blocks.forEach(block => {
        if (block.type === 'repeat') {
            const reps = block.repeats || 1;
            (block.steps || []).forEach(step => {
                const mins = Number(step.duration) || 0;
                totalTSS += (mins * reps / 60) * (tph[step.zone] ?? tph.Z2);
            });
        } else {
            const mins = Number(block.duration) || 0;
            totalTSS += (mins / 60) * (tph[block.zone] ?? tph.Z2);
        }
    });
    return Math.round(totalTSS);
}

// ── 4. Effective TSS (with sport-specific fatigue weighting) ─────────────────
export function getEffectiveTSS(act) {
    const tss = act.tss || 0;
    const cat = act.sportCategory || getSportCategory(act.type || '');
    const cfg = SPORT_LOAD_CONFIG[cat] || SPORT_LOAD_CONFIG.other;
    return Math.round(tss * cfg.fatigue);
}

// ── 5. Recalculate TSS from stored plan description ──────────────────────────
export function recalcTssFromBlocks(plan, settings) {
    try {
        const desc = typeof plan.description === 'string' ? JSON.parse(plan.description) : plan.description;
        const blocks = desc?.blocks;
        if (!blocks || blocks.length === 0) return plan.tss || 0;
        return estimateTssFromBlocks(blocks, plan.type || 'Run', settings);
    } catch {
        return plan.tss || 0;
    }
}
