import React, { useEffect, useRef, useState } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { Activity } from 'lucide-react';
import { useChartTheme } from '../charts/useChartTheme';
import { EmptyState } from '../ui';
import { useChartMotion } from '../charts/useChartMotion';
import { ChartSkeleton } from '../charts/ChartSkeleton';
import { summarizeSeries, chartFigureProps } from '../charts/chartA11y';
import { pmcTodayKey, projectionLabelText } from '../../utils/pmcPoints';
import { toLocalDate } from '../../utils/dates';
import { axisProps, AXIS_FONT_SIZE } from '../charts/axisProps.js';

/**
 * Etiquetas de «HOY» y «PROYECCIÓN» (BUG-10): cada una a un lado de la línea de hoy, así no se
 * pisan nunca. «PROYECCIÓN» se abrevia o se oculta si la banda proyectada es estrecha (móvil, rango largo).
 */
const LABEL_STYLE = { fontSize: AXIS_FONT_SIZE, fontWeight: 600, letterSpacing: '0.05em' };

const TodayLabel = ({ viewBox, fill }) => (viewBox ? (
  <text x={viewBox.x - 4} y={viewBox.y + 12} textAnchor="end" fill={fill} {...LABEL_STYLE}>HOY</text>
) : null);

const ProjectionLabel = ({ viewBox, fill }) => {
  const text = viewBox ? projectionLabelText(viewBox.width) : null;
  if (!text) return null;
  return <text data-dash="projection-label" x={viewBox.x + 4} y={viewBox.y + 12} textAnchor="start" fill={fill} {...LABEL_STYLE}>{text}</text>;
};

/** Banda de «forma óptima» del TSB: zona de frescura para competir. */
const TSB_OPTIMAL = [5, 25];

const SERIES = [
  { key: 'ctl', label: 'Fitness', dot: 'bg-metric-ctl', ink: 'text-metric-ctl-ink' },
  { key: 'atl', label: 'Fatiga', dot: 'bg-metric-atl', ink: 'text-metric-atl-ink' },
  { key: 'tsb', label: 'Forma', dot: 'bg-metric-tsb', ink: 'text-metric-tsb-ink', signed: true },
];

const fmtPoint = (v, signed) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  const r = Math.round(v);
  return `${signed && r > 0 ? '+' : ''}${r}`;
};

/**
 * Leyenda que hace de readout (RF-D1): sin cursor solo nombra las series; al pasar el cursor o
 * tocar, muestra el día señalado y sus valores. Nunca los de hoy (ya están en el héroe y los KPI).
 */
const LegendReadout = ({ point, todayKey }) => {
  const days = point ? Math.round((toLocalDate(point.date) - toLocalDate(todayKey)) / 86400000) : 0;
  return (
    <div data-dash="legend" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 min-h-6 mb-3">
      <ul className="flex items-center gap-4">
        {SERIES.map((s) => {
          const v = point && fmtPoint(point[s.key], s.signed);
          return (
            <li key={s.key} className="flex items-center gap-1.5 text-xs text-ink-3">
              <span className={`w-2 h-2 rounded-full ${s.dot}`} aria-hidden="true" />
              {s.label}
              {v != null && <span className={`font-mono font-semibold ${s.ink}`}>{v}</span>}
            </li>
          );
        })}
      </ul>
      {point && (
        <p data-dash="readout" aria-live="polite" className="flex items-center gap-1.5 font-mono text-xs text-ink-2-soft capitalize">
          {toLocalDate(point.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
          {days > 0 && <span className="normal-case text-ink-4">· proyección +{days} d</span>}
        </p>
      )}
    </div>
  );
};

/** Gráfica de evolución (PMC). El rango y los totales del periodo viven en su tarjeta (RF-D3). */
export const EvolutionChart = ({ data, loading = false }) => {
  const ct = useChartTheme();
  const motion = useChartMotion();
  const [hoverPoint, setHoverPoint] = useState(null);
  const figure = useRef(null);
  // Recharts entrega el mousemove en el siguiente frame: tras salir, uno tardío no debe reabrir el
  // readout. `pointerleave` no siempre llega (Recharts repinta el nodo bajo el cursor), así que,
  // mientras hay readout, mover el ratón (o tocar) fuera de la gráfica lo cierra. En táctil, el
  // día tocado se queda a la vista hasta tocar en otro sitio.
  const inside = useRef(false);
  useEffect(() => {
    if (!hoverPoint) return undefined;
    const close = (e) => {
      if (figure.current?.contains(e.target)) return;
      if (e.type === 'pointermove' && e.pointerType === 'touch') return;
      inside.current = false;
      setHoverPoint(null);
    };
    document.addEventListener('pointermove', close);
    document.addEventListener('pointerdown', close);
    return () => {
      document.removeEventListener('pointermove', close);
      document.removeEventListener('pointerdown', close);
    };
  }, [hoverPoint]);

  if (loading) return <ChartSkeleton />;

  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-center">
        <EmptyState icon={Activity} title="Sin datos en este periodo" description="Elige un rango más amplio o registra una actividad." />
      </div>
    );
  }

  const todayStr = pmcTodayKey();
  const latestPoint = data[data.length - 1];
  const hasProjection = data.some((d) => d.date > todayStr);
  // Recharts 3 ya no da `activePayload`: el punto sale del índice activo.
  const track = (state) => {
    const i = Number(state?.activeTooltipIndex);
    if (inside.current && Number.isInteger(i) && data[i]) setHoverPoint(data[i]);
  };

  return (
    <div className="h-full w-full flex flex-col font-sans touch-manipulation select-none">
      <LegendReadout point={hoverPoint} todayKey={todayStr} />

      <div
        ref={figure}
        className="flex-1 w-full min-h-0"
        onPointerEnter={() => { inside.current = true; }}
        {...chartFigureProps(
          'Evolución de forma: fitness, fatiga y forma',
          summarizeSeries(data, [{ key: 'ctl', label: 'Fitness (CTL)' }, { key: 'atl', label: 'Fatiga (ATL)' }, { key: 'tsb', label: 'Forma (TSB)' }]),
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={data} 
            margin={{ top: 8, right: 6, left: -14, bottom: 0 }}
            onMouseMove={track}
            onTouchStart={track}
            onTouchMove={track}
          >
            <defs>
              <linearGradient id="colorCtl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ct.series.ctl} stopOpacity={0.18} />
                <stop offset="100%" stopColor={ct.series.ctl} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTcb" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ct.series.tsb} stopOpacity={0.15} />
                <stop offset="100%" stopColor={ct.series.tsb} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={ct.anatomy.grid} opacity={0.3} vertical={false} />

            <XAxis
              dataKey="date"
              {...axisProps(ct)}
              tickFormatter={(val) => new Date(val).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              minTickGap={40}
              padding={{ left: 10, right: 10 }}
              dy={10}
            />

            <YAxis yAxisId="left" {...axisProps(ct)} dx={-10} />
            <YAxis yAxisId="right" orientation="right" hide domain={['dataMin - 30', 'dataMax + 30']} />

            {/* Solo el cursor: los valores del punto van en la leyenda (sin tapar con el dedo). */}
            <Tooltip
              content={() => null}
              cursor={{ stroke: ct.anatomy.cursor, strokeWidth: 1, strokeDasharray: '4 4' }}
              isAnimationActive={false}
            />

            <ReferenceArea yAxisId="right" y1={TSB_OPTIMAL[0]} y2={TSB_OPTIMAL[1]} fill={ct.series.tsb} fillOpacity={0.07} stroke="none" ifOverflow="hidden" />
            {hasProjection && (
              <ReferenceArea
                yAxisId="left"
                x1={todayStr}
                x2={latestPoint.date}
                fill={ct.anatomy.cursor}
                fillOpacity={0.06}
                stroke="none"
                label={<ProjectionLabel fill={ct.anatomy.axis} />}
              />
            )}
            <ReferenceLine
              x={todayStr}
              yAxisId="left"
              stroke={ct.anatomy.cursor}
              strokeWidth={1}
              strokeDasharray="4 4"
              label={<TodayLabel fill={ct.anatomy.axis} />}
            />
            
            <Area 
                yAxisId="right" 
                type="monotone" 
                dataKey="tsb" 
                stroke={ct.series.tsb} 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorTcb)"
                activeDot={{ r: 4, stroke: ct.anatomy.dotRing, strokeWidth: 2, fill: ct.series.tsb }} 
                {...motion.props}
            />
            
            <Area 
                yAxisId="left" 
                type="monotone" 
                dataKey="ctl" 
                stroke={ct.series.ctl} 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorCtl)"
                activeDot={{ r: 5, stroke: ct.anatomy.dotRing, strokeWidth: 2, fill: ct.series.ctl }} 
                {...motion.props}
            />
            
            <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="atl" 
                stroke={ct.series.atl} 
                strokeWidth={2} 
                strokeDasharray="3 3"
                dot={false} 
                activeDot={{ r: 4, stroke: ct.anatomy.dotRing, strokeWidth: 1.5, fill: ct.series.atl }} 
                {...motion.props}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};