import React from 'react';
import { Activity, Heart, Weight, User, Camera, Loader2 } from 'lucide-react';
import { Card, Input, SectionHeader } from '../../ui';

export const GeneralSection = ({ formData, isUploadingAvatar, handleAvatarUpload, handleChange, targetCtl, setTargetCtl }) => (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-250">
        {/* AVATAR PROFILE BANNER — HORIZONTAL APPLE SETTINGS STYLE */}
        <Card data-profile="banner" className="p-4 sm:p-5 flex items-center gap-4 text-left mb-5 max-sm:p-3 max-sm:gap-3 max-sm:mb-4">
            <div className="relative shrink-0">
                <div 
                    data-profile="avatar"
                    className="rounded-full overflow-hidden bg-surface-2 border-0 shadow-[0_0_0_1px_rgb(var(--line)),0_0_0_4px_rgb(var(--surface))] flex items-center justify-center relative shrink-0"
                    style={{ width: '80px', height: '80px', minWidth: '80px', minHeight: '80px' }}
                >
                    {formData.avatarUrl ? (
                        <img 
                            src={formData.avatarUrl} 
                            alt="Avatar" 
                            className="w-full h-full object-cover rounded-full block pointer-events-none" 
                            style={{ width: '100%', height: '100%' }}
                        />
                    ) : (
                        <User size={34} className="text-slate-400" />
                    )}
                    {isUploadingAvatar && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                            <Loader2 size={18} className="text-white animate-spin" />
                        </div>
                    )}
                </div>
                <label className="absolute -bottom-1 -right-1 p-2 bg-action-ios-solid text-white rounded-full shadow-md cursor-pointer hover:bg-action-solid active:scale-press transition-transform">
                    <Camera size={13} strokeWidth={2.5} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                </label>
            </div>
            <div className="min-w-0 flex-1">
                <h3 data-profile="name" className="text-[22px] font-semibold tracking-[-0.02em] text-ink leading-tight sm:leading-7 truncate">
                    {formData.fullName || 'Atleta Forma'}
                </h3>
                <p className="text-xs text-ink-3 mt-0.5 truncate">{formData.email}</p>
                <span data-profile="badge" className="inline-flex items-center gap-1 mt-2 text-2xs font-semibold text-action bg-sunken px-2.5 py-0.5 rounded-full border border-line">
                    Atleta Forma
                </span>
            </div>
        </Card>

        {/* DATOS PERSONALES */}
        <div>
            <SectionHeader>Datos Personales</SectionHeader>
            <Card divided className="overflow-hidden mb-5">
                <div data-profile="row" className="min-h-[44px] p-3 sm:p-3.5 flex items-center justify-between gap-3">
                    <span className="text-xs sm:leading-5 font-medium text-body-soft">Nombre</span>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName || ''}
                        onChange={handleChange}
                        placeholder="Tu nombre"
                        className="flex-1 text-right bg-transparent text-xs sm:leading-5 font-semibold text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                    />
                </div>
                <div data-profile="row" className="min-h-[44px] p-3 sm:p-3.5 flex items-center justify-between gap-3">
                    <span className="text-xs sm:leading-5 font-medium text-body-soft">Correo</span>
                    <span className="text-xs sm:leading-5 font-medium text-ink-4 truncate max-w-[220px]">{formData.email}</span>
                </div>
            </Card>
        </div>

        {/* AJUSTES FISIOLÓGICOS */}
        <div>
            <SectionHeader>Fisiología y Métricas</SectionHeader>
            <Card data-profile="primary" divided className="overflow-hidden">
                {/* Peso */}
                <div data-profile="row" className="min-h-[3.5rem] p-3 sm:p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-[8px] bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Weight size={15} strokeWidth={2.3} />
                        </div>
                        <div>
                            <p className="text-xs sm:leading-5 font-semibold text-ink">Peso Corporal</p>
                            <p className="text-2xs text-ink-4">Para cálculos de W/kg</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Input
                            type="number"
                            inputMode="decimal"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            variant="inline" mono ringTone="action-bright" className="w-16 text-right px-2 py-1"
                        />
                        <span className="text-xs font-semibold text-ink-4">kg</span>
                    </div>
                </div>

                {/* FC Reposo */}
                <div data-profile="row" className="min-h-[3.5rem] p-3 sm:p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-[8px] bg-hr text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Heart size={15} strokeWidth={2.3} />
                        </div>
                        <div>
                            <p className="text-xs sm:leading-5 font-semibold text-ink">FC Reposo</p>
                            <p className="text-2xs text-ink-4">Pulsaciones basales mínimas</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Input
                            type="number"
                            inputMode="numeric"
                            name="fcReposo"
                            value={formData.fcReposo}
                            onChange={handleChange}
                            variant="inline" mono ringTone="hr" className="w-16 text-right px-2 py-1"
                        />
                        <span className="text-xs font-semibold text-ink-4">bpm</span>
                    </div>
                </div>

                {/* Calibrar CTL */}
                <div data-profile="row" className="min-h-[3.5rem] p-3 sm:p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-[8px] bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Activity size={15} strokeWidth={2.3} />
                        </div>
                        <div>
                            <p className="text-xs sm:leading-5 font-semibold text-ink">Calibrar Fitness (CTL)</p>
                            <p className="text-2xs text-ink-4">Ajuste de base histórica</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Input
                            type="number"
                            inputMode="numeric"
                            step="1"
                            value={targetCtl ?? ''}
                            onChange={(e) => setTargetCtl(e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="Auto"
                            variant="inline" mono ringTone="positive" className="w-16 text-right px-2 py-1"
                        />
                        <span className="text-xs font-semibold text-ink-4">CTL</span>
                    </div>
                </div>
            </Card>
        </div>
    </div>
);
