import { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { estimateTssFromBlocks } from '../utils/tssEngine';
import {
    EMPTY_PLAN, stampTemplateBlocks, appendBlock, appendStep, updateStepIn, removeStepFrom,
    updateBlockIn, removeBlockFrom, reorderBlocks, parsePasteText, planToFormState,
    buildPlanPayload, estimateBlocksMinutes,
} from '../utils/calendarEngine';

/**
 * Estado y acciones del planificador del Calendario: modal de alta/edición, visor,
 * bloques del plan, plantillas, pegado mágico y guardado/borrado.
 */
export function usePlanEditor({ settings, addPlannedWorkout, updatePlannedWorkout, deletePlannedWorkout }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPastingString, setIsPastingString] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const [draggedBlockIdx, setDraggedBlockIdx] = useState(null);
    const [viewingPlan, setViewingPlan] = useState(null);
    const [editingPlanId, setEditingPlanId] = useState(null);
    const [selectedDateForPlan, setSelectedDateForPlan] = useState(null);
    const [newPlan, setNewPlan] = useState({
        type: 'Run',
        name: '',
        tss: 50,
        duration: 60,
        blocks: []
    });
    const [isSaving, setIsSaving] = useState(false);

    // --- LOCK BODY SCROLL WHEN MODAL/OVERLAY IS OPEN ---
    useEffect(() => {
        if (isModalOpen || viewingPlan) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isModalOpen, viewingPlan]);

    const setBlocks = (fn) => setNewPlan(prev => ({ ...prev, blocks: fn(prev.blocks) }));

    // --- APPLY TEMPLATE ---
    const applyTemplate = (template) => {
        const stampBlocks = stampTemplateBlocks(template);
        setNewPlan(prev => ({
            ...prev,
            name: template.name,
            tss: template.tss,
            duration: template.duration,
            blocks: stampBlocks
        }));
    };

    // --- AUTO TSS ESTIMATION FROM BLOCKS ---
    const estimatedTSS = useMemo(() => {
        if (newPlan.blocks.length === 0) return null;
        return estimateTssFromBlocks(newPlan.blocks, newPlan.type, settings);
    }, [newPlan.blocks, newPlan.type, settings]);

    // Auto-update TSS and duration when blocks change
    useEffect(() => {
        if (estimatedTSS !== null) {
            const totalMins = estimateBlocksMinutes(newPlan.blocks, newPlan.type);
            setNewPlan(prev => ({ ...prev, tss: estimatedTSS, duration: Math.round(totalMins) }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [estimatedTSS]);

    // --- BLOCK DRAG & DROP REORDERING ---
    const handleDragBlockStart = (e, idx) => {
        setDraggedBlockIdx(idx);
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDragBlockOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    const handleDropBlock = (e, idx) => {
        e.preventDefault();
        if (draggedBlockIdx === null || draggedBlockIdx === idx) return;
        setBlocks(blocks => reorderBlocks(blocks, draggedBlockIdx, idx));
        setDraggedBlockIdx(null);
    };
    const handleDragBlockEnd = () => {
        setDraggedBlockIdx(null);
    };

    const addBlock = (blockType) => setBlocks(blocks => appendBlock(blocks, blockType));
    const addStepToRepeat = (blockId, type) => setBlocks(blocks => appendStep(blocks, blockId, type));
    const updateStep = (blockId, stepId, field, value) => setBlocks(blocks => updateStepIn(blocks, blockId, stepId, field, value));
    const removeStep = (blockId, stepId) => setBlocks(blocks => removeStepFrom(blocks, blockId, stepId));
    const updateBlock = (id, field, value) => setBlocks(blocks => updateBlockIn(blocks, id, field, value));
    const removeBlock = (id) => setBlocks(blocks => removeBlockFrom(blocks, id));

    // --- AI SMART PASTE PARSER ---
    const handleMagicPaste = () => {
        if (!pasteText.trim()) return;
        const newBlocks = parsePasteText(pasteText, newPlan.type);
        if (newBlocks.length > 0) {
            setNewPlan(prev => ({ ...prev, blocks: [...prev.blocks, ...newBlocks] }));
        }
        setIsPastingString(false);
        setPasteText('');
    };

    const handleOpenPlanModal = (e, date) => {
        e.stopPropagation();
        setSelectedDateForPlan(date);
        setEditingPlanId(null);
        setNewPlan(EMPTY_PLAN());
        setIsModalOpen(true);
    };

    const handleEditPlan = (plan) => {
        setSelectedDateForPlan(new Date(plan.date));
        setEditingPlanId(plan.id);
        setNewPlan(planToFormState(plan));
        setViewingPlan(null);
        setIsModalOpen(true);
    };

    const handleSavePlan = async () => {
        if (!selectedDateForPlan) return;
        setIsSaving(true);
        try {
            const planData = buildPlanPayload(selectedDateForPlan, newPlan);
            if (editingPlanId) {
                await updatePlannedWorkout(editingPlanId, planData);
            } else {
                await addPlannedWorkout(planData);
            }
            setIsModalOpen(false);
            setEditingPlanId(null);
            setNewPlan(EMPTY_PLAN());
        } catch (e) {
            toast.error("Error guardando plan: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePlan = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("¿Borrar entrenamiento planeado?")) {
            try {
                await deletePlannedWorkout(id);
                toast.success("Plan eliminado.");
            } catch (e) {
                toast.error("Error al borrar: " + e.message);
            }
        }
    };

    return {
        isModalOpen, setIsModalOpen, isPastingString, setIsPastingString, pasteText, setPasteText,
        draggedBlockIdx, viewingPlan, setViewingPlan, editingPlanId, selectedDateForPlan,
        newPlan, setNewPlan, isSaving,
        applyTemplate, handleDragBlockStart, handleDragBlockOver, handleDropBlock, handleDragBlockEnd,
        addBlock, addStepToRepeat, updateStep, removeStep, updateBlock, removeBlock,
        handleMagicPaste, handleOpenPlanModal, handleEditPlan, handleSavePlan, handleDeletePlan,
    };
}
