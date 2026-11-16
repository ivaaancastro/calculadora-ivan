import React from 'react';
import { Activity, Heart, Weight, User, Camera, Loader2 } from 'lucide-react';
import { Card, Input, SectionHeader } from '../../ui';

export const GeneralSection = ({ formData, isUploadingAvatar, handleAvatarUpload, handleChange, targetCtl, setTargetCtl, isV2, setUi }) => (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-250">
        {/* AVATAR PROFILE BANNER — HORIZONTAL APPLE SETTINGS STYLE */}
        <Card data-profile="banner" className="p-4 sm:p-5 flex items-center gap-4 text-left mb-5">
            <div className="relative shrink-0">
                <div 
                    className="rounded-full overflow-hidden bg-surface-2 border-2 border-white dark:border-zinc-700 shadow-sm flex items-center justify-center relative shrink-0"
                    style={{ width: '76px', height: '76px', minWidth: '76px', minHeight: '76px' }}
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
                <label className="absolute -bottom-1 -right-1 p-2 bg-action-ios-solid text-white rounded-full shadow-md cursor-pointer hover:bg-action-solid active:scale-90 transition-transform">
                    <Camera size={13} strokeWidth={2.5} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                </label>
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-ink leading-tight truncate">
                    {formData.fullName || 'Atleta Forma'}
                </h3>
                <p className="text-xs text-ink-3 mt-0.5 truncate">{formData.email}</p>
                <span data-profile="badge" className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/15">
                    Atleta Forma
                </span>
            </div>
        </Card>

        {/* DATOS PERSONALES */}
        <div>
            <SectionHeader>Datos Personales</SectionHeader>
            <Card divided className="overflow-hidden mb-5">
                <div data-profile="row" className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                    <span className="text-xs sm:text-sm font-medium text-body-soft">Nombre</span>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName || ''}
                        onChange={handleChange}
                        placeholder="Tu nombre"
                        className="flex-1 text-right bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                    />
                </div>
                <div data-profile="row" className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                    <span className="text-xs sm:text-sm font-medium text-body-soft">Correo</span>
                    <span className="text-xs sm:text-sm font-medium text-ink-4 truncate max-w-[220px]">{formData.email}</span>
                </div>
            </Card>
        </div>

        {/* AJUSTES FISIOLÓGICOS */}
        <div>
            <SectionHeader>Fisiología y Métricas</SectionHeader>
            <Card divided className="overflow-hidden">
                {/* Peso */}
                <div data-profile="row" className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-[8px] bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Weight size={15} strokeWidth={2.3} />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-semibold text-ink">Peso Corporal</p>
                            <p className="text-[10px] text-ink-4">Para cálculos de W/kg</p>
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
                <div data-profile="row" className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-[8px] bg-hr text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Heart size={15} strokeWidth={2.3} />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-semibold text-ink">FC Reposo</p>
                            <p className="text-[10px] text-ink-4">Pulsaciones basales mínimas</p>
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
                <div data-profile="row" className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-[8px] bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Activity size={15} strokeWidth={2.3} />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-semibold text-ink">Calibrar Fitness (CTL)</p>
                            <p className="text-[10px] text-ink-4">Ajuste de base histórica</p>
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

        {/* APARIENCIA — vista previa de la piel v2 (spec-rediseno-02-c3-skin) */}
        <div>
            <SectionHeader>Apariencia</SectionHeader>
            <Card divided className="overflow-hidden">
                <button
                    type="button"
                    role="switch"
                    aria-checked={isV2}
                    aria-label="Vista previa v2"
                    onClick={() => setUi(isV2 ? 'v1' : 'v2')}
                    className="w-full min-h-11 p-3 sm:p-3.5 flex items-center justify-between gap-3 text-left hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action-ios-solid"
                >
                    <span className="min-w-0">
                        <span className="block text-xs sm:text-sm font-semibold text-ink">Vista previa v2</span>
                        <span className="block text-[10px] text-ink-4">Piel nueva, todavía en pruebas. No cambia tus datos.</span>
                    </span>
                    <span
                        aria-hidden="true"
                        className={`relative shrink-0 w-[51px] h-[31px] rounded-full transition-colors ${isV2 ? 'bg-action-ios-solid' : 'bg-line-3'}`}
                    >
                        <span
                            className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full bg-control-knob shadow-sm transition-transform ${isV2 ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                    </span>
                </button>
            </Card>
        </div>
    </div>
);
