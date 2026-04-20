/**
 * useAppStore.js — Estado global de la aplicación (Zustand).
 *
 * Almacena el estado que necesita ser compartido entre múltiples componentes
 * sin pasar props en cascada:
 *  - Rango de tiempo seleccionado en los gráficos
 *  - Settings fisiológicos del usuario (sincronizados desde Supabase al arrancar)
 *  - Estado de las operaciones de carga (subida CSV, sync Strava, sync Intervals)
 *  - Estado de la conexión con Strava
 */
import { create } from 'zustand';
import { calcZonesFromLTHR } from '../utils/tssEngine';

/**
 * Settings fisiológicos por defecto.
 * Estos valores se usan únicamente como fallback inicial antes de que
 * useProfileQuery cargue los datos reales desde Supabase.
 * Los valores numéricos son representativos de un atleta recreacional de nivel medio.
 */
const DEFAULT_SETTINGS = {
    gender:    'male',
    fcReposo:  50,     // Frecuencia cardíaca de reposo (ppm)
    weight:    70,     // Peso en kg
    run: {
        max:           200,      // FC máxima en carrera
        lthr:          178,      // FC en umbral láctico en carrera (Friel: 5-10bpm < FC max 10km)
        zones:         calcZonesFromLTHR(178, 200),
        zonesMode:     'lthr',   // 'lthr' | 'manual'
        thresholdPace: '4:30',   // Ritmo umbral (min/km)
        paceZones:     null,
    },
    bike: {
        max:     190,
        lthr:    168,
        zones:   calcZonesFromLTHR(168, 190),
        zonesMode: 'lthr',
        ftp:     200,   // Functional Threshold Power (W)
    },
    ta:            42,   // Constante de tiempo CTL (días) — estándar Banister
    tf:             7,   // Constante de tiempo ATL (días) — estándar Banister
    intervalsId:   '',   // Athlete ID de Intervals.icu
    intervalsKey:  '',   // API Key de Intervals.icu
    offsetCtl:      0,   // Ajuste manual al CTL calculado (para calibración)
};

export const useAppStore = create((set) => ({
    // ── Interfaz de usuario ──────────────────────────────────────────────────
    timeRange:    '30d',
    setTimeRange: (range) => set({ timeRange: range }),

    // ── Settings del usuario ─────────────────────────────────────────────────
    settings:       DEFAULT_SETTINGS,
    setSettings:    (newSettings)      => set({ settings: newSettings }),
    updateSettings: (partialSettings)  => set((state) => ({
        settings: { ...state.settings, ...partialSettings },
    })),

    // ── Estado de carga (CSV / sync) ─────────────────────────────────────────
    uploading:      false,
    uploadStatus:   null,
    setUploadState: (uploading, status = null) => set({ uploading, uploadStatus: status }),

    // ── Estado del Deep Sync de Strava (telemetría) ──────────────────────────
    isDeepSyncing:    false,
    deepSyncProgress: null,
    setDeepSyncState: (isSyncing, progress = null) => set({
        isDeepSyncing:    isSyncing,
        deepSyncProgress: progress,
    }),

    // ── Estado de la conexión con Strava ─────────────────────────────────────
    isStravaConnected:  false,
    setStravaConnected: (isConnected) => set({ isStravaConnected: isConnected }),
}));
