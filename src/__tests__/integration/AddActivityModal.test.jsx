import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddActivityModal from '../../../src/components/modals/AddActivityModal';
import { supabase } from '../../../src/supabase';
import toast from 'react-hot-toast';

// Mockeamos Supabase
vi.mock('../../../src/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
        },
        from: vi.fn(),
    }
}));

// Mockeamos react-hot-toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

describe('AddActivityModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Sesión por defecto válida
        supabase.auth.getSession.mockResolvedValue({
            data: { session: { user: { id: 'user123' } } },
            error: null
        });

        // Mock insert exitoso por defecto
        const mockInsert = vi.fn().mockResolvedValue({ error: null });
        supabase.from.mockReturnValue({ insert: mockInsert });
    });

    it('no debería renderizarse si isOpen es false', () => {
        const { container } = render(
            <AddActivityModal isOpen={false} onClose={mockOnClose} onSave={mockOnSave} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('debería bloquear el guardado si se introducen valores negativos', async () => {
        const user = userEvent.setup();
        render(<AddActivityModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);
        
        // Rellenar duración negativa
        const durationInput = screen.getByLabelText(/Duración \(min\)/i);
        await user.clear(durationInput);
        await user.type(durationInput, '-10');

        // Intentar guardar
        const submitBtn = screen.getByRole('button', { name: /Guardar Actividad/i });
        await user.click(submitBtn);

        // Al usar HTML5 required/min, el navegador previene el submit automáticamente en un entorno real.
        // Solo verificamos que Supabase NO haya sido llamado
        await waitFor(() => {
            expect(supabase.from).not.toHaveBeenCalled();
        });
    });

    it('debería guardar la actividad si los datos son correctos', async () => {
        const user = userEvent.setup();
        
        const mockInsert = vi.fn().mockResolvedValue({ error: null });
        supabase.from.mockReturnValue({ insert: mockInsert });

        render(<AddActivityModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);
        
        const durationInput = screen.getByLabelText(/Duración \(min\)/i);
        await user.type(durationInput, '60');
        
        console.log("DURATION INPUT VALUE AFTER TYPE:", durationInput.value);

        const submitBtn = screen.getByRole('button', { name: /Guardar Actividad/i });
        await user.click(submitBtn);

        await waitFor(() => {
            if (toast.error && toast.error.mock.calls.length > 0) {
                console.error("Toast error called with:", toast.error.mock.calls);
            }
            expect(mockInsert).toHaveBeenCalledTimes(1);
            expect(mockInsert).toHaveBeenCalledWith([
                expect.objectContaining({
                    user_id: 'user123',
                    duration: 60,
                    type: 'Carrera'
                })
            ]);
            expect(mockOnSave).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
            
            expect(toast.success).toHaveBeenCalledWith('Actividad generada exitosamente.');
        });
    });
});
