import { createContext, useContext } from 'react';
import { useUiMode } from '../../hooks/useUiMode';

/**
 * Piel de las gráficas (spec-rediseno-02-c3-skin-dir): 'v1' (por defecto) o 'v2'.
 * Las pantallas con `data-skin` la activan (Dashboard y Calendario con ChartSkinProvider, el resto con AutoChartSkin).
 */
const ChartSkinContext = createContext('v1');

export const ChartSkinProvider = ({ skin = 'v1', children }) => (
  <ChartSkinContext.Provider value={skin}>{children}</ChartSkinContext.Provider>
);

// eslint-disable-next-line react-refresh/only-export-components
export const useChartSkin = () => useContext(ChartSkinContext);

/** Activa la piel de gráficas v2 cuando `data-ui="v2"` está activo (sin añadir nodos al DOM). */
export const AutoChartSkin = ({ children }) => {
  const { isV2 } = useUiMode();
  return <ChartSkinProvider skin={isV2 ? 'v2' : 'v1'}>{children}</ChartSkinProvider>;
};
