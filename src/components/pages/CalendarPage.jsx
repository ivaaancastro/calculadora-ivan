/* eslint-disable no-unused-vars */
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';

import { useChartTheme } from '../charts/useChartTheme';
import { ChartSkinProvider } from '../charts/ChartSkin';
import { IconButton, Modal } from '../ui';
import { useCalendarDate } from '../../hooks/useCalendarDate';
import { useCalendarData } from '../../hooks/useCalendarData';
import { usePlanEditor } from '../../hooks/usePlanEditor';
import { useWorkoutDragDrop } from '../../hooks/useWorkoutDragDrop';
import { ActivityHeatmap } from '../charts/ActivityHeatmap';
import { PmcFloatingChart } from '../calendar/PmcFloatingChart';
import { WorkoutViewerModal } from '../calendar/WorkoutViewerModal';
import { CalendarMonthView } from '../calendar/CalendarMonthView';
import { PlannerModal } from '../calendar/PlannerModal';
import { MonthHero } from '../calendar/MonthHero';
import { buildMonthSummary } from '../../utils/monthSummary';
import { buildDayLoadLevels } from '../../utils/calendarLoad';

export const CalendarPage = ({ activities, plannedWorkouts = [], addPlannedWorkout, deletePlannedWorkout, updatePlannedWorkout, currentMetrics, settings, chartData = [], onDelete, onSelectActivity }) => {
    const { year, month, prevMonth, nextMonth, goToday } = useCalendarDate();

    const [showPmcChart, setShowPmcChart] = useState(false);
    const [pmcPos, setPmcPos] = useState({ x: window.innerWidth - 380, y: 120 });
    const pmcDragRef = React.useRef(null);

    const {
        isModalOpen, setIsModalOpen, isPastingString, setIsPastingString, pasteText, setPasteText,
        draggedBlockIdx, viewingPlan, setViewingPlan, editingPlanId, selectedDateForPlan,
        newPlan, setNewPlan, isSaving,
        applyTemplate, handleDragBlockStart, handleDragBlockOver, handleDropBlock, handleDragBlockEnd,
        addBlock, addStepToRepeat, updateStep, removeStep, updateBlock, removeBlock,
        handleMagicPaste, handleOpenPlanModal, handleEditPlan, handleSavePlan, handleDeletePlan,
    } = usePlanEditor({ settings, addPlannedWorkout, updatePlannedWorkout, deletePlannedWorkout });

    const {
        dragOverDate, handleDragStart, handleDragOver, handleDragLeave, handleDrop,
    } = useWorkoutDragDrop(updatePlannedWorkout);

    const { activitiesByDate, fullPmcByDate, calendarGrid } = useCalendarData({
        activities, plannedWorkouts, chartData, year, month,
    });

    const loadLevels = useMemo(() => buildDayLoadLevels(activitiesByDate, calendarGrid), [activitiesByDate, calendarGrid]);

    const monthSummary = useMemo(
        () => buildMonthSummary({ activities, plannedWorkouts, year, month }),
        [activities, plannedWorkouts, year, month],
    );

    return (
        <ChartSkinProvider skin="v2">
            <div data-skin="calendar" data-cal="root" className="flex flex-col bg-surface-6 rounded-3xl border border-line-soft overflow-hidden mb-6 shadow-sm">

                {/* HEADER */}
                <div data-cal="header" className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 bg-transparent border-b border-line-soft-5">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <h2 className="text-base sm:text-2xl font-semibold text-ink-2 capitalize tracking-tight flex items-center">
                            {new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={goToday} data-cal="today-btn" className="text-[11px] font-medium text-ink-3 hover:text-danger-ink-2 active:scale-95 transition-all ml-1 sm:ml-2 bg-sunken-6 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">Hoy</button>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* PMC CHART TOGGLE */}
                        <button onClick={() => setShowPmcChart(p => !p)} data-cal="pmc-toggle" className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-2xs font-black uppercase tracking-widest transition-colors shadow-sm ${showPmcChart ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/50' : 'bg-surface text-ink-3 border-slate-200 dark:border-zinc-700 hover:border-slate-400'}`}>
                            <Activity size={12} /> Forma
                        </button>

                        <div data-cal="month-nav" className="flex items-center border border-line-2 rounded-lg overflow-hidden ml-1 sm:ml-2">
                            <IconButton variant="ghost" onClick={prevMonth} className="w-10 h-10" title="Mes anterior" label="Mes anterior" icon={ChevronLeft} iconSize={18} />
                            <div className="w-px h-5 bg-fill-7"></div>
                            <IconButton variant="ghost" onClick={nextMonth} className="w-10 h-10" title="Mes siguiente" label="Mes siguiente" icon={ChevronRight} iconSize={18} />
                        </div>
                    </div>
                </div>

                <MonthHero
                    summary={monthSummary}
                    heatmap={<ActivityHeatmap activities={activities} />}
                    onPlan={() => handleOpenPlanModal({ stopPropagation() {} }, new Date())}
                />

                <CalendarMonthView
                        activitiesByDate={activitiesByDate}
                        calendarGrid={calendarGrid}
                        loadLevels={loadLevels}
                        dragOverDate={dragOverDate}
                        fullPmcByDate={fullPmcByDate}
                        handleDragLeave={handleDragLeave}
                        handleDragOver={handleDragOver}
                        handleDragStart={handleDragStart}
                        handleDrop={handleDrop}
                        handleOpenPlanModal={handleOpenPlanModal}
                        onSelectActivity={onSelectActivity}
                        setViewingPlan={setViewingPlan}
                />



            </div>

            {/* MODAL PLANIFICADOR */}
            {isModalOpen && (
                <PlannerModal
                    addBlock={addBlock}
                    addStepToRepeat={addStepToRepeat}
                    applyTemplate={applyTemplate}
                    draggedBlockIdx={draggedBlockIdx}
                    editingPlanId={editingPlanId}
                    handleDragBlockEnd={handleDragBlockEnd}
                    handleDragBlockOver={handleDragBlockOver}
                    handleDragBlockStart={handleDragBlockStart}
                    handleDropBlock={handleDropBlock}
                    handleMagicPaste={handleMagicPaste}
                    handleSavePlan={handleSavePlan}
                    isModalOpen={isModalOpen}
                    isPastingString={isPastingString}
                    isSaving={isSaving}
                    newPlan={newPlan}
                    pasteText={pasteText}
                    removeBlock={removeBlock}
                    removeStep={removeStep}
                    selectedDateForPlan={selectedDateForPlan}
                    setIsModalOpen={setIsModalOpen}
                    setIsPastingString={setIsPastingString}
                    setNewPlan={setNewPlan}
                    setPasteText={setPasteText}
                    settings={settings}
                    updateBlock={updateBlock}
                    updateStep={updateStep}
                />
            )}
            {/* MODAL VER ENTRENAMIENTO PLANEADO */}
            {viewingPlan && (
                <Modal open={!!viewingPlan} onClose={() => setViewingPlan(null)} variant="viewer" labelledBy="plan-viewer-title" closeOnBackdrop>
                    <WorkoutViewerModal
                        workout={viewingPlan}
                        onClose={() => setViewingPlan(null)}
                        onDelete={(e) => handleDeletePlan(e, viewingPlan.id)}
                        onEdit={() => handleEditPlan(viewingPlan)}
                    />
                </Modal>
            )}

            {/* FLOATING DRAGGABLE PMC CHART */}
            {
                showPmcChart && (
                    <PmcFloatingChart
                        pmcByDate={fullPmcByDate}
                        onClose={() => setShowPmcChart(false)}
                        initPos={pmcPos}
                    />
                )
            }

        </ChartSkinProvider>
    );
};

export default CalendarPage;
