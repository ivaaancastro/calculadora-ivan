import { create } from 'zustand';
import { calcZonesFromLTHR } from '../utils/tssEngine';

const initialSettings = {
    gender: "male",
    fcReposo: 50,
    weight: 70,
    run: { max: 200, lthr: 178, zones: calcZonesFromLTHR(178, 200), zonesMode: 'lthr', thresholdPace: '4:30', paceZones: null },
    bike: { max: 190, lthr: 168, zones: calcZonesFromLTHR(168, 190), zonesMode: 'lthr', ftp: 200 },
    ta: 42,
    tf: 7,
    intervalsId: "",
    intervalsKey: "",
    offsetCtl: 0,
};

export const useAppStore = create((set) => ({
    // UI State
    timeRange: '30d',
    setTimeRange: (range) => set({ timeRange: range }),

    // User Settings
    settings: initialSettings,
    setSettings: (newSettings) => set({ settings: newSettings }),
    updateSettings: (partialSettings) => set((state) => ({ settings: { ...state.settings, ...partialSettings } })),

    // Sync / Upload Status
    uploading: false,
    uploadStatus: null,
    setUploadState: (uploading, status = null) => set({ uploading, uploadStatus: status }),

    // Deep Sync State
    isDeepSyncing: false,
    deepSyncProgress: null,
    setDeepSyncState: (isSyncing, progress = null) => set({ isDeepSyncing: isSyncing, deepSyncProgress: progress }),

    // Strava State
    isStravaConnected: false,
    setStravaConnected: (isConnected) => set({ isStravaConnected: isConnected }),
}));
