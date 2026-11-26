import React from 'react';
import { Card, SectionHeader } from '../../ui';

/**
 * Receta única de las secciones de Ajustes (Capa 6, RF-D8): General, Zonas, Cuentas y Seguridad
 * usan el mismo grupo (título fuera de la tarjeta, una tarjeta con filetes), la misma fila
 * (≥ 56 px, icono neutro, título y pista a la izquierda, control a la derecha) y el mismo bloque
 * libre. Lo destructivo va en un grupo `tone="danger"`, separado del resto por un filete.
 */

/** Grupo: título (eyebrow) con su control a la derecha si lo tiene (RF-D3) y una tarjeta. */
export const SettingsGroup = ({ title, description, action, tone = 'default', className = '', children, ...rest }) => (
    <section
        data-profile="group"
        data-tone={tone}
        className={`${tone === 'danger' ? 'pt-8 border-t border-line-faint' : ''} ${className}`}
        {...rest}
    >
        {(title || action) && (
            <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2 mb-2">
                <div className="min-w-0">
                    {title && (
                        <SectionHeader as="h2" className="mb-0">
                            {tone === 'danger' ? <span className="text-danger-ink">{title}</span> : title}
                        </SectionHeader>
                    )}
                    {description && <p className="mt-1 px-0.5 text-[12px] leading-4 text-ink-4">{description}</p>}
                </div>
                {action}
            </div>
        )}
        <Card variant={tone === 'danger' ? 'danger' : 'grouped'} divided className="overflow-hidden">
            {children}
        </Card>
    </section>
);

/**
 * Fila: icono, título y pista; el control (`children`) a la derecha. `stack` apila el control
 * debajo en móvil (campos de texto anchos). `tone="danger"` tiñe icono y título.
 */
export const SettingsRow = ({ icon: Icon, title, hint, tone, stack = false, children, className = '', ...rest }) => (
    <div
        data-profile="row"
        className={`min-h-14 px-4 sm:px-5 py-3 flex justify-between gap-3 sm:gap-4 ${stack ? 'flex-col items-stretch sm:flex-row sm:items-center' : 'items-center'} ${className}`}
        {...rest}
    >
        <div className="flex items-center gap-3 min-w-0">
            {Icon && (
                <span
                    aria-hidden="true"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tone === 'danger' ? 'bg-danger/10 text-danger-ink' : 'bg-sunken text-ink-3'}`}
                >
                    <Icon size={16} strokeWidth={2.2} />
                </span>
            )}
            <div className="min-w-0">
                <p className={`text-[14px] leading-5 font-medium ${tone === 'danger' ? 'text-danger-ink' : 'text-ink'}`}>{title}</p>
                {hint && <p className="mt-0.5 text-[12px] leading-4 text-ink-4">{hint}</p>}
            </div>
        </div>
        {children != null && (
            <div className={`shrink-0 flex items-center gap-2 ${stack ? 'max-sm:[&>button]:flex-1' : ''}`}>{children}</div>
        )}
    </div>
);

/** Bloque libre dentro de un grupo (rejillas, avisos), con el mismo relleno que las filas. */
export const SettingsBlock = ({ className = '', children, ...rest }) => (
    <div data-profile="block" className={`px-4 sm:px-5 py-4 ${className}`} {...rest}>
        {children}
    </div>
);

/** Botones de las filas: secundario neutro y destructivo en contorno (≥ 44 px). */
export const ROW_BUTTON =
    'min-h-[44px] px-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-line text-[13px] font-semibold text-ink-2-soft hover:bg-surface-2 disabled:opacity-50 active:scale-press transition-paint duration-fast ease-forma';
export const DANGER_BUTTON =
    'min-h-[44px] px-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-danger/45 text-[13px] font-semibold text-danger-ink enabled:hover:bg-danger/10 disabled:opacity-50 active:scale-press transition-paint duration-fast ease-forma';

/** Campo de texto de una fila (Intervals.icu, contraseña). */
export const ROW_INPUT =
    'w-full sm:w-56 min-h-[44px] px-3 rounded-xl bg-sunken border border-line text-[13px] font-mono text-ink placeholder:text-ink-4 outline-none focus-visible:ring-2 focus-visible:ring-action-bright transition-paint';
