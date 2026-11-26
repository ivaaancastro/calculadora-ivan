import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { useChartTheme } from '../charts/useChartTheme';
import { useChartMotion } from '../charts/useChartMotion';
import { chartTooltipStyle, Delta, Stat } from '../ui';
import { StatsCard } from './StatsCard';
import { chartFigureProps, summarizeCategories } from '../charts/chartA11y';
import { axisProps } from '../charts/axisProps.js';

export const EstimatedFtpCard = ({
    ftp,
    ftpDiff,
    configFTP,
    curveChartData
}) => {
    const ct = useChartTheme();
    const motion = useChartMotion();
    const enter = motion.active ? motion.props : {};
    return (
        <StatsCard
            id="ftp"
            title="FTP estimado"
            info="Umbral funcional de potencia proyectado (eFTP) a partir de tus mejores esfuerzos."
            badge={<span className="text-[11px] font-semibold text-ink-3 bg-fill-3 px-2 py-0.5 rounded-full">Modelo</span>}
        >
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 md:gap-10 items-center">
                    <div className="flex flex-col gap-4">
                        <Stat
                            label="eFTP"
                            size="lg"
                            value={ftp.eFTP}
                            unit="W"
                            delta={Number.isFinite(ftpDiff) && <Delta value={ftpDiff} unit=" W" size="sm" label={`frente a tu FTP configurado (${configFTP} W)`} />}
                            sub={Number.isFinite(ftpDiff) ? `Configurado: ${configFTP} W` : undefined}
                        />
                        {ftp.wPerKg && <Stat label="Relación" size="sm" mono value={ftp.wPerKg} unit="W/kg" />}
                    </div>
                    <div className="h-[220px] w-full" {...chartFigureProps('Curva de potencia para el eFTP', summarizeCategories(curveChartData, 'name', 'actual', 'W'))}>
                        {curveChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={curveChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="ftpGradFinal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={ct.series.power} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={ct.series.power} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={ct.anatomy.grid2} opacity={0.3} vertical={false} />
                                    <XAxis dataKey="name" {...axisProps(ct, { fill: ct.anatomy.tick, fontWeight: 700 })} />
                                    <YAxis hide />
                                    <RechartsTooltip contentStyle={chartTooltipStyle(ct)} isAnimationActive={false} />
                                    <Area type="monotone" dataKey="actual" stroke={ct.series.power} strokeWidth={3} fill="url(#ftpGradFinal)" dot={{ r: 4, fill: ct.series.power, strokeWidth: 2, stroke: ct.anatomy.dotRing }} connectNulls isAnimationActive={false} {...enter} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="h-full flex items-center justify-center text-sm text-ink-4">Aún no hay mejores esfuerzos para dibujar la curva.</p>
                        )}
                    </div>
                </div>
        </StatsCard>
    );
};
