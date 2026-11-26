/**
 * useAppStore.ts — Estado global de la aplicación (Zustand).
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
export interface UserZone {
  min: number;
  max: number;
}

export interface RunSettings {
  max: number;
  lthr: number;
  zones: UserZone[];
  zonesMode: 'lthr' | 'manual';
  thresholdPace: string;
  paceZones: unknown;
}

export interface BikeSettings {
  max: number;
  lthr: number;
  zones: UserZone[];
  zonesMode: 'lthr' | 'manual';
  ftp: number;
}

export interface SwimSettings {
  max: number;
  lthr: number;
  zones: UserZone[];
  zonesMode: 'lthr' | 'manual';
}

export interface UserSettings {
  fullName: string;
  email: string;
  avatarUrl: string;
  gender: 'male' | 'female';
  fcReposo: number;
  weight: number;
  run: RunSettings;
  bike: BikeSettings;
  swim?: SwimSettings;
  ta: number;
  tf: number;
  intervalsId: string;
  intervalsKey: string;
  offsetCtl: number;
}

export interface AppStoreState {
  // ── Interfaz de usuario ──────────────────────────────────────────────────
  timeRange: string;
  setTimeRange: (range: string) => void;

  // ── Settings del usuario ─────────────────────────────────────────────────
  settings: UserSettings;
  setSettings: (newSettings: UserSettings) => void;
  updateSettings: (partialSettings: Partial<UserSettings>) => void;

  // ── Estado de carga (CSV / sync) ─────────────────────────────────────────
  uploading: boolean;
  uploadStatus: string | null;
  setUploadState: (uploading: boolean, status?: string | null) => void;

  // ── Estado del Deep Sync de Strava (telemetría) ──────────────────────────
  isDeepSyncing: boolean;
  deepSyncProgress: { current: number; total: number } | null;
  setDeepSyncState: (isSyncing: boolean, progress?: { current: number; total: number } | null) => void;

  // ── Estado de la conexión con Strava ─────────────────────────────────────
  isStravaConnected: boolean;
  setStravaConnected: (isConnected: boolean) => void;

  // ── Reset Global (Logout) ────────────────────────────────────────────────
  resetStore: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  fullName: '',
  email: '',
  avatarUrl: '',
  gender: 'male',
  fcReposo: 50,
  weight: 70,
  run: {
    max: 200,
    lthr: 178,
    zones: calcZonesFromLTHR(178, 200),
    zonesMode: 'lthr',
    thresholdPace: '4:30',
    paceZones: null,
  },
  bike: {
    max: 190,
    lthr: 168,
    zones: calcZonesFromLTHR(168, 190),
    zonesMode: 'lthr',
    ftp: 200,
  },
  ta: 42,
  tf: 7,
  intervalsId: '',
  intervalsKey: '',
  offsetCtl: 0,
};

export const useAppStore = create<AppStoreState>((set) => ({
  // ── Interfaz de usuario ──────────────────────────────────────────────────
  timeRange: '30d',
  setTimeRange: (range) => set({ timeRange: range }),

  // ── Settings del usuario ─────────────────────────────────────────────────
  settings: DEFAULT_SETTINGS,
  setSettings: (newSettings) => set({ settings: newSettings }),
  updateSettings: (partialSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...partialSettings },
    })),

  // ── Estado de carga (CSV / sync) ─────────────────────────────────────────
  uploading: false,
  uploadStatus: null,
  setUploadState: (uploading, status = null) => set({ uploading, uploadStatus: status }),

  // ── Estado del Deep Sync de Strava (telemetría) ──────────────────────────
  isDeepSyncing: false,
  deepSyncProgress: null,
  setDeepSyncState: (isSyncing, progress = null) => set({
    isDeepSyncing: isSyncing,
    deepSyncProgress: progress,
  }),

  // ── Estado de la conexión con Strava ─────────────────────────────────────
  isStravaConnected: false,
  setStravaConnected: (isConnected) => set({ isStravaConnected: isConnected }),

  // ── Reset Global (Logout) ────────────────────────────────────────────────
  resetStore: () => set({
    timeRange: '30d',
    settings: DEFAULT_SETTINGS,
    uploading: false,
    uploadStatus: null,
    isDeepSyncing: false,
    deepSyncProgress: null,
    isStravaConnected: false,
  }),
}));
