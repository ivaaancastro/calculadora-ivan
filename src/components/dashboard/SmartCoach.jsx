import React from 'react';
import { Lightbulb, AlertTriangle, TrendingUp, BedDouble, Zap } from 'lucide-react';

export const SmartCoach = ({ metrics }) => {
  const { ctl, atl, tsb, rampRate } = metrics || { ctl: 0, atl: 0, tsb: 0, rampRate: 0 };

  // --- LÓGICA DE CONSEJOS (EL CEREBRO) ---
  const getAdvice = () => {
    const advice = [];

    // 1. Análisis de Ramp Rate (Ritmo de subida)
    if (rampRate > 6) {
      advice.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Freno de mano',
        text: 'Estás aumentando la carga demasiado rápido (>6 pts/sem). Tienes alto riesgo de lesión o enfermedad. Reduce el volumen esta semana.'
      });
    } else if (rampRate < -5) {
      advice.push({
        type: 'info',
        icon: TrendingUp,
        title: 'Pérdida de Forma',
        text: 'Tu forma está cayendo rápidamente. Si no estás descansando para una carrera, intenta añadir un entreno suave hoy para frenar la caída.'
      });
    } else if (rampRate >= -2 && rampRate <= 5) {
      advice.push({
        type: 'good',
        icon: Zap,
        title: 'Ritmo Óptimo',
        text: 'Estás entrenando con una progresión perfecta. Tu cuerpo está asimilando la carga correctamente. ¡Sigue así!'
      });
    }

    // 2. Análisis de TSB (Frescura)
    if (tsb < -25) {
      advice.push({
        type: 'warning',
        icon: BedDouble,
        title: 'Fatiga Profunda',
        text: 'Tu balance (TSB) es muy negativo. Mañana deberías hacer descanso total o recuperación activa (Zona 1) obligatoriamente.'
      });
    } else if (tsb > 15 && rampRate < 0) {
      advice.push({
        type: 'info',
        icon: Lightbulb,
        title: 'Demasiado Fresco',
        text: 'Estás muy descansado. Si no compites este fin de semana, es hora de meter una sesión de alta intensidad (Intervalos) para despertar el cuerpo.'
      });
    }

    // 3. Análisis de Base (CTL)
    if (ctl < 40 && rampRate > 0) {
        advice.push({
            type: 'neutral',
            icon: TrendingUp,
            title: 'Construyendo Base',
            text: 'En esta etapa, la constancia es más importante que la intensidad. No te saltes entrenos, aunque sean cortos.'
        });
    }

    // Relleno por defecto si no salta ninguna alerta específica
    if (advice.length === 0) {
        advice.push({
            type: 'neutral',
            icon: Lightbulb,
            title: 'Mantenimiento',
            text: 'Tus métricas están estables. Es una buena semana para trabajar la técnica o probar rutas nuevas sin presión de números.'
        });
    }

    return advice.slice(0, 3); // Devolvemos máximo 3 consejos
  };

  const tips = getAdvice();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600">
            <Lightbulb size={20} />
        </div>
        <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase">Smart Coach</h3>
            <p className="text-[10px] text-slate-400 font-medium">Recomendaciones basadas en tus datos</p>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
        {tips.map((tip, i) => (
            <div key={i} className={`p-4 rounded-xl border-l-4 ${
                tip.type === 'warning' ? 'bg-red-50 border-red-500' : 
                tip.type === 'good' ? 'bg-emerald-50 border-emerald-500' :
                tip.type === 'info' ? 'bg-blue-50 border-blue-500' :
                'bg-slate-50 border-slate-300'
            }`}>
                <div className="flex items-center gap-2 mb-1">
                    <tip.icon size={16} className={`
                        ${tip.type === 'warning' ? 'text-red-600' : 
                          tip.type === 'good' ? 'text-emerald-600' : 
                          tip.type === 'info' ? 'text-blue-600' : 'text-slate-500'}
                    `} />
                    <h4 className={`text-xs font-bold uppercase ${
                         tip.type === 'warning' ? 'text-red-700' : 
                         tip.type === 'good' ? 'text-emerald-700' : 
                         tip.type === 'info' ? 'text-blue-700' : 'text-slate-700'}
                    `}>{tip.title}</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                    {tip.text}
                </p>
            </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 italic">
              "El descanso es parte del entrenamiento."
          </p>
      </div>
    </div>
  );
};