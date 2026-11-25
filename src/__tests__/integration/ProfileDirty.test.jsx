/** @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ProfilePage } from '../../components/pages/ProfilePage';

vi.mock('../../supabase', () => ({ supabase: { auth: {}, from: vi.fn(), rpc: vi.fn() } }));


const settings = { fcReposo: 50, weight: 70, run: { lthr: 170, max: 190 }, bike: { lthr: 160, max: 185 } };

describe('ProfilePage — cambios sin guardar', () => {
    
    it('avisa al editar un campo y no antes', async () => {
        const user = userEvent.setup();
        render(<ProfilePage currentSettings={settings} currentMetrics={{ ctl: 40, rawCtl: 40 }} activities={[]} />);
        const save = document.querySelector('[data-profile="save"]');
        expect(save.dataset.dirty).toBe('false');
        expect(screen.queryByText('Cambios sin guardar')).toBeNull();
        await user.type(screen.getByPlaceholderText('Tu nombre'), 'Ana');
        expect(save.dataset.dirty).toBe('true');
        expect(screen.getByText('Cambios sin guardar')).toBeTruthy();
    });
});
