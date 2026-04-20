/**
 * usePlannedWorkoutsQuery.ts — TanStack Query hook para entrenamientos planificados.
 *
 * Los entrenamientos planificados se recalculan en cliente al cargar, porque el TSS
 * depende de los settings fisiológicos del usuario (que no se almacenan en la BD).
 * Por eso el queryKey incluye un hash de los settings relevantes para el cálculo.
 *
 * Mutaciones:
 *  - addWorkoutMutation     — Crea un workout planificado nuevo
 *  - updateWorkoutMutation  — Actualiza un workout existente
 *  - deleteWorkoutMutation  — Elimina un workout por ID
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";
import { recalcTssFromBlocks } from "../../utils/tssEngine";
import { useAppStore } from "../../store/useAppStore";

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface WorkoutData {
    date: string;
    type: string;
    duration?: number;
    tss?: number;
    description?: string;
    [key: string]: any;
}

interface UpdatePayload {
    id: string | number;
    updates: Partial<WorkoutData>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Obtiene el user_id de la sesión activa, o null si no hay sesión. */
const getCurrentUserId = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
};

/**
 * Enriquece una fila de `planned_workouts` con los campos calculados en cliente:
 * - `tss`      → recalculado desde los bloques de descripción
 * - `dateObj`  → objeto Date para ordenar sin re-parsear
 * - `isPlanned` → flag para distinguir de actividades reales en vistas mixtas
 */
function enrichWorkout(row: any, settings: any) {
    return {
        ...row,
        tss:       recalcTssFromBlocks(row, settings),
        dateObj:   new Date(row.date),
        isPlanned: true,
    };
}

/** Ordena un array de workouts por fecha ascendente. */
function sortByDate(arr: any[]) {
    return arr.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export const usePlannedWorkoutsQuery = () => {
    const queryClient = useQueryClient();
    const { settings } = useAppStore();

    // Hash estable de los settings que afectan al cálculo de TSS.
    // Usar el objeto completo como key causaría re-fetches infinitos (referencia nueva cada render).
    const settingsKey = `${settings.bike?.ftp}-${settings.run?.lthr}-${settings.run?.thresholdPace}-${settings.fcReposo}`;

    // ── Query ───────────────────────────────────────────────────────────────────
    const query = useQuery({
        queryKey: ['plannedWorkouts', settingsKey],
        queryFn: async () => {
            const { data, error } = await supabase.from('planned_workouts').select('*');
            if (error) throw error;
            return sortByDate((data || []).map(row => enrichWorkout(row, settings)));
        },
    });

    // ── Mutation: añadir workout ────────────────────────────────────────────────
    const addWorkoutMutation = useMutation({
        mutationFn: async (workoutData: WorkoutData) => {
            const userId = await getCurrentUserId();
            if (!userId) throw new Error('No hay sesión activa');

            const { data, error } = await supabase
                .from('planned_workouts')
                .insert([{ ...workoutData, user_id: userId }])
                .select()
                .single();

            if (error) throw error;
            return enrichWorkout(data, settings);
        },
        onSuccess: (newWorkout) => {
            queryClient.setQueryData(['plannedWorkouts', settingsKey], (old: any) =>
                sortByDate(old ? [...old, newWorkout] : [newWorkout])
            );
        },
    });

    // ── Mutation: actualizar workout ────────────────────────────────────────────
    const updateWorkoutMutation = useMutation({
        mutationFn: async ({ id, updates }: UpdatePayload) => {
            const { data, error } = await supabase
                .from('planned_workouts')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return enrichWorkout(data, settings);
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(['plannedWorkouts', settingsKey], (old: any) => {
                if (!old) return [updated];
                return sortByDate(old.map((w: any) => w.id === updated.id ? updated : w));
            });
        },
    });

    // ── Mutation: eliminar workout ──────────────────────────────────────────────
    const deleteWorkoutMutation = useMutation({
        mutationFn: async (id: string | number) => {
            const { error } = await supabase.from('planned_workouts').delete().eq('id', id);
            if (error) throw error;
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData(['plannedWorkouts', settingsKey], (old: any) =>
                old ? old.filter((w: any) => w.id !== id) : []
            );
        },
    });

    return { query, addWorkoutMutation, updateWorkoutMutation, deleteWorkoutMutation };
};
