import { useCallback, useEffect, useState } from 'react';

/**
 * Modo de interfaz (spec-rediseno-02-c3-skin, RF9): v1 o la vista previa v2.
 *
 * `index.html` aplica `data-ui="v2"` antes del primer pintado leyendo
 * `localStorage` y `VITE_UI`; este hook lee ese atributo y lo cambia en caliente
 * sin recargar ni remontar la app (la piel es CSS, así que la sesión y los datos
 * de React Query siguen intactos).
 *
 * Mismo patrón que `useTheme`: estado global fuera del hook y suscriptores.
 * En v1 el atributo queda **ausente**, no vale `"v1"` (M2).
 */

const UI_KEY = 'ui';
const V2 = 'v2';

const readInitialUi = () => {
  if (typeof document === 'undefined') return 'v1';
  return document.documentElement.dataset.ui === V2 ? V2 : 'v1';
};

let globalUi = readInitialUi();
const listeners = new Set();

const applyUi = (ui) => {
  const root = document.documentElement;
  if (ui === V2) {
    root.dataset.ui = V2;
  } else {
    delete root.dataset.ui;
  }
  try {
    // `'v1'` se guarda a propósito: así se puede apagar v2 en un despliegue
    // con VITE_UI=v2 (M1, localStorage gana al entorno).
    localStorage.setItem(UI_KEY, ui);
  } catch {
    /* storage no disponible (modo privado): la app sigue funcionando */
  }
};

export const useUiMode = () => {
  const [ui, setUiState] = useState(globalUi);

  useEffect(() => {
    listeners.add(setUiState);
    return () => listeners.delete(setUiState);
  }, []);

  const setUi = useCallback((next) => {
    const value = (typeof next === 'function' ? next(globalUi) : next) === V2 ? V2 : 'v1';
    globalUi = value;
    applyUi(value);
    listeners.forEach((listener) => listener(value));
  }, []);

  const toggleUi = useCallback(() => {
    setUi(globalUi === V2 ? 'v1' : V2);
  }, [setUi]);

  return { ui, isV2: ui === V2, setUi, toggleUi };
};
