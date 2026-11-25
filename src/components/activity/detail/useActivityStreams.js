import { useEffect, useState, useRef } from 'react';

/**
 * Carga los streams de la actividad (BUG-13).
 *
 * - Si la actividad ya trae `streams_data`, se usan tal cual.
 * - Si no, se piden solo los de esa actividad con `fetchStreams(id, stravaId)`, que mira primero
 *   Supabase (`select streams_data where id = X`) y, si no hay, Strava (cuando hay `strava_id`).
 * - Se reevalúa cuando llegan los `streams_data` más tarde (carga en segundo plano o la propia
 *   petición), no solo al cambiar de actividad. La clave id + «trae streams» evita repetir la
 *   petición en cada render.
 */
export const useActivityStreams = (activity, fetchStreams) => {
    const [streams, setStreams] = useState(null);
    const [loadingStreams, setLoadingStreams] = useState(true);
    const keyRef = useRef(null);

    const id = activity?.id;
    const streamsData = activity?.streams_data || null;
    const stravaId = activity?.strava_id || null;

    useEffect(() => {
        if (id == null) return;
        const key = `${id}:${streamsData ? 'streams' : 'none'}`;
        if (keyRef.current === key) return;
        keyRef.current = key;

        if (streamsData) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStreams(streamsData);
            setLoadingStreams(false);
            return;
        }
        if (!fetchStreams) {
            setStreams(null);
            setLoadingStreams(false);
            return;
        }

        let cancelled = false;
        setStreams(null);
        setLoadingStreams(true);
        Promise.resolve(fetchStreams(id, stravaId))
            .catch(() => null)
            .then((data) => {
                if (cancelled) return;
                setStreams(data || null);
                setLoadingStreams(false);
            });
        return () => {
            cancelled = true;
            // Si el efecto se desmonta o cambia la clave antes de responder, se permite reintentar.
            if (keyRef.current === key) keyRef.current = null;
        };
    }, [id, streamsData, stravaId, fetchStreams]);

    return { streams, loadingStreams };
};
