/* eslint-disable no-unused-vars */
import { Footprints, Bike, Dumbbell, Activity, Target, X } from 'lucide-react';
import React from 'react';
import { formatMinutes } from '../../utils/formatters';
import { Button, Input, Modal, Segmented, Select } from '../ui';
import { WORKOUT_TEMPLATES } from '../../utils/calendarTemplates';
import { DurationInput } from './DurationInput';
import { zoneColors } from './calendarHelpers';

export const PlannerModal = ({
    addBlock,
    addStepToRepeat,
    applyTemplate,
    draggedBlockIdx,
    editingPlanId,
    handleDragBlockEnd,
    handleDragBlockOver,
    handleDragBlockStart,
    handleDropBlock,
    handleMagicPaste,
    handleSavePlan,
    isModalOpen,
    isPastingString,
    isSaving,
    newPlan,
    pasteText,
    removeBlock,
    removeStep,
    selectedDateForPlan,
    setIsModalOpen,
    setIsPastingString,
    setNewPlan,
    setPasteText,
    settings,
    updateBlock,
    updateStep,
}) => (
                <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} variant="planner" labelledBy="plan-modal-title">
                    {/* HEADER */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-line-soft shrink-0">
                        <div>
                            <h3 id="plan-modal-title" className="text-base font-semibold text-slate-900 dark:text-zinc-50 tracking-tight">
                                {editingPlanId ? 'Editar Entrenamiento' : 'Planificar Entrenamiento'}
                            </h3>
                            <p className="text-[13px] text-ink-4 mt-0.5">
                                {selectedDateForPlan?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                        <button type="button" aria-label="Cerrar" onClick={() => setIsModalOpen(false)} data-cal="modal-close" className="shrink-0 ml-4 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-surface-2 rounded-full transition-colors"><X size={15} /></button>
                    </div>

                    <div className="px-6 py-5 overflow-y-auto flex-1 bg-surface custom-scrollbar">
                        <div className="space-y-5">

                            {/* SPORT SELECTOR */}
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    { key: 'Run', label: 'Carrera', icon: <Footprints size={13} /> },
                                    { key: 'Ride', label: 'Ciclismo', icon: <Bike size={13} /> },
                                    { key: 'Swim', label: 'Natación', icon: <Activity size={13} /> },
                                    { key: 'WeightTraining', label: 'Fuerza', icon: <Dumbbell size={13} /> },
                                    { key: 'Workout', label: 'Otro', icon: <Activity size={13} /> },
                                ].map(s => (
                                    <button key={s.key} onClick={() => setNewPlan(prev => ({ ...prev, type: s.key, blocks: [] }))}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                                            ${newPlan.type === s.key
                                                ? 'bg-inverse text-ink-inverse shadow-sm'
                                                : 'text-ink-3 hover:bg-surface-2'}`}>
                                        {s.icon}<span>{s.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* TEMPLATES */}
                            {(WORKOUT_TEMPLATES[newPlan.type] || []).length > 0 && (
                                <div className="flex gap-1.5 flex-wrap">
                                    {(WORKOUT_TEMPLATES[newPlan.type] || []).map((t, i) => (
                                        <button key={i} onClick={() => applyTemplate(t)}
                                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200
                                                ${newPlan.name === t.name
                                                    ? 'bg-blue-500/10 text-action dark:bg-blue-500/20'
                                                    : 'text-ink-4 hover:text-body-soft-2 hover:bg-sunken'}`}
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* TITLE + METRICS */}
                            <div className="flex flex-col md:flex-row gap-3 items-start md:items-end w-full pt-1 border-t border-line-soft">
                                <div className="flex-1 w-full">
                                    <input type="text" value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                                        placeholder="Nombre del entrenamiento"
                                        className="w-full bg-transparent text-[15px] font-medium text-ink-2 border-0 border-b border-line px-0 py-2 outline-none focus:border-line-strong-2 transition-colors placeholder:text-faint"
                                    />
                                </div>
                                <div className="flex gap-4 shrink-0 pb-1">
                                    <div className="text-center">
                                        <span className="text-2xs font-medium text-ink-4 uppercase tracking-wider block mb-0.5">TSS</span>
                                        <span className="text-lg font-semibold text-ink-2-soft font-mono">{newPlan.tss}</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-2xs font-medium text-ink-4 uppercase tracking-wider block mb-0.5">Duración</span>
                                        <span className="text-lg font-semibold text-ink-2-soft font-mono">{formatMinutes(newPlan.duration)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* ESTRUCTURA */}
                            <div className="pt-1">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 gap-2">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-[13px] font-semibold text-ink-2-soft tracking-tight">Estructura</h4>
                                        <button onClick={() => setIsPastingString(!isPastingString)} className={`px-2 py-0.5 rounded-full text-2xs font-medium transition-all duration-200 ${isPastingString ? 'bg-action-bright/10 text-action-solid' : 'text-slate-400 hover:text-slate-600 hover:bg-surface-2'}`} title="Importar desde texto">
                                            Texto
                                        </button>
                                    </div>
                                    <div className="flex gap-1.5">
                                        {newPlan.type === 'WeightTraining' ? (<>
                                            <Button variant="ghost" onClick={() => addBlock('warmup')} className="px-2.5 py-1">+ Calentar</Button>
                                            <Button variant="ghost" onClick={() => addBlock('main')} className="px-2.5 py-1">+ Ejercicio</Button>
                                            <Button variant="inverse" onClick={() => addBlock('repeat')} className="px-2.5 py-1">+ Circuito</Button>
                                        </>) : (<>
                                            <Button variant="ghost" onClick={() => addBlock('warmup')} className="px-2.5 py-1">+ Calentar</Button>
                                            <Button variant="ghost" onClick={() => addBlock('main')} className="px-2.5 py-1">+ Bloque</Button>
                                            <Button variant="inverse" onClick={() => addBlock('repeat')} className="px-2.5 py-1">+ Intervalos</Button>
                                        </>)}
                                    </div>
                                </div>

                                {/* AI SMART PASTE AREA */}
                                {isPastingString && (
                                    <div className="mb-4 p-4 rounded-xl bg-sunken-2 border border-line-soft">
                                        <label className="block text-2xs font-semibold text-ink-3 uppercase tracking-wider mb-2">Importar desde texto</label>
                                        <textarea
                                            value={pasteText}
                                            onChange={e => setPasteText(e.target.value)}
                                            placeholder={`Pega el texto aquí línea a línea.\nEj:\no Calentamiento articular\no 4x8 Sentadillas Búlgaras\no 3x10 Press Banca`}
                                            className="w-full bg-surface border border-line rounded-lg p-3 text-sm text-body resize-y min-h-[80px] outline-none focus:border-line-strong-2 mb-3 placeholder:text-faint"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setIsPastingString(false)} className="px-3 py-1.5 rounded-full text-[11px] font-medium text-ink-3 hover:bg-surface-2 transition-all">Cancelar</button>
                                            <button onClick={handleMagicPaste} disabled={!pasteText.trim()} className="px-4 py-1.5 rounded-full text-[11px] font-semibold bg-slate-900 dark:bg-white text-ink-inverse hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm">
                                                Analizar e Insertar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 mt-4">
                                    {newPlan.blocks.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-8 text-center bg-sunken-6 border border-dashed border-line-strong rounded-lg">
                                            <p className="text-ink-3 text-sm">Entrenamiento vacío.</p>
                                            <p className="text-ink-4 text-xs mt-1">Inserta filas usando los botones superiores.</p>
                                        </div>
                                    )}
                                    {newPlan.blocks?.map((block, idx) => {
                                        const isStr = newPlan.type === 'WeightTraining';
                                        const canUsePower = newPlan.type === 'Ride';
                                        const ftp = settings?.bike?.ftp || 200;
                                        const POWER_ZONES_DEF = [
                                            { label: 'Rec', pMin: 0, pMax: 0.55 },
                                            { label: 'Endur', pMin: 0.56, pMax: 0.75 },
                                            { label: 'Tempo', pMin: 0.76, pMax: 0.90 },
                                            { label: 'Umbral', pMin: 0.91, pMax: 1.05 },
                                            { label: 'VO2', pMin: 1.06, pMax: 1.20 },
                                            { label: 'AnC', pMin: 1.21, pMax: 1.50 },
                                            { label: 'Neu', pMin: 1.51, pMax: 2.00 },
                                        ];
                                        // Sport-specific zone labels
                                        const sportKey = newPlan.type === 'Ride' ? 'bike' : newPlan.type === 'Swim' ? 'swim' : 'run';
                                        const sportZones = settings?.[sportKey]?.zones || settings?.run?.zones || [];
                                        const zoneLabels = ['Rec', 'Base', 'Tempo', 'Umbr', 'VO2', 'AnC', 'Neu'];
                                        const currentZoneMode = block.zoneMode || 'hr';
                                        const zones = isStr
                                            ? [{ v: 'Z1', l: 'Ligero' }, { v: 'Z2', l: 'Mod.' }, { v: 'Z3', l: 'Duro' }, { v: 'Z4', l: 'Máx.' }]
                                            : currentZoneMode === 'power' && canUsePower
                                                ? [
                                                    ...POWER_ZONES_DEF.map((pz, i) => ({
                                                        v: `Z${i + 1}`,
                                                        l: `Z${i + 1} ${pz.label} ${Math.round(ftp * pz.pMin)}-${Math.round(ftp * pz.pMax)}w`,
                                                    })),
                                                    { v: 'R23', l: `Rampa Z2→Z3 ${Math.round(ftp * 0.65)}-${Math.round(ftp * 0.90)}w` },
                                                    { v: 'R34', l: `Rampa Z3→Z4 ${Math.round(ftp * 0.83)}-${Math.round(ftp * 1.05)}w` },
                                                ]
                                                : [
                                                    ...(sportZones || []).map((z, i) => ({
                                                        v: `Z${i + 1}`,
                                                        l: `Z${i + 1} ${zoneLabels[i] || ''} ${z.min}-${z.max}bpm`,
                                                    })),
                                                    ...(sportZones.length >= 2 ? [
                                                        { v: 'R12', l: `Rampa Z1→Z2` },
                                                        { v: 'R23', l: `Rampa Z2→Z3` },
                                                    ] : []),
                                                ];
                                        // Helper: toggle zone mode & auto-set target type
                                        const handleZoneModeChange = (mode) => {
                                            updateBlock(block.id, 'zoneMode', mode);
                                            if (mode === 'power') {
                                                updateBlock(block.id, 'targetType', 'power');
                                                const watts = getWattsForZone(block.zone || 'Z2');
                                                updateBlock(block.id, 'targetValue', String(watts));
                                            } else {
                                                updateBlock(block.id, 'targetType', 'none');
                                                updateBlock(block.id, 'targetValue', '');
                                            }
                                        };
                                        // Helper: get midpoint watts for a zone or ramp
                                        const getWattsForZone = (zone) => {
                                            if (zone === 'R23') return Math.round(ftp * (0.65 + 0.90) / 2);
                                            if (zone === 'R34') return Math.round(ftp * (0.83 + 1.05) / 2);
                                            const zIdx = parseInt(zone.replace('Z', '')) - 1;
                                            const pz = POWER_ZONES_DEF[zIdx] || POWER_ZONES_DEF[1];
                                            return Math.round(ftp * (pz.pMin + pz.pMax) / 2);
                                        };
                                        // Helper: when zone changes in power mode, auto-update target watts
                                        const handleZoneChangeWithPower = (newZone, updateFn) => {
                                            updateFn('zone', newZone);
                                            if (currentZoneMode === 'power') {
                                                updateFn('targetValue', String(getWattsForZone(newZone)));
                                                updateFn('targetType', 'power');
                                            }
                                        };

                                        // REPEAT BLOCK
                                        if (block.type === 'repeat') {
                                            return (
                                                <div key={block.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragBlockStart(e, idx)}
                                                    onDragOver={(e) => handleDragBlockOver(e, idx)}
                                                    onDrop={(e) => handleDropBlock(e, idx)}
                                                    onDragEnd={handleDragBlockEnd}
                                                    className={`rounded-xl bg-surface-6 overflow-hidden cursor-move transition-all border border-line-soft ${draggedBlockIdx === idx ? 'opacity-50' : 'hover:border-line-2'}`}>
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/50 dark:bg-zinc-900/50 border-b border-line-soft">
                                                        <span className="text-[11px] font-semibold text-body-soft">Repetir</span>
                                                        <input type="number" value={block.repeats} min={1} onChange={e => updateBlock(block.id, 'repeats', parseInt(e.target.value) || 1)}
                                                            className="w-9 bg-surface-7 rounded-lg text-[13px] font-mono px-1.5 py-0.5 outline-none no-spinner text-center text-body" />
                                                        <span className="text-2xs font-medium text-ink-4">veces</span>
                                                        {canUsePower && !isStr && (
                                                            <Segmented variant="mini" className="shrink-0 ml-auto mr-2">
                                                                <Segmented.Option onClick={() => handleZoneModeChange('hr')}
                                                                    active={currentZoneMode === 'hr'} tone="hr">FC</Segmented.Option>
                                                                <Segmented.Option onClick={() => handleZoneModeChange('power')}
                                                                    active={currentZoneMode === 'power'} tone="power">W</Segmented.Option>
                                                            </Segmented>
                                                        )}
                                                        <Button variant="danger-text" onClick={() => removeBlock(block.id)} className={canUsePower && !isStr ? '' : 'ml-auto'}><X size={13} /></Button>
                                                    </div>
                                                    <div className="p-3 bg-surface-6">
                                                        <div className="space-y-3">
                                                            {(block.steps || []).map((step, sIdx) => (
                                                                 <div key={step.id} className="flex flex-wrap items-center gap-2 relative">
                                                                    <select value={step.type} onChange={e => updateStep(block.id, step.id, 'type', e.target.value)}
                                                                        className={`w-20 shrink-0 bg-transparent ${step.type === 'active' ? 'text-ink-2-soft font-semibold' : 'text-ink-4'} text-[11px] outline-none cursor-pointer`}>
                                                                        <option value="active">{isStr ? 'Trabajar' : 'Activo'}</option>
                                                                        <option value="recovery">Pausa</option>
                                                                    </select>

                                                                    {/* KM/MIN toggle */}
                                                                    <Segmented variant="mini" className="shrink-0">
                                                                         {!isStr && (
                                                                             <Segmented.Option onClick={() => updateStep(block.id, step.id, 'unit', 'dist')}
                                                                                active={step.unit === 'dist'}>KM</Segmented.Option>
                                                                         )}
                                                                         <Segmented.Option onClick={() => updateStep(block.id, step.id, 'unit', 'time')}
                                                                             active={step.unit === 'time' || isStr}>MIN</Segmented.Option>
                                                                    </Segmented>

                                                                    {step.unit === 'dist' && !isStr ? (
                                                                        <Input type="number" value={step.duration} min={0} onChange={e => updateStep(block.id, step.id, 'duration', e.target.value)}
                                                                            variant="cell" mono className="w-12 shrink-0 px-2 py-1 text-center" />
                                                                    ) : (
                                                                        <DurationInput value={step.duration} onChange={v => updateStep(block.id, step.id, 'duration', v)} />
                                                                    )}

                                                                    {/* Zone selector */}
                                                                    <Select value={step.zone} onChange={e => handleZoneChangeWithPower(e.target.value, (k, v) => updateStep(block.id, step.id, k, v))}
                                                                        variant="cell" className="shrink-0 px-2 py-1.5">
                                                                        {zones.map(z => <option key={z.v} value={z.v}>{z.l}</option>)}
                                                                    </Select>

                                                                    {/* Target value display */}
                                                                    {currentZoneMode === 'power' && step.targetValue && (
                                                                        <span className="text-[11px] font-mono font-semibold text-power-ink bg-power-tint-3 px-2 py-0.5 rounded-full">
                                                                            {step.targetValue}w
                                                                        </span>
                                                                    )}
                                                                    {!isStr && currentZoneMode !== 'power' && (
                                                                        <div className="flex items-center gap-1">
                                                                            <Select value={step.targetType || 'none'} onChange={e => { updateStep(block.id, step.id, 'targetType', e.target.value); if(e.target.value === 'none') updateStep(block.id, step.id, 'targetValue', ''); }}
                                                                                variant="cell-bare" className="px-1 py-0.5">
                                                                                <option value="none">--</option>
                                                                                <option value="power">W</option>
                                                                                <option value="pace">/km</option>
                                                                            </Select>
                                                                            {(step.targetType === 'power' || step.targetType === 'pace') && (
                                                                                <Input type={step.targetType === 'power' ? "number" : "text"} 
                                                                                    placeholder={step.targetType === 'power' ? "200" : "4:30"} 
                                                                                    value={step.targetValue || ''} 
                                                                                    onChange={e => updateStep(block.id, step.id, 'targetValue', e.target.value)}
                                                                                    variant="cell" size="sm" className="w-12 shrink-0 px-1.5 py-0.5 text-center" 
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    <input type="text" value={step.details || ''} onChange={e => updateStep(block.id, step.id, 'details', e.target.value)}
                                                                        placeholder="Nota"
                                                                        className="flex-1 min-w-[60px] bg-transparent border-b border-dashed border-slate-200 dark:border-zinc-800 py-1 text-[11px] outline-none focus:border-slate-400 placeholder:text-faint" />
                                                                    
                                                                    <Button variant="danger-text" onClick={() => removeStep(block.id, step.id)} className="ml-1 shrink-0"><X size={13}/></Button>
                                                                </div>
                                                            ))}
                                                            
                                                            <div className="flex gap-2 pt-2 border-t border-line-soft mt-1">
                                                                <button onClick={() => addStepToRepeat(block.id, 'pair')} className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300 font-medium transition-colors">+ Par Trabajo/Descanso</button>
                                                                <span className="text-slate-200 dark:text-zinc-700">|</span>
                                                                <Button variant="link-muted" onClick={() => addStepToRepeat(block.id, 'active')}>+ Trabajo</Button>
                                                                <Button variant="link-muted" onClick={() => addStepToRepeat(block.id, 'recovery')}>+ Descanso</Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // NORMAL BLOCK (Warmup/Main/Cooldown)
                                        const bLabelStyle = block.type === 'warmup' ? 'text-orange-600' : block.type === 'cooldown' ? 'text-blue-600' : 'text-body';
                                        const bLabel = block.type === 'warmup' ? 'Calentar' : block.type === 'cooldown' ? 'Soltar' : 'Trabajar';

                                        return (
                                            <div key={block.id}
                                                draggable
                                                onDragStart={(e) => handleDragBlockStart(e, idx)}
                                                onDragOver={(e) => handleDragBlockOver(e, idx)}
                                                onDrop={(e) => handleDropBlock(e, idx)}
                                                onDragEnd={handleDragBlockEnd}
                                                className={`py-2.5 px-3 flex flex-wrap items-center gap-2.5 bg-surface-6 rounded-xl border border-line-soft cursor-move transition-all ${draggedBlockIdx === idx ? 'opacity-50' : 'hover:border-line-2'}`}>

                                                <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                                                    <div className={`w-1 h-5 rounded-full shrink-0`} style={{ background: zoneColors[block.zone] || zoneColors.Z1 }}></div>
                                                    <span className={`text-[11px] font-semibold w-14 shrink-0 ${bLabelStyle}`}>{bLabel}</span>
                                                    
                                                    {/* KM / MIN toggle */}
                                                    <Segmented variant="mini" className="shrink-0">
                                                        {!isStr && (
                                                            <Segmented.Option onClick={() => updateBlock(block.id, 'unit', 'dist')}
                                                                active={block.unit === 'dist'}>KM</Segmented.Option>
                                                        )}
                                                        <Segmented.Option onClick={() => updateBlock(block.id, 'unit', 'time')}
                                                            active={block.unit === 'time' || isStr}>MIN</Segmented.Option>
                                                    </Segmented>

                                                    {block.unit === 'dist' && !isStr ? (
                                                        <Input type="number" placeholder="km" value={block.duration} min={0} onChange={e => updateBlock(block.id, 'duration', e.target.value)}
                                                            variant="cell" mono className="w-12 shrink-0 px-2 py-1 text-center" />
                                                    ) : (
                                                        <DurationInput value={block.duration} onChange={v => updateBlock(block.id, 'duration', v)} />
                                                    )}

                                                    {/* FC / W mode toggle (only for bike) */}
                                                    {canUsePower && !isStr && (
                                                        <Segmented variant="mini" className="shrink-0">
                                                            <Segmented.Option onClick={() => handleZoneModeChange('hr')}
                                                                active={currentZoneMode === 'hr'} tone="hr">FC</Segmented.Option>
                                                            <Segmented.Option onClick={() => handleZoneModeChange('power')}
                                                                active={currentZoneMode === 'power'} tone="power">W</Segmented.Option>
                                                        </Segmented>
                                                    )}

                                                    {/* Zone selector */}
                                                    <Select value={block.zone} onChange={e => handleZoneChangeWithPower(e.target.value, (k, v) => updateBlock(block.id, k, v))}
                                                        variant="cell" className="shrink-0 px-2 py-1.5">
                                                        {zones.map(z => <option key={z.v} value={z.v}>{z.l}</option>)}
                                                    </Select>

                                                    {/* Target value (auto for power, manual for pace) */}
                                                    {currentZoneMode === 'power' && block.targetValue && (
                                                        <span className="text-[11px] font-mono font-semibold text-power-ink bg-power-tint-3 px-2 py-0.5 rounded-full">
                                                            {block.targetValue}w
                                                            {ftp > 0 && <span className="text-2xs text-power-soft ml-1">{Math.round((Number(block.targetValue) / ftp) * 100)}%</span>}
                                                        </span>
                                                    )}
                                                    {!isStr && currentZoneMode !== 'power' && (
                                                        <div className="flex items-center gap-1">
                                                            <Select value={block.targetType || 'none'} onChange={e => { updateBlock(block.id, 'targetType', e.target.value); if(e.target.value === 'none') updateBlock(block.id, 'targetValue', ''); }}
                                                                variant="cell-bare" className="px-1 py-0.5">
                                                                <option value="none">--</option>
                                                                <option value="power">W</option>
                                                                <option value="pace">/km</option>
                                                            </Select>
                                                            {(block.targetType === 'power' || block.targetType === 'pace') && (
                                                                <Input type={block.targetType === 'power' ? "number" : "text"} 
                                                                    placeholder={block.targetType === 'power' ? "200" : "4:30"} 
                                                                    value={block.targetValue || ''} 
                                                                    onChange={e => updateBlock(block.id, 'targetValue', e.target.value)}
                                                                    variant="cell" size="sm" className="w-12 shrink-0 px-1.5 py-0.5 text-center" 
                                                                />
                                                            )}
                                                        </div>
                                                    )}

                                                    <input type="text" value={block.details || ''} onChange={e => updateBlock(block.id, 'details', e.target.value)}
                                                        placeholder="Nota"
                                                        className="flex-1 min-w-[80px] bg-transparent border-b border-dashed border-line py-1 text-[11px] outline-none focus:border-line-strong-2 placeholder:text-faint" />
                                                </div>

                                                <Button variant="danger-text" onClick={() => removeBlock(block.id)} className="shrink-0"><X size={14} /></Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="px-6 py-3.5 border-t border-line-soft flex justify-end items-center gap-2 shrink-0">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-full text-xs font-medium text-ink-3 hover:bg-surface-2 transition-all">Cancelar</button>
                        <button onClick={handleSavePlan} data-cal="modal-submit" disabled={isSaving} className="px-5 py-2 rounded-full text-xs font-semibold text-ink-inverse bg-inverse hover:bg-inverse-2 disabled:opacity-50 transition-all shadow-sm">
                            {isSaving ? 'Guardando...' : editingPlanId ? 'Guardar' : 'Añadir'}
                        </button>
                    </div>
                </Modal>
);
