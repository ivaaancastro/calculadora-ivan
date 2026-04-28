/**
 * useActivitiesQuery.ts — TanStack Query hook para las actividades del usuario.
 *
 * Estrategia de carga en dos fases para minimizar tiempo hasta primer render:
 *  1. Fase rápida: descarga columnas ligeras (sin streams_data) y renderiza inmediatamente.
 *  2. Fase asíncrona: carga los streams de FC/potencia/GPS de los últimos 95 días
 *     en segundo plano y los inyecta en la caché sin causar re-render visible.
 *
 * Mutaciones expuestas:
 *  - deleteActivityMutation  — Borra una actividad por ID
 *  - clearDbMutation         — Borra todas las actividades del usuario
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";

/** Columnas ligeras a solicitar en la primera fase (excluye streams_data). */
const LIGHT_COLS = [
    'id', 'created_at', 'date', 'type', 'duration', 'distance',
    'hr_avg', 'calories', 'effort_perceived', 'notes', 'user_id',
    'strava_id', 'elevation_gain', 'watts_avg', 'name', 'description', 'speed_avg',
].join(',');

/** Días hacia atrás a considerar para la carga de streams en segundo plano. */
const STREAMS_LOOKBACK_DAYS = 95;

/** Obtiene el user_id de la sesión activa, o lanza si no hay sesión. */
const requireUserId = async (): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) throw new Error('No hay sesión activa');
    return userId;
};

export const useActivitiesQuery = () => {
    const queryClient = useQueryClient();

    // ── Query: actividades (dos fases) ────────────────────────────────────────
    const query = useQuery({
        queryKey: ['activities'],
        queryFn: async () => {
            // Fase 1: columnas ligeras, respuesta inmediata
            const { data: baseData, error } = await supabase
                .from('activities')
                .select(LIGHT_COLS);

            if (error) throw error;

            const sorted = (baseData || [])
                .map((a: any) => ({ ...a, dateObj: new Date(a.date), streams_data: null }))
                .sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime());

            // Fase 2: streams en segundo plano (500ms de retardo para no bloquear el render)
            setTimeout(async () => {
                try {
                    const cutoff = new Date();
                    cutoff.setDate(cutoff.getDate() - STREAMS_LOOKBACK_DAYS);

                    const { data: streamsData } = await supabase
                        .from('activities')
                        .select('id,streams_data')
                        .gte('date', cutoff.toISOString().split('T')[0])
                        .not('streams_data', 'is', null);

                    if (streamsData && streamsData.length > 0) {
                        const streamMap = new Map(streamsData.map((s) => [s.id, s.streams_data]));

                        queryClient.setQueryData(['activities'], (oldData: any) => {
                            if (!oldData) return oldData;
                            return oldData.map((a: any) =>
                                streamMap.has(a.id) ? { ...a, streams_data: streamMap.get(a.id) } : a
                            );
                        });
                    }
                } catch (e) {
                    console.warn('Carga de streams en segundo plano fallida:', e);
                }
            }, 500);

            return sorted;
        },
        // 30 minutos de staleTime: las actividades no cambian frecuentemente
        staleTime: 1000 * 60 * 30,
    });

    // ── Mutation: borrar una actividad ────────────────────────────────────────
    const deleteActivityMutation = useMutation({
        mutationFn: async (id: string | number) => {
            const userId = await requireUserId();
            const { error } = await supabase
                .from('activities')
                .delete()
                .eq('id', id)
                .eq('user_id', userId); // Garantiza que sólo el dueño puede borrar
            if (error) throw error;
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData(['activities'], (old: any) =>
                old ? old.filter((a: any) => a.id !== id) : []
            );
        },
    });

    // ── Mutation: borrar todas las actividades ────────────────────────────────
    const clearDbMutation = useMutation({
        mutationFn: async () => {
            const userId = await requireUserId();
            const { error } = await supabase
                .from('activities')
                .delete()
                .eq('user_id', userId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.setQueryData(['activities'], []);
        },
    });

    return { query, deleteActivityMutation, clearDbMutation };
};
