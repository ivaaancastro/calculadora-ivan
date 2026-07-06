import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProfilePage } from '../../../src/components/pages/ProfilePage';
import { supabase } from '../../../src/supabase';

vi.mock('../../../src/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            signOut: vi.fn(),
        },
        from: vi.fn(),
        rpc: vi.fn(),
    }
}));

describe('ProfilePage - Integración', () => {
    let originalConfirm;
    let originalFetch;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock session
        supabase.auth.getSession.mockResolvedValue({
            data: { session: { user: { id: 'user123', email: 'test@example.com' } } },
            error: null
        });

        // Mock fetch de perfiles
        supabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'user123',
                            user_settings: { fcReposo: 50, offsetCtl: 0 },
                            strava_access_token: 'fake-strava-token',
                            strava_athlete_id: '12345'
                        },
                        error: null
                    })
                }),
                single: vi.fn().mockResolvedValue({
                    data: { strava_access_token: 'fake-strava-token' }
                })
            }),
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null })
            })
        });

        supabase.rpc.mockResolvedValue({ error: null });

        // Mock window.confirm
        originalConfirm = window.confirm;
        window.confirm = vi.fn().mockReturnValue(true);

        // Mock global fetch para llamadas a Strava (deauthorize)
        originalFetch = global.fetch;
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({})
        });
    });

    afterEach(() => {
        window.confirm = originalConfirm;
        global.fetch = originalFetch;
    });

    it('debería revocar el acceso a Strava y llamar a delete_user al eliminar cuenta', async () => {
        const user = userEvent.setup();
        const { container } = render(<ProfilePage currentSettings={{ fcReposo: 50, ftp: 200, lthr: 170, max: 190 }} activities={[]} />);
        console.log("RENDERED HTML:", container.innerHTML);

        // Ir a la pestaña de Seguridad y Datos
        const seguridadTab = screen.getByText('Seguridad y Datos').closest('button');
        await user.click(seguridadTab);

        // Esperar a que cargue el perfil (aparece el botón de Eliminar Cuenta)
        const deleteBtn = await screen.findByText('Eliminar Cuenta');
        await user.click(deleteBtn.closest('button'));

        // Verifica que se confirma el borrado
        expect(window.confirm).toHaveBeenCalled();

        await waitFor(() => {
            // Verifica que se llamó a deauthorize a Strava
            expect(global.fetch).toHaveBeenCalledWith('https://www.strava.com/oauth/deauthorize', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ access_token: 'fake-strava-token' })
            }));

            // Verifica que se llamó a supabase.rpc('delete_user')
            expect(supabase.rpc).toHaveBeenCalledWith('delete_user');
            
            // Verifica que hace signOut
            expect(supabase.auth.signOut).toHaveBeenCalled();
        });
    });
});
