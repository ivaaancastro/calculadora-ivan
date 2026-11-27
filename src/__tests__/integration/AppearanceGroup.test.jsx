// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppearanceGroup } from '../../components/pages/profile/AppearanceGroup';

const option = (name) => screen.getByRole('button', { name });
const pressed = (name) => option(name).getAttribute('aria-pressed');

describe('Ajustes: Apariencia', () => {
    beforeEach(() => localStorage.clear());

    it('ofrece Sistema, Claro y Oscuro, y aplica la elección al instante', async () => {
        render(<AppearanceGroup />);
        expect(pressed('Sistema')).toBe('true');
        await userEvent.click(option('Oscuro'));
        expect(pressed('Oscuro')).toBe('true');
        expect(localStorage.getItem('theme')).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        await userEvent.click(option('Sistema'));
        expect(localStorage.getItem('theme')).toBeNull();
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('sus botones no envían formularios', () => {
        render(<AppearanceGroup />);
        for (const name of ['Sistema', 'Claro', 'Oscuro']) expect(option(name)).toHaveAttribute('type', 'button');
    });
});
