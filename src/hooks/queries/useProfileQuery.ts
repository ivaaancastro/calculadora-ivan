import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";
import { useAppStore } from "../../store/useAppStore";
import { calcZonesFromLTHR } from "../../utils/tssEngine";
import toast from "react-hot-toast";

const getCurrentUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
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
                updateSettings({
                    gender: data.gender || "male",
                    weight: Number(data.weight) || 70,
                    fcReposo: Number(data.fc_rest) || 50,
                    run: {
                        max: Number(data.run_fc_max) || 200,
                        lthr: Number(data.run_lthr) || 178,
                        zones: data.run_zones || calcZonesFromLTHR(Number(data.run_lthr) || 178, Number(data.run_fc_max) || 200),
                        zonesMode: data.run_zones_mode || 'lthr',
                        thresholdPace: data.run_threshold_pace || '4:30',
                        paceZones: data.run_pace_zones || null,
                    },
                    bike: {
                        max: Number(data.bike_fc_max) || 190,
                        lthr: Number(data.bike_lthr) || 168,
                        zones: data.bike_zones || calcZonesFromLTHR(Number(data.bike_lthr) || 168, Number(data.bike_fc_max) || 190),
                        zonesMode: data.bike_zones_mode || 'lthr',
                        ftp: Number(data.bike_ftp) || 200,
                    },
                    intervalsId: data.intervalsId || "",
                    intervalsKey: data.intervalsKey || "",
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

            const { error } = await supabase.from("profiles").upsert(
                {
                    user_id: userId,
                    weight: newSettings.weight,
                    fc_rest: newSettings.fcReposo,
                    run_fc_max: newSettings.run.max,
                    run_lthr: newSettings.run.lthr,
                    run_zones: newSettings.run.zones,
                    run_zones_mode: newSettings.run.zonesMode,
                    run_threshold_pace: newSettings.run.thresholdPace,
                    run_pace_zones: newSettings.run.paceZones,
                    bike_fc_max: newSettings.bike.max,
                    bike_lthr: newSettings.bike.lthr,
                    bike_zones: newSettings.bike.zones,
                    bike_zones_mode: newSettings.bike.zonesMode,
                    bike_ftp: newSettings.bike.ftp,
                    intervalsId: newSettings.intervalsId,
                    intervalsKey: newSettings.intervalsKey,
                },
                { onConflict: "user_id" },
            );

            if (error) throw error;
            return newSettings;
        },
        onSuccess: (newSettings) => {
            updateSettings(newSettings);
            queryClient.setQueryData(["profile"], (oldData: any) => ({ ...(oldData || {}), ...newSettings }));
            toast.success("¡Perfil fisiológico y claves guardadas con éxito!");
        },
        onError: (error) => {
            console.error("Error guardando perfil:", error);
            toast.error("Hubo un error al intentar guardar en la base de datos.");
        }
    });

    return { query, updateProfileMutation };
};
