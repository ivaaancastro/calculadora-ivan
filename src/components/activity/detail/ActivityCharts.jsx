import React, { memo, useCallback, useMemo, useState } from 'react';
import { formatPace, formatNumber } from '../../../utils/formatters';
import { Card, EmptyState } from '../../ui';
import { useChartTheme } from '../../charts/useChartTheme';
import { ZoomRange } from '../../charts/ZoomRange';
import { sliceByRange } from '../../charts/sliceRange';
import { summarizeSeries } from '../../charts/chartA11y';
import { computePeaks } from './detailUtils';
import { useCursorStore } from './cursorStore';
import { SyncedAreaTrack } from './SyncedAreaTrack';
import { TelemetryPanel } from './TelemetryPanel';

// Dominios fijos fuera del render: referencias estables para la memoización de las pistas.
const DOMAIN = ['dataMin', 'dataMax'];
const DOMAIN_HR = ['dataMin - 5', 'dataMax + 5'];
const DOMAIN_ALT = ['dataMin - 10', 'dataMax + 10'];

const fmtPace = (p) => (p.pace != null ? `${formatPace(p.pace)} /km` : null);
const fmtSpeed = (p) => (p.speed != null ? `${formatNumber(p.speed, 1)} km/h` : null);
const fmtHr = (p) => (p.hr != null ? `${p.hr} bpm` : null);
const fmtWatts = (p) => (p.watts != null ? `${p.watts} W` : null);
const fmtAlt = (p) => {
    if (p.alt == null) return null;
    const g = p.grade;
    return g === undefined ? `${p.alt} m` : `${p.alt} m · ${g > 0 ? '+' : ''}${formatNumber(g, 1)} %`;
};
const fmtCadRun = (p) => (p.cadence != null ? `${p.cadence} ppm` : null);
const fmtCadBike = (p) => (p.cadence != null ? `${p.cadence} rpm` : null);

/**
 * Gráficas del análisis (RF-C5): una tarjeta con la telemetría y el zoom en la cabecera y una
 * `SyncedAreaTrack` por serie. El cursor va al almacén compartido (rAF), no al estado de la página.
 */
export const ActivityCharts = memo(function ActivityCharts({ chartData: fullData, isPaceBased, blocks }) {
    const ct = useChartTheme();
    const store = useCursorStore();
    const [range, setRange] = useState([0, 100]);
    const chartData = useMemo(() => sliceByRange(fullData, range), [fullData, range]);
    const peaks = useMemo(() => computePeaks(fullData), [fullData]);

    const onMove = useCallback((state) => {
        const i = state?.activeTooltipIndex;
        const point = i != null ? chartData[i] : state?.activePayload?.[0]?.payload;
        if (point) store.set(point);
    }, [chartData, store]);

    const has = useMemo(() => ({
        hr: chartData.some((d) => d.hr > 0),
        watts: chartData.some((d) => d.watts > 0),
        alt: chartData.some((d) => d.alt !== null),
        cadence: chartData.some((d) => d.cadence > 0),
    }), [chartData]);

    // Alternativa textual de cada pista (A11Y-5).
    const tracks = useMemo(() => {
        const speedKey = isPaceBased ? 'pace' : 'speed';
        const speedLabel = isPaceBased ? 'Ritmo' : 'Velocidad';
        const list = [
            blocks?.charts?.speed !== false && { dataKey: speedKey, label: speedLabel, color: ct.series.pace, domain: DOMAIN, reversed: isPaceBased, format: isPaceBased ? fmtPace : fmtSpeed, unit: isPaceBased ? 'min/km' : 'km/h' },
            has.hr && { dataKey: 'hr', label: 'Frecuencia cardiaca', color: ct.series.hr, domain: DOMAIN_HR, format: fmtHr, unit: 'bpm' },
            has.watts && { dataKey: 'watts', label: 'Potencia', color: ct.series.power, domain: DOMAIN, format: fmtWatts, unit: 'W' },
            has.alt && { dataKey: 'alt', label: 'Altitud', color: ct.series.altitude, domain: DOMAIN_ALT, format: fmtAlt, unit: 'm' },
            has.cadence && { dataKey: 'cadence', label: 'Cadencia', color: ct.series.cadence, domain: DOMAIN_HR, format: isPaceBased ? fmtCadRun : fmtCadBike },
        ].filter(Boolean);
        return list.map((t) => ({ ...t, summary: summarizeSeries(chartData, [{ key: t.dataKey, label: t.label }], t.unit ? { unit: t.unit } : undefined) }));
    }, [chartData, has, isPaceBased, blocks, ct]);

    const missing = [
        blocks?.charts?.power && !has.watts ? 'potencia' : null,
        !has.hr ? 'frecuencia cardiaca' : null,
    ].filter(Boolean);

    if (chartData.length === 0) return <EmptyState className="h-64" title="Sin datos de análisis" />;

    return (
        <Card data-detail="charts" variant="detail" className="overflow-hidden">
            <TelemetryPanel peaks={peaks} isPaceBased={isPaceBased} />
            {fullData.length > 20 && <ZoomRange range={range} onChange={setRange} />}
            <div className="divide-y divide-hairline pb-2">
                {tracks.map((t) => (
                    <SyncedAreaTrack
                        key={t.dataKey}
                        data={chartData}
                        dataKey={t.dataKey}
                        label={t.label}
                        summary={t.summary}
                        color={t.color}
                        dotRing={ct.anatomy.dotRing}
                        grid={ct.anatomy.gridSoft}
                        domain={t.domain}
                        reversed={t.reversed}
                        onMove={onMove}
                        format={t.format}
                    />
                ))}
            </div>
            {missing.length > 0 && (
                <p data-detail="missing" className="px-4 md:px-6 py-3 border-t border-hairline text-[12px] text-ink-4">
                    Sin {missing.join(' ni ')} en este registro: el dispositivo no grabó esa serie.
                </p>
            )}
        </Card>
    );
});
