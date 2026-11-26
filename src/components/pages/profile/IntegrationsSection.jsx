import React from 'react';
import { Link2, Cloud, Loader2, Hash, KeyRound } from 'lucide-react';
import { SettingsGroup, SettingsRow, SettingsBlock, ROW_BUTTON, ROW_INPUT } from './SettingsSection';

export const IntegrationsSection = ({ formData, isSyncingIntervals, intervalsSyncProgress, handleSyncIntervals, syncPreview, setSyncPreview, handleApplySyncedProfile, handleChange }) => {
    const connected = !!(formData.intervalsId && formData.intervalsKey);
    return (
        <div className="space-y-8">
            <SettingsGroup title="Servicios conectados">
                <SettingsRow icon={Link2} title="Intervals.icu" hint="Métricas de Garmin, Oura y Whoop">
                    <span
                        data-profile="status"
                        className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${connected ? 'text-positive-ink' : 'text-ink-4'}`}
                    >
                        <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-positive' : 'bg-fill-7'}`} />
                        {connected ? 'Conectado' : 'No configurado'}
                    </span>
                </SettingsRow>
                <SettingsRow icon={Hash} title="Athlete ID" stack data-profile="field-row">
                    <input
                        type="text"
                        name="intervalsId"
                        value={formData.intervalsId || ''}
                        onChange={handleChange}
                        placeholder="i12345"
                        aria-label="Athlete ID de Intervals.icu"
                        data-profile="field-input"
                        className={`${ROW_INPUT} sm:text-right`}
                    />
                </SettingsRow>
                <SettingsRow icon={KeyRound} title="API Key" stack data-profile="field-row">
                    <input
                        type="password"
                        name="intervalsKey"
                        value={formData.intervalsKey || ''}
                        onChange={handleChange}
                        placeholder="••••••••"
                        aria-label="API Key de Intervals.icu"
                        autoComplete="off"
                        data-profile="field-input"
                        className={`${ROW_INPUT} sm:text-right`}
                    />
                </SettingsRow>
                <SettingsRow icon={Cloud} title="Sincronizar" hint="Trae peso, FC en reposo y FTP">
                    <button
                        type="button"
                        onClick={handleSyncIntervals}
                        disabled={isSyncingIntervals || !connected}
                        className={ROW_BUTTON}
                    >
                        {isSyncingIntervals
                            ? <><Loader2 size={14} className="animate-spin" /> {intervalsSyncProgress || 'Sincronizando…'}</>
                            : 'Sincronizar ahora'}
                    </button>
                </SettingsRow>

                {syncPreview && (
                    <SettingsBlock data-profile="sync-preview">
                        <p className="text-[13px] font-semibold text-ink mb-2">Nuevos datos disponibles</p>
                        <dl className="space-y-1.5 mb-3 text-[13px] tabular-nums">
                            {syncPreview.weight != null && (
                                <div className="flex justify-between">
                                    <dt className="text-ink-3">Peso</dt>
                                    <dd className="font-mono font-semibold text-ink">{formData.weight} → {syncPreview.weight} kg</dd>
                                </div>
                            )}
                            {syncPreview.fc_reposo != null && (
                                <div className="flex justify-between">
                                    <dt className="text-ink-3">FC en reposo</dt>
                                    <dd className="font-mono font-semibold text-ink">{formData.fcReposo} → {syncPreview.fc_reposo} ppm</dd>
                                </div>
                            )}
                            {syncPreview.ftp != null && (
                                <div className="flex justify-between">
                                    <dt className="text-ink-3">FTP</dt>
                                    <dd className="font-mono font-semibold text-ink">{formData.bike?.ftp} → {syncPreview.ftp} W</dd>
                                </div>
                            )}
                        </dl>
                        <div className="flex gap-2">
                            <button type="button" onClick={handleApplySyncedProfile} className="flex-1 min-h-[44px] rounded-xl bg-action-solid hover:bg-action-hover text-on-action text-[13px] font-semibold active:scale-press transition-paint">Aplicar</button>
                            <button type="button" onClick={() => setSyncPreview(null)} className={`${ROW_BUTTON} flex-1`}>Ignorar</button>
                        </div>
                    </SettingsBlock>
                )}
            </SettingsGroup>
        </div>
    );
};
