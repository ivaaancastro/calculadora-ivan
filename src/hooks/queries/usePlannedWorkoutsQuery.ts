import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";
import { recalcTssFromBlocks } from "../../utils/tssEngine";
import { useAppStore } from "../../store/useAppStore";

const getCurrentUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
};

export const usePlannedWorkoutsQuery = () => {
    const queryClient = useQueryClient();
    const { settings } = useAppStore();

    // Use stable scalar values in the query key instead of the whole settings object
    // (objects are compared by reference and would cause infinite re-fetches)
    const settingsKey = `${settings.bike?.ftp}-${settings.run?.lthr}-${settings.run?.thresholdPace}-${settings.fcReposo}`;

    const query = useQuery({
        queryKey: ["plannedWorkouts", settingsKey], // Recalcular TSS si cambian los settings
        queryFn: async () => {
            const { data, error } = await supabase.from("planned_workouts").select("*");
            if (error) throw error;
            if (data) {
                return data.map((a) => ({
                    ...a,
                    tss: recalcTssFromBlocks(a, settings),
                    dateObj: new Date(a.date),
                    isPlanned: true,
                })).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
            }
            return [];
        },
    });

    const addWorkoutMutation = useMutation({
        mutationFn: async (workoutData: any) => {
            const userId = await getCurrentUserId();
            if (!userId) throw new Error("No hay sesión activa");

            const { data, error } = await supabase
                .from("planned_workouts")
                .insert([{ ...workoutData, user_id: userId }])
                .select()
                .single();

            if (error) throw error;
            return { ...data, dateObj: new Date(data.date), tss: recalcTssFromBlocks(data, settings), isPlanned: true };
        },
        onSuccess: (newWorkout) => {
            queryClient.setQueryData(["plannedWorkouts", settingsKey], (old: any) => {
                const arr = old ? [...old, newWorkout] : [newWorkout];
                return arr.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
            });
        }
    });

    const updateWorkoutMutation = useMutation({
        mutationFn: async ({ id, updates }: any) => {
            const { data, error } = await supabase
                .from("planned_workouts")
                .update(updates)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return { ...data, dateObj: new Date(data.date), tss: recalcTssFromBlocks(data, settings), isPlanned: true };
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(["plannedWorkouts", settingsKey], (old: any) => {
                if (!old) return [updated];
                return old.map((w: any) => w.id === updated.id ? updated : w).sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime());
            });
        }
    });

    const deleteWorkoutMutation = useMutation({
        mutationFn: async (id: any) => {
            const { error } = await supabase.from("planned_workouts").delete().eq("id", id);
            if (error) throw error;
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData(["plannedWorkouts", settingsKey], (old: any) =>
                old ? old.filter((w: any) => w.id !== id) : []
            );
        }
    });

    return { query, addWorkoutMutation, updateWorkoutMutation, deleteWorkoutMutation };
};
