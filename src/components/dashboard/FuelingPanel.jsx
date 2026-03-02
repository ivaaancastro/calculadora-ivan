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
    // We use a heuristic: 1 TSS ≈ 1 kJ per minute at high IF
    // Better: kJ ≈ TSS × duration_h × 3.6 (rough calibration)
    const estimatedKj = Math.round((tss || 50) * durationHours * 3.5);
    const estimatedKcal = estimatedKj; // 1 kJ mechanical ≈ 1 kcal total at ~25% efficiency

    // Zone distribution
    const zoneMinutes = blocks.length > 0 ? getZoneMinutes(blocks) : { Z2: duration };
    const totalMinutes = Object.values(zoneMinutes).reduce((a, b) => a + b, 0) || duration;

    // Weighted carb rate across zones
    let weightedCarbRate = 0;
    let weightedHydroRate = 0;
    let dominantZone = 'Z2';
    let maxZoneMin = 0;

    Object.entries(zoneMinutes).forEach(([zone, min]) => {
        const fraction = min / totalMinutes;
        weightedCarbRate += fraction * (ZONE_CARB_RATE[zone] || 40);
        weightedHydroRate += fraction * (ZONE_HYDRATION_RATE[zone] || 500);
        if (min > maxZoneMin) { maxZoneMin = min; dominantZone = zone; }
    });

    // Total during-workout carbs (only if > 45min)
    const duringCarbsNeed = durationHours > 0.75 ? Math.round(weightedCarbRate * durationHours) : 0;
    // Pre-workout carbs (2-4g/kg, use 40-80g range based on intensity)
    const preCarbs = estimatedIF > 0.85 ? 60 : estimatedIF > 0.70 ? 45 : 30;
    // Post-workout carbs: glycogen resynthesis 0.8-1.2g/kg in 2h window (use ~60g flat)
    const postCarbs = estimatedIF > 0.80 ? 80 : 50;
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
        preCarbs,
        duringCarbs: duringCarbsNeed,
        postCarbs,
        duringHydration,
        postHydration,
        sodiumMg,
        durationHours,
        needsDuringFueling: durationHours > 0.75,
        weightedCarbRate: Math.round(weightedCarbRate),
    };
};

// ============================================================
// FUELING PANEL COMPONENT
// ============================================================

const WHY_PRE = ({ fuel }) => (
    <div className="text-[11px] text-slate-500 dark:text-zinc-400 space-y-1.5 leading-relaxed">
        <p>Tus músculos almacenan glucógeno (azúcar) como combustible principal para el ejercicio. Antes de entrenar, necesitas asegurarte de que esos depósitos están llenos.</p>
        <p>Para una sesión a {fuel.dominantZone} ({ZONE_DESC[fuel.dominantZone]}), el cuerpo va a necesitar
            <strong className="text-slate-700 dark:text-zinc-200"> más glucosa de la habitual</strong>. Los {fuel.preCarbs}g recomendados te dan energía disponible sin crear malestar digestivo.</p>
        <p className="italic text-slate-400 dark:text-zinc-500">Referencia: Burke et al. (2011), IOC Consensus on Nutrition for Athletes.</p>
    </div>
);

const WHY_DURING = ({ fuel }) => (
    <div className="text-[11px] text-slate-500 dark:text-zinc-400 space-y-1.5 leading-relaxed">
        <p>A partir de los 45-60 minutos, tus reservas de glucógeno empiezan a agotarse. Ingerir carbohidratos durante el ejercicio retrasa la fatiga y mantiene el rendimiento.</p>
        <p>La zona {fuel.dominantZone} consume aproximadamente <strong className="text-slate-700 dark:text-zinc-200">{fuel.weightedCarbRate}g de carbos por hora</strong>. El intestino puede absorber hasta 60g/hr de glucosa sola, o hasta 90g/hr si combinas glucosa + fructosa (transportadores duales, Jeukendrup 2014).</p>
        {fuel.weightedCarbRate > 60 &&
            <p><strong className="text-slate-700 dark:text-zinc-200">Tip:</strong> Para absorber {fuel.weightedCarbRate}g/hr sin malestar, usa productos con mezcla glucosa:fructosa 2:1 (geles, bebidas isotónicas de doble transportador).</p>
        }
    </div>
);

const WHY_POST = ({ fuel }) => (
    <div className="text-[11px] text-slate-500 dark:text-zinc-400 space-y-1.5 leading-relaxed">
        <p>Tras el ejercicio se abre una <strong className="text-slate-700 dark:text-zinc-200">ventana de recuperación de 30-60 minutos</strong> en la que el músculo resintetiza glucógeno hasta 2-3 veces más rápido que en reposo.</p>
        <p>La combinación recomendada es <strong className="text-slate-700 dark:text-zinc-200">1-1.2g carbos/kg + 20-25g proteína</strong> en esa ventana. Aquí se estiman {fuel.postCarbs}g de carbos y se recomienda añadir una fuente de proteína (batido, yogur, huevo).</p>
    </div>
);

const WHY_HYDRA = ({ fuel }) => (
    <div className="text-[11px] text-slate-500 dark:text-zinc-400 space-y-1.5 leading-relaxed">
        <p>La deshidratación de solo el 2% del peso corporal puede reducir el rendimiento aeróbico hasta un 10% (Cheuvront & Kenefick, 2014).</p>
        <p>Se estiman {fuel.duringHydration}ml durante el entreno basado en una tasa de sudoración media de {Math.round(fuel.duringHydration / fuel.durationHours)}ml/hr para la intensidad de esta sesión.</p>
        {fuel.sodiumMg > 0 &&
            <p><strong className="text-slate-700 dark:text-zinc-200">Electrolitos:</strong> Añadir {fuel.sodiumMg}mg de sodio al fluido repone las pérdidas de sal por sudoración y mejora la retención hídrica.</p>
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
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={11} /> Planificación de Fueling
                </h4>
                {!hasBlocks && (
                    <span className="text-[9px] text-amber-500 font-bold uppercase">Estimación sin estructura</span>
                )}
            </div>

            {/* Energy cost */}
            <div className="bg-slate-50 dark:bg-zinc-900 rounded-lg px-3 py-2.5 border border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Gasto estimado</p>
                    <p className="text-lg font-black font-mono text-slate-800 dark:text-zinc-100">{fuel.estimatedKj} kcal</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">IF estimado</p>
                    <p className="text-lg font-black font-mono text-slate-800 dark:text-zinc-100">{fuel.estimatedIF}</p>
                </div>
            </div>

            {/* Carb rows */}
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 flex items-center gap-1"><Zap size={10} />Carbohidratos</p>
                <div className="space-y-1.5">
                    <Row label="Pre-entreno (1-2h antes)" value={`${fuel.preCarbs}g`} sub="Pasta, arroz, avena, plátano" why={WHY_PRE} fuel={fuel} />
                    {fuel.needsDuringFueling
                        ? <Row label="Durante (si >45min)" value={`${fuel.duringCarbs}g total · ${fuel.weightedCarbRate}g/hr`} sub="Geles, bebida isotónica, dátiles" why={WHY_DURING} fuel={fuel} />
                        : <div className="px-3 py-2.5 rounded-lg border border-slate-100 dark:border-zinc-800 text-[11px] text-slate-400 dark:text-zinc-500 italic">Sesión corta (&lt;45min) — no necesitas carbos durante</div>
                    }
                    <Row label="Post-entreno (ventana 30min)" value={`${fuel.postCarbs}g + proteína`} sub="Batido, yogur + fruta, arroz con pollo" why={WHY_POST} fuel={fuel} />
                </div>
            </div>

            {/* Hydration rows */}
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 flex items-center gap-1"><Droplets size={10} />Hidratación</p>
                <div className="space-y-1.5">
                    <Row label="Durante el entreno" value={`${fuel.duringHydration}ml`} sub={`+ ${fuel.sodiumMg}mg sodio${fuel.needsElectrolytes ? ' (electrolitos recomendados)' : ''}`} why={WHY_HYDRA} fuel={fuel} />
                    <div className="px-3 py-2.5 rounded-lg border border-slate-100 dark:border-zinc-800 flex justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Post-entreno</p>
                            <p className="text-sm font-black font-mono text-slate-800 dark:text-zinc-100">{fuel.postHydration}ml+</p>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 max-w-[140px] text-right leading-tight self-center">Recupera 1.5ml por ml de sudor perdido. Orina amarillo pálido = bien hidratado.</p>
                    </div>
                </div>
            </div>

            <p className="text-[9px] text-slate-300 dark:text-zinc-600 text-right">Estimaciones sin peso corporal. Ajusta por calor, altitud y sudoración individual.</p>
        </div>
    );
};
