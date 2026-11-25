import { useState } from 'react';
import { toDateKey } from '../utils/dates';

/** Arrastrar un entreno planificado a otro día de la cuadrícula. */
export function useWorkoutDragDrop(updatePlannedWorkout) {
    const [draggedWorkout, setDraggedWorkout] = useState(null);
    const [dragOverDate, setDragOverDate] = useState(null);

    const handleDragStart = (e, workout) => {
        setDraggedWorkout(workout);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', workout.id);
    };

    const handleDragOver = (e, dateKey) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverDate(dateKey);
    };

    const handleDragLeave = () => setDragOverDate(null);

    const handleDrop = async (e, targetDate) => {
        e.preventDefault();
        setDragOverDate(null);
        if (!draggedWorkout || !updatePlannedWorkout) return;
        const newDateStr = targetDate.toISOString();
        const oldDateKey = toDateKey(draggedWorkout.date);
        const newDateKey = toDateKey(targetDate);
        if (oldDateKey === newDateKey) { setDraggedWorkout(null); return; }
        try {
            await updatePlannedWorkout(draggedWorkout.id, { date: newDateStr });
        } catch (err) {
            console.error('Error moving workout:', err);
        }
        setDraggedWorkout(null);
    };

    return { draggedWorkout, dragOverDate, handleDragStart, handleDragOver, handleDragLeave, handleDrop };
}
