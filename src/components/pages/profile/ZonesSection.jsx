import React from 'react';
import { Footprints, Bike, ScanHeart, Loader2 } from 'lucide-react';
import { Segmented } from '../../ui';
import { SportZonesSection } from './SportZonesSection';
import { SettingsGroup, SettingsRow, ROW_BUTTON } from './SettingsSection';

export const ZonesSection = ({ formData, activeTab, setActiveTab, isScanning, pureActs, handleAutoDetectLTHR, handleChange, handleZoneChange, handleZonesMode }) => (
    <div className="space-y-8">
        <SettingsGroup title="Umbral">
            <SettingsRow icon={ScanHeart} title="Auto-Detectar LTHR" hint="Calcula tu umbral desde el historial">
                <button
                    type="button"
                    onClick={handleAutoDetectLTHR}
                    disabled={isScanning || pureActs.length === 0}
                    className={ROW_BUTTON}
                >
                    {isScanning ? <><Loader2 size={14} className="animate-spin" /> Analizando…</> : 'Escanear'}
                </button>
            </SettingsRow>
        </SettingsGroup>

        {/* El deporte cambia todos los grupos de abajo: va encima de ellos. */}
        <div className="space-y-8">
            <Segmented
                data-profile="sport-tabs"
                aria-label="Deporte"
                optionClassName="min-h-11 px-5"
                className="w-fit"
                options={[{ value: 'run', label: 'Correr' }, { value: 'bike', label: 'Ciclismo' }]}
                value={activeTab}
                onChange={setActiveTab}
            />

            {activeTab === 'run' && <SportZonesSection sport="run" sportLabel="Zonas de Carrera" icon={Footprints} showPace showPower={false} data={formData.run} onChange={handleChange} onZoneChange={handleZoneChange} onZonesMode={handleZonesMode} />}
            {activeTab === 'bike' && <SportZonesSection sport="bike" sportLabel="Zonas de Ciclismo" icon={Bike} showPace={false} showPower data={formData.bike} onChange={handleChange} onZoneChange={handleZoneChange} onZonesMode={handleZonesMode} />}
        </div>
    </div>
);
