import React from 'react';
import { Key, Database, AlertTriangle, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, SectionHeader } from '../../ui';

export const SecuritySection = ({ newPassword, setNewPassword, isUpdatingPwd, handleUpdatePassword, pureActs, stravaActs, syncPct, onDeepSync, isDeepSyncing, onClearDb, handleDeleteAccount, isDeletingAccount }) => (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-250">
        {/* CONTRASEÑA */}
        <div>
            <SectionHeader>SEGURIDAD</SectionHeader>
            <Card data-profile="plain-card" className="p-3.5 sm:p-4 mb-5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-[8px] bg-slate-500/15 text-body flex items-center justify-center shrink-0">
                        <Key size={15} strokeWidth={2.3} />
                    </div>
                    <div>
                        <h3 className="text-xs sm:leading-5 font-bold text-ink">Contraseña de Acceso</h3>
                        <p className="text-2xs text-ink-4">Actualiza tu clave de acceso</p>
                    </div>
                </div>
                <form onSubmit={handleUpdatePassword} className="flex gap-2">
                    <input 
                        type="password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        placeholder="Nueva contraseña..." 
                        className="flex-1 px-3 py-2 bg-sunken-11 border border-line-3 rounded-xl text-xs font-mono dark:text-zinc-200 focus:ring-1 focus:ring-action-bright outline-none transition-paint" 
                    />
                    <button 
                        type="submit" 
                        disabled={isUpdatingPwd || !newPassword} 
                        className="px-4 py-2 bg-inverse text-ink-inverse rounded-xl text-xs font-semibold transition-paint disabled:opacity-50 shrink-0 shadow-xs active:scale-press"
                    >
                        {isUpdatingPwd ? <Loader2 size={13} className="animate-spin" /> : 'Actualizar'}
                    </button>
                </form>
            </Card>
        </div>

        {/* DEEP SYNC */}
        <div>
            <SectionHeader>GESTIÓN DE DATOS</SectionHeader>
            <Card data-profile="plain-card" className="p-3.5 sm:p-4 mb-5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-[8px] bg-blue-500/15 text-action flex items-center justify-center shrink-0">
                        <Database size={15} strokeWidth={2.3} />
                    </div>
                    <div>
                        <h3 className="text-xs sm:leading-5 font-bold text-ink">Deep Sync (Datos Crudos)</h3>
                        <p className="text-2xs text-ink-4">{pureActs.length} de {stravaActs.length} actividades descargadas</p>
                    </div>
                </div>

                <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden mb-3">
                    <div className={`h-full transition-paint duration-500 ${syncPct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${syncPct}%` }} />
                </div>

                <button 
                    onClick={onDeepSync} 
                    disabled={isDeepSyncing || syncPct === 100} 
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold flex justify-center items-center gap-2 transition-paint shadow-xs ${syncPct === 100 ? 'bg-emerald-50 dark:bg-emerald-900/15 text-emerald-600 border border-emerald-500/20' : 'bg-[#007AFF] text-white hover:bg-blue-600 active:scale-press'}`}
                >
                    {isDeepSyncing ? <><Loader2 size={14} className="animate-spin" /> Descargando...</> : syncPct === 100 ? <><CheckCircle2 size={14} /> Base de datos sincronizada</> : 'Iniciar Descarga Completa'}
                </button>
            </Card>
        </div>

        {/* DANGER ZONE */}
        <div data-profile="danger-zone" className="!mt-2 p-4 rounded-xl border border-danger/30 bg-danger/5">
            <SectionHeader>ZONA DE PELIGRO</SectionHeader>
            <Card data-profile="danger-card" variant="danger" className="p-3.5 sm:p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-[8px] bg-danger/15 text-danger-ink flex items-center justify-center shrink-0">
                        <AlertTriangle size={15} strokeWidth={2.3} />
                    </div>
                    <div>
                        <h3 className="text-xs sm:leading-5 font-bold text-danger-ink">Eliminar cuenta definitivamente</h3>
                        <p className="text-2xs text-ink-4">Se eliminarán todas tus actividades y métricas</p>
                    </div>
                </div>
                <button 
                    data-profile="danger-action"
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                    className="w-full min-h-[44px] py-2 bg-transparent enabled:hover:bg-danger/10 text-danger-ink shadow-[inset_0_0_0_1px_rgb(var(--danger)/0.55)] rounded-lg text-xs font-semibold transition-paint disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-press"
                >
                    {isDeletingAccount ? <Loader2 size={13} className="animate-spin" /> : <><Trash2 size={13} /> Eliminar Cuenta</>}
                </button>
            </Card>

            {/* Borrar actividades: vivía en la cabecera de escritorio (RF6). */}
            <Card data-profile="danger-card" variant="danger" className="p-3.5 sm:p-4 mt-5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-[8px] bg-danger/15 text-danger-ink flex items-center justify-center shrink-0">
                        <Trash2 size={15} strokeWidth={2.3} />
                    </div>
                    <div>
                        <h3 className="text-xs sm:leading-5 font-bold text-danger-ink">Borrar todas las actividades</h3>
                        <p className="text-2xs text-ink-4">Se borran tus actividades, no tu cuenta</p>
                    </div>
                </div>
                <button
                    data-profile="danger-action"
                    onClick={onClearDb}
                    className="w-full min-h-[44px] py-2 bg-transparent enabled:hover:bg-danger/10 border border-danger-edge-2 text-danger-ink shadow-[inset_0_0_0_1px_rgb(var(--danger)/0.55)] rounded-lg text-xs font-semibold transition-paint flex items-center justify-center gap-1.5 active:scale-press"
                >
                    <Trash2 size={13} /> Borrar Actividades
                </button>
            </Card>
        </div>
    </div>
);
