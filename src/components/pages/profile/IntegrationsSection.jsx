import React from 'react';
import { Link2, Cloud, Loader2 } from 'lucide-react';
import { Card, SectionHeader } from '../../ui';

export const IntegrationsSection = ({ formData, isSyncingIntervals, intervalsSyncProgress, handleSyncIntervals, syncPreview, setSyncPreview, handleApplySyncedProfile, handleChange }) => (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-250">
        <SectionHeader>SERVICIOS CONECTADOS</SectionHeader>

        <Card divided className="overflow-hidden">
            <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[10px] bg-section-integrations text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Link2 size={17} strokeWidth={2.3} />
                    </div>
                    <div>
                        <h3 className="text-xs sm:text-sm font-bold text-ink">Intervals.icu</h3>
                        <p className="text-[10px] text-ink-4">Métricas de Garmin, Oura y Whoop</p>
                    </div>
                </div>
                <span data-profile="status" className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    formData.intervalsId && formData.intervalsKey 
                        ? 'bg-positive/10 text-positive-ink border border-positive/20' 
                        : 'bg-surface-2 text-slate-400'
                }`}>
                    {formData.intervalsId && formData.intervalsKey ? 'Conectado' : 'No configurado'}
                </span>
            </div>

            <div className="p-3.5 sm:p-4 space-y-3">
                <div data-profile="field-row" className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-body-soft shrink-0">Athlete ID</span>
                    <input 
                        type="text" 
                        name="intervalsId" 
                        value={formData.intervalsId || ''} 
                        onChange={handleChange} 
                        placeholder="i12345" 
                        data-profile="field-input" className="w-40 text-right bg-sunken-11 border border-line-3 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-section-integrations" 
                    />
                </div>
                <div data-profile="field-row" className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-body-soft shrink-0">API Key</span>
                    <input 
                        type="password" 
                        name="intervalsKey" 
                        value={formData.intervalsKey || ''} 
                        onChange={handleChange} 
                        placeholder="••••••••" 
                        data-profile="field-input" className="w-40 text-right bg-sunken-11 border border-line-3 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-section-integrations" 
                    />
                </div>

                <button
                    onClick={handleSyncIntervals}
                    disabled={isSyncingIntervals || !formData.intervalsId || !formData.intervalsKey}
                    className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex justify-center items-center gap-2 transition-all shadow-xs active:scale-95"
                >
                    {isSyncingIntervals
                        ? <><Loader2 size={14} className="animate-spin" /> {intervalsSyncProgress || 'Sincronizando...'}</>
                        : <><Cloud size={14} strokeWidth={2.3} /> Sincronizar Ahora</>}
                </button>
            </div>

            {syncPreview && (
                <div className="p-3.5 sm:p-4 bg-indigo-50/50 dark:bg-indigo-900/10">
                    <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-2">Nuevos datos disponibles:</p>
                    <div className="space-y-1.5 mb-3 text-xs">
                        {syncPreview.weight != null && (
                            <div className="flex justify-between">
                                <span className="text-slate-500">Peso</span>
                                <span className="font-mono font-bold text-indigo-600">{formData.weight} → {syncPreview.weight} kg</span>
                            </div>
                        )}
                        {syncPreview.fc_reposo != null && (
                            <div className="flex justify-between">
                                <span className="text-slate-500">FC Reposo</span>
                                <span className="font-mono font-bold text-indigo-600">{formData.fcReposo} → {syncPreview.fc_reposo} bpm</span>
                            </div>
                        )}
                        {syncPreview.ftp != null && (
                            <div className="flex justify-between">
                                <span className="text-slate-500">FTP</span>
                                <span className="font-mono font-bold text-indigo-600">{formData.bike?.ftp} → {syncPreview.ftp} W</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleApplySyncedProfile} className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors">Aplicar</button>
                        <button onClick={() => setSyncPreview(null)} className="flex-1 py-1.5 bg-white dark:bg-zinc-800 border border-line-2 text-body rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors">Ignorar</button>
                    </div>
                </div>
            )}
        </Card>
    </div>
);
