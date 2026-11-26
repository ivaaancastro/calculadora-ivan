/**
 * Frases del «Coach Insights» del detalle de actividad (fix/detalle-coach-insights).
 * Función pura: devuelve las frases y el ajuste de puntuación. Sin React.
 *
 * Las frases de IF y de pico de 5 min son de potencia: solo se generan en los
 * deportes cuya matriz (`SPORT_BLOCKS`) muestra esas métricas (bici).
 */
import { formatNumber } from './formatters';
import { getBlocksForSport } from './activityMetricsBySport';

export function buildCoachInsights({ sport, ifFactor = 0, decouplingObj = null, primaryBenefit, powerCurve = [], npWatts = 0 }) {
    const blocks = getBlocksForSport(sport);
    const showIf = blocks.metrics.includes('if');
    const showPower = blocks.charts.power;
    const insights = [];
    let score = 0;

    if (showIf) {
        if (ifFactor >= 0.95) {
            insights.push(`Has trabajado a una intensidad altísima (${formatNumber(ifFactor, 2)}), prácticamente a nivel de competición. Este estímulo es excelente para mejorar tu techo de rendimiento, pero requiere una recuperación profunda.`);
            score += 20;
        } else if (ifFactor >= 0.85) {
            insights.push(`Sesión de intensidad sólida (${formatNumber(ifFactor, 2)}). Has pasado gran parte del tiempo en zonas exigentes, lo que fortalecerá tu resistencia específica.`);
            score += 15;
        } else if (ifFactor > 0.70) {
            insights.push(`Intensidad moderada (${formatNumber(ifFactor, 2)}), ritmo de tempo. Has mantenido un esfuerzo constante y sostenible que construye resistencia sin exigir una recuperación larga.`);
            score += 10;
        } else if (ifFactor > 0) {
            insights.push(`Buen control de la intensidad (${formatNumber(ifFactor, 2)}). Te has mantenido en niveles de base o recuperación, permitiendo sumar volumen sin quemarte.`);
            score += 10;
        }
    }

    if (decouplingObj) {
        const drift = Number.isFinite(decouplingObj.drift) ? decouplingObj.drift : parseFloat(String(decouplingObj.value).replace(',', '.'));
        if (drift > 10) {
            insights.push(`He detectado un desacople aeróbico alto (${formatNumber(drift, 1)} %). Tu pulso ha subido significativamente para mantener la misma potencia; esto sugiere fatiga acumulada, deshidratación o falta de adaptación al calor.`);
            score -= 15;
        } else if (drift > 5) {
            insights.push(`Desacople moderado (${formatNumber(drift, 1)} %). Hay algo de deriva cardiaca, normal en sesiones largas, pero indica que tu eficiencia aeróbica todavía tiene margen de mejora.`);
            score += 5;
        } else if (drift <= 5 && drift >= -5) {
            insights.push(`Eficiencia impecable. Tu pulso se ha mantenido estable respecto a la carga (${formatNumber(drift, 1)} %), lo que indica que tienes esta intensidad muy bien dominada.`);
            score += 25;
        }
    }

    if (primaryBenefit === 'Umbral') {
        insights.push('El trabajo de hoy se ha centrado en el Umbral, clave para elevar tu potencia sostenible en esfuerzos de larga duración.');
    } else if (primaryBenefit === 'VO2 Max') {
        insights.push("Has tocado el techo metabólico. Estas sesiones expanden tu capacidad de transporte de oxígeno y son las que más 'te hacen crecer'.");
    } else if (primaryBenefit === 'Capacidad Anaeróbica') {
        insights.push('Sesión explosiva. Has trabajado la resistencia al lactato y la potencia neuromuscular.');
    } else if (primaryBenefit === 'Base Aeróbica') {
        insights.push('Construcción de cimientos. Estás mejorando la capilarización y la eficiencia de las grasas como combustible.');
    } else if (primaryBenefit === 'Mantenimiento') {
        insights.push('Sesión de mantenimiento. Has conservado tu forma actual con poca carga: ideal para asimilar el trabajo previo y llegar fresco a la siguiente sesión.');
    }

    if (showPower && powerCurve?.length > 0) {
        const best5m = powerCurve.find((p) => p.label === '5m')?.value;
        if (best5m && best5m > npWatts * 1.1) {
            insights.push(`Destacable tu pico de 5 minutos (${best5m}w). Indica una buena capacidad de esfuerzo agudo por encima de tu media de hoy.`);
        }
    }

    return { insights, scoreDelta: score };
}
