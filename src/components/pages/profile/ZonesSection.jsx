import React from 'react';
import { Footprints, Bike, RefreshCw, Loader2 } from 'lucide-react';
import { Card, Segmented } from '../../ui';
import { SportZonesSection } from './SportZonesSection';

export const ZonesSection = ({ formData, activeTab, setActiveTab, isScanning, pureActs, handleAutoDetectLTHR, handleChange, handleZoneChange, handleZonesMode }) => {
    const isV2 = true; // v2 por defecto (Capa 6); las ramas v1 se retiran en los PR 5a–c
    return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-250">
        {/* AUTO-DETECT LTHR BANNER */}
        <Card className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-[8px] bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <RefreshCw size={15} strokeWidth={2.3} />
                </div>
                <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-ink truncate">Auto-Detectar LTHR</p>
                    <p className="text-[10px] text-ink-4 truncate">Calcula tu umbral desde el historial</p>
                </div>
            </div>
            <button 
                onClick={handleAutoDetectLTHR} 
                disabled={isScanning || pureActs.length === 0} 
                className="px-3.5 py-1.5 bg-surface-2 hover:bg-fill-7 text-ink-2-soft rounded-full text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0 active:scale-95"
            >
                {isScanning ? <><Loader2 size={13} className="animate-spin" /> Analizando...</> : 'Escanear'}
            </button>
        </Card>

        {/* SPORT SELECTOR SEGMENTED */}
        {isV2 ? (
            <Segmented
                data-profile="sport-tabs"
                aria-label="Deporte"
                optionClassName="min-h-11"
                options={[{ value: 'run', label: 'Correr' }, { value: 'bike', label: 'Ciclismo' }]}
                value={activeTab}
                onChange={setActiveTab}
            />
        ) : (
        <div className="flex p-1 bg-fill-segmented rounded-full backdrop-blur-md gap-0.5 select-none">
            <button 
                onClick={() => setActiveTab('run')} 
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 select-none touch-manipulation active:scale-95 ${
                    activeTab === 'run' ? 'bg-surface-4 text-sport-run-ink shadow-xs' : 'text-ink-3'
                }`}
            >
                <Footprints size={14} strokeWidth={2.3} /> Correr
            </button>
            <button 
                onClick={() => setActiveTab('bike')} 
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 select-none touch-manipulation active:scale-95 ${
                    activeTab === 'bike' ? 'bg-surface-4 text-action shadow-xs' : 'text-ink-3'
                }`}
            >
                <Bike size={14} strokeWidth={2.3} /> Ciclismo
            </button>
        </div>
        )}

        {activeTab === 'run' && <SportZonesSection sport="run" sportLabel="Zonas de Carrera" icon={Footprints} color="orange" showPace showPower={false} data={formData.run} onChange={handleChange} onZoneChange={handleZoneChange} onZonesMode={handleZonesMode} />}
        {activeTab === 'bike' && <SportZonesSection sport="bike" sportLabel="Zonas de Ciclismo" icon={Bike} color="blue" showPace={false} showPower data={formData.bike} onChange={handleChange} onZoneChange={handleZoneChange} onZonesMode={handleZonesMode} />}
    </div>
    );
};
