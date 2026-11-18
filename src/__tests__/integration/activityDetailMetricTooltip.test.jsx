/** @vitest-environment jsdom */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { MetricTooltip } from '../../components/ui/MetricTooltip.jsx';

describe('integration/activityDetailMetricTooltip', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('abre el popover al pulsar una métrica y muestra su explicación', () => {
    render(
      <MetricTooltip metricId="tss">
        <span data-testid="stat">Carga 45 TSS</span>
      </MetricTooltip>
    );

    fireEvent.click(screen.getByTestId('stat'));

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Carga (TSS)')).toBeInTheDocument();
    expect(screen.getByText(/La Carga de Entrenamiento/)).toBeInTheDocument();
  });

  it('cierra el popover al pulsar Escape', () => {
    render(
      <MetricTooltip metricId="tss">
        <span data-testid="stat">Carga 45 TSS</span>
      </MetricTooltip>
    );

    fireEvent.click(screen.getByTestId('stat'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('cierra el popover al hacer clic fuera del disparador y del popover', () => {
    render(
      <MetricTooltip metricId="tss">
        <span data-testid="stat">Carga 45 TSS</span>
      </MetricTooltip>
    );

    fireEvent.click(screen.getByTestId('stat'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('activa el disparador con Enter (accesibilidad por teclado)', () => {
    render(
      <MetricTooltip metricId="np">
        <span data-testid="stat">NP 280 W</span>
      </MetricTooltip>
    );

    const trigger = screen.getByRole('button', { name: /más información sobre np/i });
    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('NP')).toBeInTheDocument();
  });

  it('usa label y description directos cuando no hay metricId', () => {
    render(
      <MetricTooltip label="Métrica personalizada" description="Explicación de prueba.">
        <span data-testid="stat">Valor</span>
      </MetricTooltip>
    );

    fireEvent.click(screen.getByTestId('stat'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Métrica personalizada')).toBeInTheDocument();
    expect(screen.getByText('Explicación de prueba.')).toBeInTheDocument();
  });
});
