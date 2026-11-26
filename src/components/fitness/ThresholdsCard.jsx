import React from 'react';
import { Gauge } from 'lucide-react';
import { EmptyState, Stat } from '../ui';
import { formatNumber } from '../../utils/formatters';
import { StatsCard } from './StatsCard';

/** Umbrales del perfil. Solo se muestran los configurados; sin ninguno, un EmptyState (RF-D6). */
export const ThresholdsCard = ({ settings, action }) => {
    const ftp = Number(settings?.bike?.ftp) || null;
    const weight = Number(settings?.weight) || null;
    const items = [
        ftp && { id: 'ftp', label: 'FTP bici', value: ftp, unit: 'W' },
        settings?.run?.thresholdPace && { id: 'tp', label: 'Ritmo umbral', value: settings.run.thresholdPace, unit: '/km' },
        ftp && weight && { id: 'wkg', label: 'Relación', value: formatNumber(ftp / weight, 2), unit: 'W/kg' },
        weight && { id: 'weight', label: 'Peso', value: formatNumber(weight, Number.isInteger(weight) ? 0 : 1), unit: 'kg' },
    ].filter(Boolean);

    return (
        <StatsCard id="thresholds" title="Umbrales actuales" info="Tus valores de referencia (FTP en bici, ritmo umbral en carrera) configurados en tu perfil.">
            {items.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-5">
                    {items.map((it) => (
                        <Stat key={it.id} label={it.label} value={it.value} unit={it.unit} size="sm" mono />
                    ))}
                </div>
            ) : (
                <EmptyState icon={Gauge} title="Sin umbrales configurados" description="Añade tu FTP, ritmo umbral y peso para calcular zonas y cargas." action={action} />
            )}
        </StatsCard>
    );
};
