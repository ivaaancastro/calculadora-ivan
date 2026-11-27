import React from 'react';
import { SunMoon } from 'lucide-react';
import { Segmented } from '../../ui';
import { useTheme } from '../../../hooks/useTheme';
import { SettingsGroup, SettingsRow } from './SettingsSection';

const OPTIONS = [
    { value: 'system', label: 'Sistema' },
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' },
];

/** Tema de la app: se aplica al instante y es de este dispositivo (no pasa por «Guardar»). */
export const AppearanceGroup = () => {
    const { preference, setPreference } = useTheme();
    return (
        <SettingsGroup data-profile="appearance" title="Apariencia">
            <SettingsRow icon={SunMoon} title="Tema" hint="Solo en este dispositivo" stack>
                <div role="group" aria-label="Tema" className="w-full sm:w-64">
                    <Segmented variant="rail">
                        {OPTIONS.map((o) => (
                            <Segmented.Option key={o.value} type="button" active={preference === o.value} onClick={() => setPreference(o.value)}>
                                {o.label}
                            </Segmented.Option>
                        ))}
                    </Segmented>
                </div>
            </SettingsRow>
        </SettingsGroup>
    );
};
