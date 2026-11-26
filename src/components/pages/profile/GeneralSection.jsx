import React from 'react';
import { Activity, Heart, Weight, User, Camera, Loader2, Mail, IdCard } from 'lucide-react';
import { Input } from '../../ui';
import { SettingsGroup, SettingsRow, SettingsBlock } from './SettingsSection';

const Unit = ({ children }) => <span className="w-8 text-[12px] font-medium text-ink-4">{children}</span>;

export const GeneralSection = ({ formData, isUploadingAvatar, handleAvatarUpload, handleChange, targetCtl, setTargetCtl }) => (
    <div className="space-y-8">
        {/* Perfil: avatar, nombre y correo */}
        <SettingsGroup data-profile="banner">
            <SettingsBlock className="flex items-center gap-4">
                <div className="relative shrink-0">
                    <div
                        data-profile="avatar"
                        className="w-16 h-16 rounded-full overflow-hidden bg-surface-2 shadow-[0_0_0_1px_rgb(var(--line))] flex items-center justify-center"
                    >
                        {formData.avatarUrl ? (
                            <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover block pointer-events-none" />
                        ) : (
                            <User size={28} className="text-ink-4" />
                        )}
                        {isUploadingAvatar && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                                <Loader2 size={18} className="text-white animate-spin" />
                            </div>
                        )}
                    </div>
                    <label
                        className="absolute -bottom-1 -right-1 p-1.5 bg-action-ios-solid text-white rounded-full shadow-md cursor-pointer hover:bg-action-solid active:scale-press transition-transform"
                    >
                        <Camera size={12} strokeWidth={2.5} />
                        <input type="file" aria-label="Cambiar foto" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                    </label>
                </div>
                <div className="min-w-0 flex-1">
                    <h3 data-profile="name" className="text-[20px] font-semibold tracking-[-0.02em] text-ink leading-7 truncate">
                        {formData.fullName || 'Atleta Forma'}
                    </h3>
                    <p className="text-[13px] text-ink-3 truncate">{formData.email}</p>
                </div>
            </SettingsBlock>
        </SettingsGroup>

        <SettingsGroup title="Datos Personales">
            <SettingsRow icon={IdCard} title="Nombre">
                <input
                    type="text"
                    name="fullName"
                    value={formData.fullName || ''}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                    aria-label="Nombre"
                    className="w-40 sm:w-56 min-h-11 px-2 -mx-2 rounded-lg text-right bg-transparent text-[14px] font-medium text-ink outline-none focus-visible:ring-2 focus-visible:ring-action-bright placeholder:text-ink-4"
                />
            </SettingsRow>
            <SettingsRow icon={Mail} title="Correo">
                <span className="text-[14px] text-ink-3 truncate max-w-[180px] sm:max-w-[260px]">{formData.email}</span>
            </SettingsRow>
        </SettingsGroup>

        <SettingsGroup data-profile="primary" title="Fisiología y Métricas">
            <SettingsRow icon={Weight} title="Peso corporal" hint="Para los cálculos de W/kg">
                <Input
                    type="number"
                    inputMode="decimal"
                    name="weight"
                    aria-label="Peso corporal (kg)"
                    value={formData.weight}
                    onChange={handleChange}
                    variant="inline" mono ringTone="action-bright" className="w-16 min-h-11 text-right px-2 py-1"
                />
                <Unit>kg</Unit>
            </SettingsRow>
            <SettingsRow icon={Heart} title="FC en reposo" hint="Pulsaciones basales mínimas">
                <Input
                    type="number"
                    inputMode="numeric"
                    name="fcReposo"
                    aria-label="FC en reposo (bpm)"
                    value={formData.fcReposo}
                    onChange={handleChange}
                    variant="inline" mono ringTone="action-bright" className="w-16 min-h-11 text-right px-2 py-1"
                />
                <Unit>ppm</Unit>
            </SettingsRow>
            <SettingsRow icon={Activity} title="Calibrar Fitness (CTL)" hint="Ajusta la base histórica">
                <Input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    value={targetCtl ?? ''}
                    onChange={(e) => setTargetCtl(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Auto"
                    aria-label="Calibrar Fitness (CTL)"
                    variant="inline" mono ringTone="action-bright" className="w-16 min-h-11 text-right px-2 py-1"
                />
                <Unit>CTL</Unit>
            </SettingsRow>
        </SettingsGroup>
    </div>
);
