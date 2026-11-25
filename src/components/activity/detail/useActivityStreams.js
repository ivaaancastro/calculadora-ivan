import { useEffect, useState, useRef } from 'react';
import { sportOf } from '../../../utils/sport';

/** Carga los streams de la actividad (de `streams_data` o vía `fetchStreams`). */
export const useActivityStreams = (activity, fetchStreams) => {
    const [streams, setStreams] = useState(null);
    const [loadingStreams, setLoadingStreams] = useState(true);
    const fetchedRef = useRef(null);

    useEffect(() => {
        if (!activity) return;
        if (fetchedRef.current !== activity.id) {
            fetchedRef.current = activity.id;

            const hasEssentialStreams = activity.streams_data &&
                activity.streams_data.latlng &&
                (sportOf(activity.type) === 'bike' ? activity.streams_data.watts : true) &&
                activity.streams_data.cadence;

            if (activity.streams_data && hasEssentialStreams) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setStreams(activity.streams_data);
                setLoadingStreams(false);
            } else if (activity.strava_id && fetchStreams) {
                setLoadingStreams(true);
                fetchStreams(activity.id, activity.strava_id).then(data => {
                    setStreams(data);
                    setLoadingStreams(false);
                });
            } else {
                setStreams(activity.streams_data || null);
                setLoadingStreams(false);
            }
        }
    }, [activity, fetchStreams]);

    return { streams, loadingStreams };
};
