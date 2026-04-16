import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";
import { useAppStore } from "../../store/useAppStore";
import { calcZonesFromLTHR } from "../../utils/tssEngine";
import toast from "react-hot-toast";

const getCurrentUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
};

// Helper: safely parse a number from DB, only falling back when truly null/undefined
const num = (val: any, fallback: number): number => {
    if (val == null) return fallback;
    const n = Number(val);
    return isNaN(n) ? fallback : n;
};

export const useProfileQuery = () => {
    const queryClient = useQueryClient();
    const { updateSettings, setStravaConnected } = useAppStore();

    const query = useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const userId = await getCurrentUserId();
            if (!userId) return null;

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", userId)
                .single();

            if (error && error.code === "PGRST116") {
                await supabase.from("profiles").insert([{ user_id: userId }]);
                return { user_id: userId };
            }

            if (data) {
                if (data.strava_access_token) setStravaConnected(true);

                const runLthr = num(data.run_lthr, 178);
                const runMax = num(data.run_fc_max, 200);
                const bikeLthr = num(data.bike_lthr, 168);
                const bikeMax = num(data.bike_fc_max, 190);

                updateSettings({
                    gender: data.gender ?? "male",
                    weight: num(data.weight, 70),
                    fcReposo: num(data.fc_rest, 50),
                    run: {
                        max: runMax,
                        lthr: runLthr,
                        zones: data.run_zones ?? calcZonesFromLTHR(runLthr, runMax),
                        zonesMode: data.run_zones_mode ?? 'lthr',
                        thresholdPace: data.run_threshold_pace ?? '4:30',
                        paceZones: data.run_pace_zones ?? null,
                    },
                    bike: {
                        max: bikeMax,
                        lthr: bikeLthr,
                        zones: data.bike_zones ?? calcZonesFromLTHR(bikeLthr, bikeMax),
                        zonesMode: data.bike_zones_mode ?? 'lthr',
                        ftp: num(data.bike_ftp, 200),
                    },
                    intervalsId: data.intervals_athlete_id ?? "",
                    intervalsKey: data.intervals_api_key ?? "",
                    intervalsLastSynced: data.intervals_last_synced ?? null,
                    offsetCtl: num(data.user_settings?.offsetCtl, 0),
                });
            }

            return data;
        },
        staleTime: Infinity, // Solo cambia cuando el usuario lo edita
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (newSettings: any) => {
            const userId = await getCurrentUserId();
            if (!userId) throw new Error("No hay sesión activa");

            // Convert app-format settings to DB column names
            const dbPayload = {
                user_id: userId,
                gender: newSettings.gender,
                weight: newSettings.weight,
                fc_rest: newSettings.fcReposo,
                run_fc_max: newSettings.run?.max,
                run_lthr: newSettings.run?.lthr,
                run_zones: newSettings.run?.zones,
                run_zones_mode: newSettings.run?.zonesMode,
                run_threshold_pace: newSettings.run?.thresholdPace,
                run_pace_zones: newSettings.run?.paceZones,
                bike_fc_max: newSettings.bike?.max,
                bike_lthr: newSettings.bike?.lthr,
                bike_zones: newSettings.bike?.zones,
                bike_zones_mode: newSettings.bike?.zonesMode,
                bike_ftp: newSettings.bike?.ftp,
                intervals_athlete_id: newSettings.intervalsId,
                intervals_api_key: newSettings.intervalsKey,
                user_settings: {
                    ...(queryClient.getQueryData(["profile"]) as any)?.user_settings,
                    offsetCtl: parseFloat(newSettings.offsetCtl) || 0,
                },
            };

            const { error } = await supabase.from("profiles").upsert(
                dbPayload,
                { onConflict: "user_id" },
            );

            if (error) throw error;
            return newSettings;
        },
        onSuccess: (newSettings) => {
            // 1. Update Zustand store with the app-format settings
            updateSettings(newSettings);

            // 2. Update React Query cache with DB-format columns (matching what queryFn returns)
            //    This prevents the cache from being corrupted with app-format keys
            queryClient.setQueryData(["profile"], (oldData: any) => ({
                ...(oldData || {}),
                gender: newSettings.gender,
                weight: newSettings.weight,
                fc_rest: newSettings.fcReposo,
                run_fc_max: newSettings.run?.max,
                run_lthr: newSettings.run?.lthr,
                run_zones: newSettings.run?.zones,
                run_zones_mode: newSettings.run?.zonesMode,
                run_threshold_pace: newSettings.run?.thresholdPace,
                run_pace_zones: newSettings.run?.paceZones,
                bike_fc_max: newSettings.bike?.max,
                bike_lthr: newSettings.bike?.lthr,
                bike_zones: newSettings.bike?.zones,
                bike_zones_mode: newSettings.bike?.zonesMode,
                bike_ftp: newSettings.bike?.ftp,
                intervals_athlete_id: newSettings.intervalsId,
                intervals_api_key: newSettings.intervalsKey,
                intervals_last_synced: newSettings.intervalsLastSynced,
                user_settings: {
                    ...(oldData || {}).user_settings,
                    offsetCtl: parseFloat(newSettings.offsetCtl) || 0,
                },
            }));
            toast.success("¡Perfil fisiológico y claves guardadas con éxito!");
        },
        onError: (error) => {
            console.error("Error guardando perfil:", error);
            toast.error("Hubo un error al intentar guardar en la base de datos.");
        }
    });

    return { query, updateProfileMutation };
};
