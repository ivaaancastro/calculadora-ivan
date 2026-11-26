/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { calcZonesFromFCMax, calcPaceZones } from '../../components/pages/profile/zonesCalc';
import { GeneralSection } from '../../components/pages/profile/GeneralSection';
import { ZonesSection } from '../../components/pages/profile/ZonesSection';
import { IntegrationsSection } from '../../components/pages/profile/IntegrationsSection';
import { SecuritySection } from '../../components/pages/profile/SecuritySection';

const noop = () => {};
const form = {
  fullName: 'Ana', email: 'a@b.c', weight: 60, fcReposo: 50, intervalsId: '', intervalsKey: '',
  run: { zonesMode: 'custom', lthr: 170, max: 190, thresholdPace: '4:30', paceZones: calcPaceZones('4:30'), zones: Array.from({ length: 7 }, (_, i) => ({ min: i, max: i + 1 })) },
  bike: { zonesMode: 'custom', lthr: 160, max: 185, ftp: 200, zones: Array.from({ length: 7 }, (_, i) => ({ min: i, max: i + 1 })) },
};

describe('zonesCalc', () => {
  it('calcula 7 zonas FCmax acabando en el máximo', () => {
    const z = calcZonesFromFCMax(200);
    expect(z).toHaveLength(7);
    expect(z[0].min).toBe(0);
    expect(z[6].max).toBe(200);
  });
  it('calcula 7 zonas de ritmo', () => {
    expect(calcPaceZones('4:30')).toHaveLength(7);
  });
});

describe('secciones de Ajustes', () => {
  it('General muestra nombre y sin conmutador de piel', () => {
    render(<GeneralSection formData={form} isUploadingAvatar={false} handleAvatarUpload={noop} handleChange={noop} targetCtl={null} setTargetCtl={noop} />);
    expect(screen.getByText('Datos Personales')).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'Vista previa v2' })).not.toBeInTheDocument();
  });
  it('Zonas muestra el escáner y las zonas de carrera', () => {
    render(<ZonesSection formData={form} activeTab="run" setActiveTab={noop} isScanning={false} pureActs={[]} handleAutoDetectLTHR={noop} handleChange={noop} handleZoneChange={noop} handleZonesMode={noop} />);
    expect(screen.getByText('Auto-Detectar LTHR')).toBeInTheDocument();
    expect(screen.getByText('Zonas de Carrera')).toBeInTheDocument();
  });
  it('Integraciones indica no configurado', () => {
    render(<IntegrationsSection formData={form} isSyncingIntervals={false} intervalsSyncProgress="" handleSyncIntervals={noop} syncPreview={null} setSyncPreview={noop} handleApplySyncedProfile={noop} handleChange={noop} />);
    expect(screen.getByText('No configurado')).toBeInTheDocument();
  });
  it('Seguridad dispara borrar actividades', () => {
    const onClearDb = vi.fn();
    render(<SecuritySection newPassword="" setNewPassword={noop} isUpdatingPwd={false} handleUpdatePassword={noop} pureActs={[]} stravaActs={[]} syncPct={0} onDeepSync={noop} isDeepSyncing={false} onClearDb={onClearDb} handleDeleteAccount={noop} isDeletingAccount={false} />);
    screen.getByText('Borrar Actividades').click();
    expect(onClearDb).toHaveBeenCalled();
  });
});
