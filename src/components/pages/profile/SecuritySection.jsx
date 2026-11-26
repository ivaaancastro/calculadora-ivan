import React from 'react';
import { KeyRound, Database, UserX, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { SettingsGroup, SettingsRow, ROW_BUTTON, ROW_INPUT, DANGER_BUTTON } from './SettingsSection';

export const SecuritySection = ({ newPassword, setNewPassword, isUpdatingPwd, handleUpdatePassword, pureActs, stravaActs, syncPct, onDeepSync, isDeepSyncing, onClearDb, handleDeleteAccount, isDeletingAccount }) => (
    <div className="space-y-8">
        <SettingsGroup title="Seguridad">
            <SettingsRow icon={KeyRound} title="Contraseña de acceso" hint="Mínimo 6 caracteres" stack>
                <form onSubmit={handleUpdatePassword} className="flex w-full gap-2">
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nueva contraseña"
                        aria-label="Nueva contraseña"
                        autoComplete="new-password"
                        className={`${ROW_INPUT} flex-1 sm:w-48`}
                    />
                    <button type="submit" disabled={isUpdatingPwd || !newPassword} className={ROW_BUTTON}>
                        {isUpdatingPwd ? <Loader2 size={14} className="animate-spin" /> : 'Actualizar'}
                    </button>
                </form>
            </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="Gestión de datos">
            <SettingsRow
                icon={Database}
                stack
                title="Deep Sync (datos crudos)"
                hint={`${pureActs.length} de ${stravaActs.length} actividades descargadas${stravaActs.length > 0 ? ` (${syncPct} %)` : ''}`}
            >
                {syncPct === 100 ? (
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-positive-ink">
                        <CheckCircle2 size={15} aria-hidden="true" /> Sincronizada
                    </span>
                ) : (
                    <button type="button" onClick={onDeepSync} disabled={isDeepSyncing} className={ROW_BUTTON}>
                        {isDeepSyncing ? <><Loader2 size={14} className="animate-spin" /> Descargando…</> : 'Iniciar descarga'}
                    </button>
                )}
            </SettingsRow>
        </SettingsGroup>

        {/* Zona de peligro: lo irreversible, junto y separado del resto. */}
        <SettingsGroup
            data-profile="danger-zone"
            tone="danger"
            title="Zona de peligro"
            description="Estas acciones no se pueden deshacer."
        >
            <SettingsRow data-profile="danger-card" icon={Trash2} tone="danger" stack title="Borrar todas las actividades" hint="Se borran tus actividades, no tu cuenta">
                <button type="button" data-profile="danger-action" onClick={onClearDb} className={DANGER_BUTTON}>
                    Borrar Actividades
                </button>
            </SettingsRow>
            <SettingsRow data-profile="danger-card" icon={UserX} tone="danger" stack title="Eliminar cuenta" hint="Se eliminan tu cuenta y todos tus datos">
                <button type="button" data-profile="danger-action" onClick={handleDeleteAccount} disabled={isDeletingAccount} className={DANGER_BUTTON}>
                    {isDeletingAccount ? <Loader2 size={14} className="animate-spin" /> : 'Eliminar Cuenta'}
                </button>
            </SettingsRow>
        </SettingsGroup>
    </div>
);
