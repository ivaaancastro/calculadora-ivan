/**
 * useProfileQuery.ts — TanStack Query hook para el perfil fisiológico del usuario.
 *
 * Responsabilidades:
 *  - Leer el perfil de la tabla `profiles` de Supabase al iniciar la sesión.
 *  - Sincronizar el estado del store Zustand con los datos leídos.
 *  - Persistir cambios del usuario de vuelta a Supabase (upsert).
 *
 * Conversión de datos:
 *  - `mapDbToSettings`:  transforma columnas DB → formato del store (app-format)
 *  - `mapSettingsToDb`:  transforma store → columnas DB
 *  Ambas se usan en queryFn y onSuccess para mantener coherencia sin duplicar código.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";
import { useAppStore } from "../../store/useAppStore";
import { calcZonesFromLTHR } from "../../utils/tssEngine";
import toast from "react-hot-toast";

/** Obtiene el user de la sesión activa, o null si no hay sesión. */
const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
};

/**
 * Parsea un valor de BD a número, usando `fallback` sólo si el valor es null/undefined.
 * (A diferencia de `|| fallback`, no sustituye 0 ni strings vacíos válidos.)
 */
const num = (val: any, fallback: number): number => {
    if (val == null) return fallback;
    const n = Number(val);
    return isNaN(n) ? fallback : n;
};

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface AppSettings {
    fullName: string;
    email: string;
    avatarUrl: string;
    gender: string;
    weight: number;
    fcReposo: number;
    run: {
        max: number; lthr: number; zones: any; zonesMode: string;
        thresholdPace: string; paceZones: any;
    };
    bike: {
        max: number; lthr: number; zones: any; zonesMode: string; ftp: number;
    };
    intervalsId: string;
    intervalsKey: string;
    intervalsLastSynced?: string | null;
    offsetCtl: number;
}

// ── Funciones de transformación ────────────────────────────────────────────────

/**
 * Convierte una fila de la tabla `profiles` (columnas DB) al formato de AppSettings
 * que usa el store de Zustand.
 */
function mapDbToSettings(data: any, email: string): AppSettings {
    const runLthr  = num(data.run_lthr,    178);
    const runMax   = num(data.run_fc_max,  200);
    const bikeLthr = num(data.bike_lthr,   168);
    const bikeMax  = num(data.bike_fc_max, 190);

    return {
        fullName: data.full_name  ?? '',
        email:    email ?? '',
        avatarUrl: data.avatar_url ?? '',
        gender:   data.gender     ?? 'male',
        weight:   num(data.weight,   70),
        fcReposo: num(data.fc_rest,  50),
        run: {
            max:           runMax,
            lthr:          runLthr,
            zones:         data.run_zones     ?? calcZonesFromLTHR(runLthr, runMax),
            zonesMode:     data.run_zones_mode ?? 'lthr',
            thresholdPace: data.run_threshold_pace ?? '4:30',
            paceZones:     data.run_pace_zones ?? null,
        },
        bike: {
            max:       bikeMax,
            lthr:      bikeLthr,
            zones:     data.bike_zones     ?? calcZonesFromLTHR(bikeLthr, bikeMax),
            zonesMode: data.bike_zones_mode ?? 'lthr',
            ftp:       num(data.bike_ftp, 200),
        },
        intervalsId:         data.intervals_athlete_id ?? '',
        intervalsKey:        data.intervals_api_key    ?? '',
        intervalsLastSynced: data.intervals_last_synced ?? null,
        offsetCtl:           num(data.user_settings?.offsetCtl, 0),
    };
}

/**
 * Convierte AppSettings (formato del store) a las columnas de la tabla `profiles`.
 * Se usa tanto para el upsert como para actualizar la caché de React Query.
 */
function mapSettingsToDb(s: AppSettings, userId: string) {
    return {
        user_id:               userId,
        full_name:             s.fullName,
        avatar_url:            s.avatarUrl,
        gender:                s.gender,
        weight:                s.weight,
        fc_rest:               s.fcReposo,
        run_fc_max:            s.run?.max,
        run_lthr:              s.run?.lthr,
        run_zones:             s.run?.zones,
        run_zones_mode:        s.run?.zonesMode,
        run_threshold_pace:    s.run?.thresholdPace,
        run_pace_zones:        s.run?.paceZones,
        bike_fc_max:           s.bike?.max,
        bike_lthr:             s.bike?.lthr,
        bike_zones:            s.bike?.zones,
        bike_zones_mode:       s.bike?.zonesMode,
        bike_ftp:              s.bike?.ftp,
        intervals_athlete_id:  s.intervalsId,
        intervals_api_key:     s.intervalsKey,
    };
}

// ── Hook principal ─────────────────────────────────────────────────────────────

export const useProfileQuery = () => {
    const queryClient = useQueryClient();
    const { updateSettings, setStravaConnected } = useAppStore();

    // ── Query: leer perfil ────────────────────────────────────────────────────
    const query = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const user = await getCurrentUser();
            if (!user) return null;
            const userId = user.id;
            const userEmail = user.email || '';

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            // Perfil aún no creado (primer login) → insertar fila vacía
            if (error && error.code === 'PGRST116') {
                const fullNameFromAuth = user.user_metadata?.full_name || '';
                await supabase.from('profiles').insert([{ user_id: userId, full_name: fullNameFromAuth }]);
                const newProfile = { user_id: userId, full_name: fullNameFromAuth };
                updateSettings(mapDbToSettings(newProfile, userEmail));
                return newProfile;
            }

            if (data) {
                // Marcar si Strava está conectado
                if (data.strava_access_token) setStravaConnected(true);

                // Sincronizar el store con los datos del perfil
                updateSettings(mapDbToSettings(data, userEmail));
            }

            return data;
        },
        staleTime: Infinity, // El perfil sólo cambia cuando el usuario lo edita explícitamente
    });

    // ── Mutation: guardar perfil ──────────────────────────────────────────────
    const updateProfileMutation = useMutation({
        mutationFn: async (newSettings: AppSettings) => {
            const user = await getCurrentUser();
            if (!user) throw new Error('No hay sesión activa');
            const userId = user.id;

            const dbPayload = {
                ...mapSettingsToDb(newSettings, userId),
                // Preservar user_settings existente, sobreescribiendo sólo offsetCtl
                user_settings: {
                    ...(queryClient.getQueryData(['profile']) as any)?.user_settings,
                    offsetCtl: parseFloat(String(newSettings.offsetCtl)) || 0,
                },
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(dbPayload, { onConflict: 'user_id' });

            if (error) throw error;
            return { newSettings, userId };
        },

        onSuccess: ({ newSettings, userId }) => {
            // 1. Actualizar el store de Zustand
            updateSettings(newSettings);

            // 2. Actualizar la caché de React Query con las columnas DB
            //    (convertimos de vuelta para no corromper la caché con app-keys)
            queryClient.setQueryData(['profile'], (oldData: any) => ({
                ...(oldData || {}),
                ...mapSettingsToDb(newSettings, userId),
                intervals_last_synced: newSettings.intervalsLastSynced,
                user_settings: {
                    ...(oldData || {}).user_settings,
                    offsetCtl: parseFloat(String(newSettings.offsetCtl)) || 0,
                },
            }));

            toast.success('¡Perfil fisiológico y claves guardadas con éxito!');
        },

        onError: (error) => {
            console.error('Error guardando perfil:', error);
            toast.error('Hubo un error al intentar guardar en la base de datos.');
        },
    });

    return { query, updateProfileMutation };
};
