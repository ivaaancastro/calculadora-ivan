/** @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmDeleteActivityModal } from '../../components/activity/ConfirmDeleteActivityModal';

const activity = { id: 'a1', name: 'Rodaje suave', date: '2026-06-10T08:00:00Z' };

describe('ConfirmDeleteActivityModal', () => {
  it('cerrado sin actividad', () => {
    render(<ConfirmDeleteActivityModal activity={null} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('es un diálogo con título, nombre y foco inicial en Cancelar', () => {
    render(<ConfirmDeleteActivityModal activity={activity} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    const dlg = screen.getByRole('dialog', { name: '¿Eliminar actividad?' });
    expect(dlg).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Rodaje suave')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    expect(screen.queryByText(/Strava/)).toBeNull();
  });

  it('avisa de Strava solo con strava_id', () => {
    render(<ConfirmDeleteActivityModal activity={{ ...activity, strava_id: 123 }} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/volver a importarse/)).toBeTruthy();
  });

  it('Esc y Cancelar cancelan; tocar fuera no; Eliminar confirma', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<ConfirmDeleteActivityModal activity={activity} onConfirm={onConfirm} onCancel={onCancel} />);
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('dialog').parentElement);
    expect(onCancel).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('ocupado: botones deshabilitados', () => {
    render(<ConfirmDeleteActivityModal activity={activity} busy onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Eliminando…' })).toBeDisabled();
  });

  it('Tab no sale del diálogo', async () => {
    const user = userEvent.setup();
    render(<><button>fuera</button><ConfirmDeleteActivityModal activity={activity} onConfirm={vi.fn()} onCancel={vi.fn()} /></>);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  });
});
