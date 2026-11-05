import { describe, it, expect } from 'vitest';
import { useAppStore } from '../../../src/store/useAppStore';

describe('store - useAppStore (Zustand)', () => {
    it('debe tener valores iniciales por defecto', () => {
        const state = useAppStore.getState();
        expect(state.timeRange).toBe('30d');
        expect(state.settings).toBeDefined();
        expect(state.uploading).toBe(false);
        expect(state.uploadStatus).toBeNull();
        expect(state.isDeepSyncing).toBe(false);
        expect(state.deepSyncProgress).toBeNull();
        expect(state.isStravaConnected).toBe(false);
    });

    it('debe actualizar timeRange con setTimeRange', () => {
        useAppStore.setState({ timeRange: '7d' });
        expect(useAppStore.getState().timeRange).toBe('7d');
        useAppStore.setState({ timeRange: '30d' });
    });

    it('debe actualizar settings con setSettings', () => {
        const newSettings = { gender: 'female', weight: 60 };
        useAppStore.setState({ settings: newSettings });
        expect(useAppStore.getState().settings.gender).toBe('female');
        expect(useAppStore.getState().settings.weight).toBe(60);
    });

    it('debe hacer merge parcial con updateSettings', () => {
        useAppStore.setState({ settings: { gender: 'male', weight: 70 } });
        useAppStore.getState().updateSettings({ weight: 80 });
        const state = useAppStore.getState();
        expect(state.settings.weight).toBe(80);
        expect(state.settings.gender).toBe('male');
    });

    it('debe actualizar estado de carga con setUploadState', () => {
        useAppStore.setState({ uploading: true, uploadStatus: 'subiendo' });
        const state = useAppStore.getState();
        expect(state.uploading).toBe(true);
        expect(state.uploadStatus).toBe('subiendo');
    });

    it('debe actualizar estado de deep sync con setDeepSyncState', () => {
        useAppStore.setState({ isDeepSyncing: true, deepSyncProgress: 50 });
        const state = useAppStore.getState();
        expect(state.isDeepSyncing).toBe(true);
        expect(state.deepSyncProgress).toBe(50);
    });

    it('debe actualizar conexión de Strava con setStravaConnected', () => {
        useAppStore.setState({ isStravaConnected: true });
        expect(useAppStore.getState().isStravaConnected).toBe(true);
    });

    it('debe resetear todo el store con resetStore', () => {
        // Modificar varios campos
        useAppStore.setState({
            timeRange: '90d',
            uploading: true,
            uploadStatus: 'error',
            isDeepSyncing: true,
            deepSyncProgress: 80,
            isStravaConnected: true,
            settings: { gender: 'female', weight: 999 },
        });

        useAppStore.getState().resetStore();

        const state = useAppStore.getState();
        expect(state.timeRange).toBe('30d');
        expect(state.uploading).toBe(false);
        expect(state.uploadStatus).toBeNull();
        expect(state.isDeepSyncing).toBe(false);
        expect(state.deepSyncProgress).toBeNull();
        expect(state.isStravaConnected).toBe(false);
        expect(state.settings).toBeDefined();
    });
});
