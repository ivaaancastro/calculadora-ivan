import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Trash2 } from 'lucide-react';

/**
 * Menú «Más acciones» de una fila del historial (Capa 6, RF-D8; forma.md §4: la acción
 * destructiva va en un menú, no una papelera en cada fila).
 *
 * El menú se pinta en un portal con posición fija: la lista está virtualizada dentro de un
 * contenedor con scroll y un menú absoluto quedaría recortado en las últimas filas. Teclado: el
 * botón se abre con Enter o Espacio, el foco pasa a la primera opción, ↑/↓ recorren las opciones
 * y Esc o Tab cierran (Esc devuelve el foco al botón). Hacer scroll o tocar fuera también cierra.
 * Ningún clic ni tecla del menú llega a la fila (que abre la actividad).
 */
export const RowMenu = ({ name, onDelete }) => {
    const [pos, setPos] = useState(null);
    const btnRef = useRef(null);
    const menuRef = useRef(null);
    const open = pos != null;

    const close = (focusButton = true) => {
        setPos(null);
        if (focusButton) btnRef.current?.focus();
    };

    const toggle = (e) => {
        e.stopPropagation();
        if (open) return close();
        const r = btnRef.current.getBoundingClientRect();
        const below = window.innerHeight - r.bottom > 96;
        setPos({
            right: Math.max(8, window.innerWidth - r.right),
            ...(below ? { top: r.bottom + 4 } : { bottom: window.innerHeight - r.top + 4 }),
        });
    };

    useEffect(() => {
        if (!open) return undefined;
        menuRef.current?.querySelector('[role="menuitem"]')?.focus({ preventScroll: true });
        const onPointerDown = (e) => {
            if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setPos(null);
        };
        const dismiss = () => setPos(null);
        document.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('scroll', dismiss, true);
        window.addEventListener('resize', dismiss);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('scroll', dismiss, true);
            window.removeEventListener('resize', dismiss);
        };
    }, [open]);

    const onMenuKeyDown = (e) => {
        e.stopPropagation();
        const items = [...menuRef.current.querySelectorAll('[role="menuitem"]')];
        const i = items.indexOf(document.activeElement);
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'Tab') close(false);
        else if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus(); }
    };

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                data-history="menu"
                aria-label={`Más acciones de ${name}`}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={toggle}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-11 h-11 flex items-center justify-center rounded-full text-ink-4 hover:text-ink hover:bg-fill-5 aria-expanded:bg-fill-5 aria-expanded:text-ink active:scale-press transition-paint duration-fast ease-forma"
            >
                <MoreHorizontal size={18} aria-hidden="true" />
            </button>
            {open && createPortal(
                <div
                    ref={menuRef}
                    role="menu"
                    aria-label={`Acciones de ${name}`}
                    data-history="row-menu"
                    onKeyDown={onMenuKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    style={{ position: 'fixed', right: pos.right, top: pos.top, bottom: pos.bottom }}
                    className="z-50 min-w-[200px] p-1.5 rounded-xl bg-surface-card border border-line shadow-card motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150"
                >
                    <button
                        type="button"
                        role="menuitem"
                        data-history="delete"
                        onClick={() => {
                            close();
                            onDelete();
                        }}
                        className="w-full min-h-[44px] px-3 flex items-center gap-2.5 rounded-lg text-[14px] font-medium text-danger-ink hover:bg-danger/10 focus-visible:bg-danger/10 outline-none transition-colors"
                    >
                        <Trash2 size={15} aria-hidden="true" />
                        Eliminar actividad
                    </button>
                </div>,
                document.body,
            )}
        </>
    );
};
