import React, { useState } from 'react';
import { Droplets, Zap, Info, ChevronDown, ChevronUp } from 'lucide-react';

// ============================================================
// FUELING ENGINE — Sports Science-Based Recommendations
// ============================================================

// Zone intensity factors relative to FTP
const ZONE_IF = { Z1: 0.55, Z2: 0.68, Z3: 0.82, Z4: 0.92, Z5: 1.05, Z6: 1.2 };

// Carb oxidation rates by zone (g/hour) — based on substrate utilization research
// Burke et al., 2011 & Jeukendrup 2014 (dual-transporter carbs allow up to 90g/hr)
const ZONE_CARB_RATE = { Z1: 20, Z2: 30, Z3: 50, Z4: 65, Z5: 80, Z6: 90 };

// Zone descriptions for explanation
const ZONE_DESC = {
    Z1: 'recuperación (>90% grasa)',
    Z2: 'aeróbico easy (70-80% grasa)',
    Z3: 'sweet spot / tempo (50% grasa, 50% glucosa)',
    Z4: 'umbral (>80% glucosa)',
    Z5: 'VO2Max (>95% glucosa)',
    Z6: 'anaeróbico (100% glucosa)',
};

// Hydration rate by intensity (ml/hr) — varies with temperature, ~18-22°C assumed
const ZONE_HYDRATION_RATE = { Z1: 400, Z2: 500, Z3: 600, Z4: 750, Z5: 800, Z6: 900 };

// Parse block structure from a workout
const parseBlocks = (descriptionObj) => {
    if (!descriptionObj?.blocks) return [];
    return descriptionObj.blocks;
};

// Calculate effective workout minutes per zone
const getZoneMinutes = (blocks) => {
    const zoneMap = {};
    const process = (block, multiplier = 1) => {
        if (block.type === 'repeat') {
            const repeats = block.repeats || 1;
            (block.steps || []).forEach(step => process(step, repeats));
        } else {
            const zone = block.zone || 'Z2';
            const dur = (block.unit === 'dist')
                ? Math.round((block.duration || 0) * 12) // ~12 min/km rough conversion
                : (block.duration || 0);
            zoneMap[zone] = (zoneMap[zone] || 0) + dur * multiplier;
        }
    };
    blocks.forEach(b => process(b));
    return zoneMap;
};

// Main fueling calculation
export const calculateFueling = (workout) => {
    const { tss, duration, descriptionObj } = workout;
    const blocks = parseBlocks(descriptionObj);
    const durationHours = (duration || 60) / 60;

    // Estimate IF from TSS and duration
    // TSS = (duration_h × NP × IF) / FTP × 100 → IF² = TSS / (duration_h * 100)
    const estimatedIF = Math.min(1.0, Math.sqrt(Math.max(1, tss || 50) / (durationHours * 100)));

    // Estimate energy expenditure (kJ)
    // For cycling: kJ ≈ watts × seconds / 1000; watts ≈ IF × FTP
    const estimatedKj = Math.round((tss || 50) * durationHours * 3.5);
    const estimatedKcal = estimatedKj; // 1 kJ mechanical ≈ 1 kcal total at ~25% efficiency

    // Zone distribution
    const zoneMinutes = blocks.length > 0 ? getZoneMinutes(blocks) : { Z2: duration };
    const totalMinutes = Object.values(zoneMinutes).reduce((a, b) => a + b, 0) || duration;

    let dominantZone = 'Z2';
    let maxZoneMin = 0;
    let weightedHydroRate = 0;

    Object.entries(zoneMinutes).forEach(([zone, min]) => {
        const fraction = min / totalMinutes;
        weightedHydroRate += fraction * (ZONE_HYDRATION_RATE[zone] || 500);
        if (min > maxZoneMin) { maxZoneMin = min; dominantZone = zone; }
    });

    // NEW CARB RATE LOGIC BASED ON DURATION AND INTENSITY (Asker Jeukendrup guidelines)
    let recommendedCarbRate = 0;
    
    if (durationHours < 0.75) {
        // < 45 min
        recommendedCarbRate = 0;
    } else if (durationHours < 1.25) {
        // 45m - 1h15m
        recommendedCarbRate = estimatedIF > 0.80 ? 30 : 0; 
    } else if (durationHours < 2.5) {
        // 1h15m - 2h30m
        recommendedCarbRate = estimatedIF > 0.80 ? 60 : (estimatedIF > 0.70 ? 45 : 30);
    } else {
        // > 2h30m
        recommendedCarbRate = estimatedIF > 0.80 ? 90 : (estimatedIF > 0.70 ? 75 : 60);
    }

    const duringCarbsNeed = Math.round(recommendedCarbRate * durationHours);
    const isEasySession = durationHours <= 1.0 && estimatedIF < 0.75;

    // Pre-workout carbs
    let preCarbsVal = "";
    let preCarbsSub = "";
    if (isEasySession) {
        preCarbsVal = "Habitual";
        preCarbsSub = "Sin necesidades extra";
    } else {
        const preAmount = estimatedIF > 0.85 ? 60 : (estimatedIF > 0.70 ? 45 : 30);
        preCarbsVal = `${preAmount}g`;
        preCarbsSub = "Pasta, arroz, avena, plátano";
    }

    // Post-workout carbs
    let postCarbsVal = "";
    let postCarbsSub = "";
    if (isEasySession) {
        postCarbsVal = "Habitual";
        postCarbsSub = "Próxima comida principal";
    } else {
        const postAmount = estimatedIF > 0.80 || durationHours > 2.0 ? 80 : 50;
        postCarbsVal = `${postAmount}g + Prot`;
        postCarbsSub = "Batido recup., yogur, comida sólida";
    }

    // Total hydration
    const duringHydration = Math.round(weightedHydroRate * durationHours);
    const postHydration = Math.round(duringHydration * 0.5);

    // Electrolytes
    const needsElectrolytes = durationHours > 1;
    const sodiumMg = needsElectrolytes ? Math.round(700 * durationHours) : 0;

    return {
        estimatedKj,
        estimatedKcal,
        estimatedIF: estimatedIF.toFixed(2),
        zoneMinutes,
        dominantZone,
        preCarbsVal,
        preCarbsSub,
        duringCarbs: duringCarbsNeed,
        postCarbsVal,
        postCarbsSub,
        duringHydration,
        postHydration,
        sodiumMg,
        durationHours,
        needsDuringFueling: recommendedCarbRate > 0,
        recommendedCarbRate,
        isEasySession
    };
};

// ============================================================
// FUELING PANEL COMPONENT
// ============================================================

const WHY_PRE = ({ fuel }) => (
    <div className="text-[11px] text-slate-500 dark:text-zinc-400 space-y-1.5 leading-relaxed">
        {fuel.isEasySession ? (
            <p>Al ser una sesión suave y corta, tus reservas basales de glucógeno son suficientes. Haz tu ingesta habitual sin necesidad de añadir carbohidratos extra antes de entrenar.</p>
        ) : (
            <>
                <p>Tus músculos almacenan glucógeno como combustible principal. Antes de entrenar intenso, necesitas asegurar que esos depósitos están llenos.</p>
                <p>Para una sesión a {fuel.dominantZone} con un IF de {fuel.estimatedIF}, el cuerpo necesitará <strong className="text-slate-700 dark:text-zinc-200">más glucosa de la habitual</strong>. La ingesta de <strong>{fuel.preCarbsVal}</strong> recomendada (1-2h antes) te da energía sin crear pesadez.</p>
            </>
        )}
    </div>
);

const WHY_DURING = ({ fuel }) => (
    <div className="text-[11px] text-slate-500 dark:text-zinc-400 space-y-1.5 leading-relaxed">
        <p>Ingerir carbohidratos durante el ejercicio retrasa la fatiga y mantiene el rendimiento.</p>
        <p>Para esta combinación de duración ({Math.round(fuel.durationHours * 60)} min) e intensidad (IF {fuel.estimatedIF}), se estiman <strong className="text-slate-700 dark:text-zinc-200">{fuel.recommendedCarbRate}g de carbos por hora</strong>.</p>
        <p>El intestino puede absorber hasta 60g/hr de glucosa sola, o hasta 90g/hr combinando fuentes (Jeukendrup, 2014).</p>
        {fuel.recommendedCarbRate >= 60 && (
            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800/30">
                <strong className="font-bold">⚠️ Alerta Digestiva:</strong> Para tolerar {fuel.recommendedCarbRate}g/h, usa mezclas de Doble Transportador (Glucosa + Fructosa, ratio 2:1 o 1:0.8).
            </div>
        )}
    </div>
);

const WHY_POST = ({ fuel }) => (
    <div className="text-[11px] text-slate-500 dark:text-zinc-400 space-y-1.5 leading-relaxed">
        {fuel.isEasySession ? (
            <p>Sesión suave sin apenas depleción de glucógeno. No necesitas un protocolo especial de recuperación; simplemente come de forma equilibrada en tu próxima ingesta.</p>
        ) : (
            <>
                <p>Tras el ejercicio se abre una <strong className="text-slate-700 dark:text-zinc-200">ventana de 30-60 minutos</strong> donde el músculo resintetiza glucógeno hasta 2-3 veces más rápido.</p>
                <p>Se recomienda la ingesta de <strong>{fuel.postCarbsVal}</strong> para forzar la resíntesis de glucógeno y la reparación muscular temprana.</p>
            </>
        )}
    </div>
);

const WHY_HYDRA = ({ fuel }) => (
    <div className="text-[11px] text-slate-500 dark:text-zinc-400 space-y-1.5 leading-relaxed">
        <p>La deshidratación del 2% del peso puede reducir el rendimiento aeróbico hasta un 10%.</p>
        <p>Se estiman {fuel.duringHydration}ml en base a tu intensidad ({Math.round(fuel.duringHydration / fuel.durationHours)}ml/hr).</p>
        {fuel.sodiumMg > 0 &&
            <p><strong className="text-slate-700 dark:text-zinc-200">Electrolitos:</strong> Añadir {fuel.sodiumMg}mg de sodio repone pérdidas por sudoración y mejora la retención hídrica.</p>
        }
    </div>
);

const Row = ({ label, value, sub, why: WhyComp, fuel }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-slate-100 dark:border-zinc-800 rounded-lg overflow-hidden">
            <div className="flex items-start justify-between px-3 py-2.5">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{label}</p>
                    <p className="text-base font-black font-mono text-slate-800 dark:text-zinc-100 mt-0.5">{value}</p>
                    {sub && <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{sub}</p>}
                </div>
                <button onClick={() => setOpen(o => !o)} className="mt-1 p-1 rounded text-slate-300 dark:text-zinc-600 hover:text-slate-500 dark:hover:text-zinc-400 transition-colors">
                    {open ? <ChevronUp size={14} /> : <Info size={14} />}
                </button>
            </div>
            {open && (
                <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50">
                    <WhyComp fuel={fuel} />
                </div>
            )}
        </div>
    );
};

export const FuelingPanel = ({ workout }) => {
    const fuel = calculateFueling(workout);
    const hasBlocks = workout.descriptionObj?.blocks?.length > 0;

    return (
        <div className="space-y-6">
            {/* Header & Energy Cost Inline */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap size={14} /> Estrategia Nutricional
                    </h4>
                    {!hasBlocks && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                            Aprox. sin estructura
                        </span>
                    )}
                </div>

                <div className="flex gap-3">
                    <div className="bg-white dark:bg-zinc-900 rounded-md px-3 py-1.5 border border-slate-200 dark:border-zinc-800 flex items-center gap-2 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Gasto Est.</span>
                        <span className="text-sm font-black font-mono text-slate-800 dark:text-zinc-100">{fuel.estimatedKj} kcal</span>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-md px-3 py-1.5 border border-slate-200 dark:border-zinc-800 flex items-center gap-2 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">IF Est.</span>
                        <span className="text-sm font-black font-mono text-slate-800 dark:text-zinc-100">{fuel.estimatedIF}</span>
                    </div>
                </div>
            </div>

            {/* Grid for Carbs & Hydration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Carb rows */}
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-zinc-300 mb-3 flex items-center gap-1.5 border-b border-slate-200 dark:border-zinc-800 pb-2">
                        <Zap size={14} className="text-yellow-500" />
                        Carbohidratos
                    </p>
                    <div className="space-y-2">
                        <Row label="Pre-entreno (1-2h antes)" value={fuel.preCarbsVal} sub={fuel.preCarbsSub} why={WHY_PRE} fuel={fuel} />
                        {fuel.needsDuringFueling
                            ? <Row label="Durante (si >45min)" value={`${fuel.duringCarbs}g total`} sub={`${fuel.recommendedCarbRate}g/hr · Geles, isotónico`} why={WHY_DURING} fuel={fuel} />
                            : <div className="px-4 py-3 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400 bg-slate-50/50 dark:bg-zinc-900/50">Sesión corta o baja intensidad — no requiere ingesta durante.</div>
                        }
                        <Row label="Post-entreno (ventana 30m)" value={fuel.postCarbsVal} sub={fuel.postCarbsSub} why={WHY_POST} fuel={fuel} />
                    </div>
                </div>

                {/* Hydration rows */}
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-zinc-300 mb-3 flex items-center gap-1.5 border-b border-slate-200 dark:border-zinc-800 pb-2">
                        <Droplets size={14} className="text-blue-500" />
                        Hidratación
                    </p>
                    <div className="space-y-2">
                        <Row label="Durante el entreno" value={`${fuel.duringHydration}ml`} sub={`+ ${fuel.sodiumMg}mg sodio${fuel.needsElectrolytes ? ' (vital)' : ''}`} why={WHY_HYDRA} fuel={fuel} />
                        <div className="px-4 py-3 rounded-lg border border-slate-200 dark:border-zinc-800 flex justify-between bg-white dark:bg-zinc-900">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Post-entreno</p>
                                <p className="text-sm font-black font-mono text-slate-800 dark:text-zinc-100">{fuel.postHydration}ml+</p>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 max-w-[150px] text-right leading-relaxed self-center">Recupera 1.5ml por ml de sudor perdido. Orina clara = hidratado.</p>
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center italic pt-4">Estimaciones genéricas. Ajusta por nivel de sudoración, temperatura y peso corporal.</p>
        </div>
    );
};
