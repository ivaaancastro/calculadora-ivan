/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InfoTooltip } from '../../components/ui/InfoTooltip.jsx';
import { INFO_TOOLTIP, infoBubbleClass } from '../../components/ui/infoTooltipClasses.js';

const isOpen = () => screen.getByRole('tooltip', { hidden: true }).className.split(' ').includes('visible');

describe('ui/InfoTooltip', () => {
  it('copia la receta de la burbuja con tokens exactos', () => {
    expect(INFO_TOOLTIP.bubble).toContain('invisible group-hover:visible');
    expect(INFO_TOOLTIP.bubble).toContain('bg-tooltip-info backdrop-blur-md text-tooltip-info-ink');
    expect(INFO_TOOLTIP.bubble).toContain('border border-tooltip-info-edge');
    expect(INFO_TOOLTIP.arrow).toContain('border-t-tooltip-info-arrow');
  });

  it('A11Y-2: es un botón con nombre accesible descrito por la burbuja', () => {
    render(<InfoTooltip text="Hola" />);
    const btn = screen.getByRole('button', { name: 'Más información' });
    expect(btn).toHaveAttribute('type', 'button');
    const tip = screen.getByRole('tooltip', { hidden: true });
    expect(btn).toHaveAttribute('aria-describedby', tip.id);
    expect(tip).toHaveTextContent('Hola');
    expect(btn.querySelector('svg')).toHaveAttribute('width', '14');
  });

  it('acepta una etiqueta propia', () => {
    render(<InfoTooltip text="x" label="Qué es el eFTP" />);
    expect(screen.getByRole('button', { name: 'Qué es el eFTP' })).toBeInTheDocument();
  });

  it('zona táctil ≥ 24 px con ratón y 44 px en pantallas táctiles', () => {
    expect(INFO_TOOLTIP.trigger).toContain('w-6 h-6');
    expect(INFO_TOOLTIP.trigger).toContain('[@media(pointer:coarse)]:w-11 [@media(pointer:coarse)]:h-11');
    expect(INFO_TOOLTIP.trigger).toContain('focus-visible:ring-2');
  });

  it('se abre con un clic o toque y se cierra con otro, fuera o con Escape', async () => {
    const user = userEvent.setup();
    render(<div><InfoTooltip text="Hola" /><p>fuera</p></div>);
    const btn = screen.getByRole('button', { name: 'Más información' });
    await user.click(btn);
    expect(isOpen()).toBe(true);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    await user.click(btn);
    expect(isOpen()).toBe(false);
    await user.click(btn);
    fireEvent.pointerDown(screen.getByText('fuera'));
    expect(isOpen()).toBe(false);
    await user.click(btn);
    await user.keyboard('{Escape}');
    expect(isOpen()).toBe(false);
  });

  it('se abre al llegar con el teclado y se cierra al salir con Tab', async () => {
    const user = userEvent.setup();
    render(<div><InfoTooltip text="Hola" /><button type="button">otro</button></div>);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Más información' })).toHaveFocus();
    expect(isOpen()).toBe(true);
    await user.tab();
    expect(isOpen()).toBe(false);
  });

  it('abierta cambia solo la visibilidad y la opacidad', () => {
    expect(infoBubbleClass(false)).toBe(INFO_TOOLTIP.bubble);
    const open = infoBubbleClass(true).split(' ');
    expect(open).toContain('visible');
    expect(open).toContain('opacity-100');
    expect(open).not.toContain('invisible');
    expect(open).not.toContain('opacity-0');
    expect(open.length).toBe(INFO_TOOLTIP.bubble.split(' ').length);
  });
});
