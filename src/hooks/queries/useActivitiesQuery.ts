import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";

const LIGHT_COLS = "id,created_at,date,type,duration,distance,hr_avg,calories,effort_perceived,notes,user_id,strava_id,elevation_gain,watts_avg,name,description,speed_avg";

export const useActivitiesQuery = () => {
    const queryClient = useQueryClient();

    // Fetch activities (light data first)
    const query = useQuery({
        queryKey: ["activities"],
        queryFn: async () => {
            const { data: baseData, error } = await supabase
                .from("activities")
                .select(LIGHT_COLS);

            if (error) throw error;

            // Ensure immediate sorting
            const sorted = (baseData || [])
                .map((a: any) => ({ ...a, dateObj: new Date(a.date), streams_data: null }))
                .sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime());

            // Trigger lazy load of streams in background after a slight delay
            setTimeout(async () => {
                try {
                    const cutoff = new Date();
                    cutoff.setDate(cutoff.getDate() - 95);

                    const { data: streamsData } = await supabase
                        .from("activities")
                        .select("id,streams_data")
                        .gte("date", cutoff.toISOString().split("T")[0])
                        .not("streams_data", "is", null);

                    if (streamsData && streamsData.length > 0) {
                        const streamMap = new Map();
                        streamsData.forEach((s) => streamMap.set(s.id, s.streams_data));

                        queryClient.setQueryData(["activities"], (oldData: any) => {
                            if (!oldData) return oldData;
                            return oldData.map((a: any) =>
                                streamMap.has(a.id) ? { ...a, streams_data: streamMap.get(a.id) } : a
                            );
                        });
                    }
                } catch (e) {
                    console.warn("Background streams fetch failed", e);
                }
            }, 500);

            return sorted;
        },
        staleTime: 1000 * 60 * 30, // Conserve memory for 30 minutes, prevent excessive querying
    });

    const deleteActivityMutation = useMutation({
        mutationFn: async (id) => {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) throw new Error("No session");

            const { error } = await supabase
                .from("activities")
                .delete()
                .eq("id", id)
                .eq("user_id", userId);

            if (error) throw error;
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData(["activities"], (old: any) =>
                old ? old.filter((a: any) => a.id !== id) : []
            );
        }
    });

    const clearDbMutation = useMutation({
        mutationFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) throw new Error("No session");

            const { error } = await supabase
                .from("activities")
                .delete()
                .eq("user_id", userId);

            if (error) throw error;
            return true;
        },
        onSuccess: () => {
            queryClient.setQueryData(["activities"], []);
        }
    });

    return { query, deleteActivityMutation, clearDbMutation };
};
