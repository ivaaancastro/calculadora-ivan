import React from 'react';
import { Heart, HeartPulse, Timer, Zap } from 'lucide-react';
import { LTHR_ZONE_PCT } from '../../../utils/tssEngine';
import { Input, Segmented } from '../../ui';
import { calcPaceZones, FCMAX_PCT, POWER_ZONES, ZONE_COLORS, HR_LABELS } from './zonesCalc';
import { SettingsGroup, SettingsRow } from './SettingsSection';

/** Nombre de cada zona de FC (las tablas de porcentajes no lo traen: antes salía vacío). */
const HR_ZONE_NAMES = ['Recuperación', 'Aeróbico', 'Tempo', 'Subumbral', 'Superumbral', 'Capacidad aeróbica', 'Anaeróbico'];

const MODES = [{ value: 'lthr', label: '% LTHR' }, { value: 'fcmax', label: '% FCmáx' }, { value: 'custom', label: 'Manual' }];

/** Umbral editable de una fila: cifra mono a la derecha con su unidad. */
const ThresholdInput = ({ label, unit, ...props }) => (
    <>
        <Input variant="inline" mono ringTone="action-bright" aria-label={label} className="w-20 min-h-11 text-right px-2 py-1" {...props} />
        <span className="w-8 text-[12px] font-medium text-ink-4">{unit}</span>
    </>
);

/** Fila de zona: barra de color, nombre y rango; el porcentaje como contexto en escritorio. */
const ZoneRow = ({ index, name, label, pct, children }) => (
    <div data-profile="zone-row" className="min-h-14 px-4 sm:px-5 py-2 flex items-center justify-between gap-3 tabular-nums">
        <div className="flex items-center gap-3 min-w-0">
            <span data-profile="zone-dot" aria-hidden="true" className="w-1 h-7 rounded-[2px] shrink-0" style={{ backgroundColor: ZONE_COLORS[index] }} />
            <span className="w-7 text-[14px] font-semibold text-ink shrink-0">{name}</span>
            <span className="text-[13px] text-ink-3 truncate">{label}</span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
            {pct && <span className="hidden sm:inline font-mono text-[12px] text-ink-4">{pct}</span>}
            {children}
        </div>
    </div>
);

const Range = ({ children, unit }) => (
    <span className="font-mono text-[13px] font-semibold text-ink-2-soft">
        {children}{unit && <span className="ml-1 font-sans text-[12px] font-normal text-ink-4">{unit}</span>}
    </span>
);

// Zonas de un deporte con la receta de sección de Ajustes (RF-D8).
export const SportZonesSection = ({ sport, sportLabel, icon: Icon, showPace, showPower, data, onChange, onZoneChange, onZonesMode }) => {
    const isReadOnly = data.zonesMode !== 'custom';

    return (
        <>
            <SettingsGroup title={sportLabel} description="Umbrales de referencia">
                <SettingsRow icon={HeartPulse} title="FC umbral" hint="LTHR">
                    <ThresholdInput label="FC umbral (ppm)" unit="ppm" type="number" inputMode="numeric" value={data.lthr} onChange={(e) => onChange(e, sport, 'lthr')} />
                </SettingsRow>
                <SettingsRow icon={Heart} title="FC máxima">
                    <ThresholdInput label="FC máxima (ppm)" unit="ppm" type="number" inputMode="numeric" value={data.max} onChange={(e) => onChange(e, sport, 'max')} />
                </SettingsRow>
                {showPace && (
                    <SettingsRow icon={Icon} title="Ritmo umbral">
                        <ThresholdInput label="Ritmo umbral (min/km)" unit="/km" type="text" placeholder="4:30" value={data.thresholdPace} onChange={(e) => onChange(e, sport, 'thresholdPace')} />
                    </SettingsRow>
                )}
                {showPower && (
                    <SettingsRow icon={Zap} title="FTP" hint="Potencia umbral funcional">
                        <ThresholdInput label="FTP (W)" unit="W" type="number" inputMode="numeric" value={data.ftp} onChange={(e) => onChange(e, sport, 'ftp')} />
                    </SettingsRow>
                )}
            </SettingsGroup>

            {/* El modo de cálculo cambia solo estas zonas: va en la cabecera de su grupo (RF-D3). */}
            <SettingsGroup
                title="Zonas de frecuencia cardíaca"
                action={<Segmented variant="pill" aria-label="Cálculo de las zonas" optionClassName="min-h-8" options={MODES} value={data.zonesMode} onChange={(m) => onZonesMode(sport, m)} />}
            >
                {(data?.zones || []).map((zone, i) => {
                    const pcts = data.zonesMode === 'lthr' ? LTHR_ZONE_PCT[i] : data.zonesMode === 'fcmax' ? FCMAX_PCT[i] : null;
                    const pct = pcts ? `${Math.round(pcts.pMin * 100)}–${Math.round(pcts.pMax * 100)} %${i === 6 ? '+' : ''}` : null;
                    return (
                        <ZoneRow key={i} index={i} name={HR_LABELS[i]} label={HR_ZONE_NAMES[i]} pct={pct}>
                            {isReadOnly ? (
                                <Range unit="ppm">{zone.min}–{zone.max}</Range>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <Input variant="inline" size="sm" mono type="number" aria-label={`${HR_LABELS[i]} mínimo`} value={zone.min} onChange={(e) => onZoneChange(e, sport, i, 'min')} className="w-14 min-h-11 px-1 text-center" />
                                    <span className="text-ink-4">–</span>
                                    <Input variant="inline" size="sm" mono type="number" aria-label={`${HR_LABELS[i]} máximo`} value={zone.max} onChange={(e) => onZoneChange(e, sport, i, 'max')} className="w-14 min-h-11 px-1 text-center" />
                                </div>
                            )}
                        </ZoneRow>
                    );
                })}
            </SettingsGroup>

            {showPace && (
                <SettingsGroup title="Zonas de ritmo" action={<span className="inline-flex items-center gap-1 text-[12px] text-ink-4"><Timer size={13} aria-hidden="true" /> por km</span>}>
                    {(data?.paceZones || calcPaceZones(data?.thresholdPace) || []).map((zone, i) => (
                        <ZoneRow key={i} index={i} name={HR_LABELS[i]} label={zone.label} pct={`${(zone.pctMin * 100).toFixed(0)}–${(zone.pctMax * 100).toFixed(0)} %`}>
                            <Range unit="/km">{zone.min}–{zone.max}</Range>
                        </ZoneRow>
                    ))}
                </SettingsGroup>
            )}

            {showPower && data.ftp > 0 && (
                <SettingsGroup title={`Zonas de potencia (${data.ftp} W)`}>
                    {POWER_ZONES.map((pz, i) => (
                        <ZoneRow key={i} index={i} name={`Z${i + 1}`} label={pz.label} pct={`${Math.round(pz.pMin * 100)}–${Math.round(pz.pMax * 100)} %`}>
                            <Range unit="W">{Math.round(data.ftp * pz.pMin)}–{i === 6 ? `${Math.round(data.ftp * pz.pMax)}+` : Math.round(data.ftp * pz.pMax)}</Range>
                        </ZoneRow>
                    ))}
                </SettingsGroup>
            )}
        </>
    );
};
