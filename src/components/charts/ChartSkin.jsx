import { createContext, useContext } from 'react';

/**
 * Piel de las gráficas (spec-rediseno-02-c3-skin-dir): 'v1' (por defecto) o 'v2'.
 * Solo Dashboard y Calendario la activan; el resto de pantallas siguen en v1.
 */
const ChartSkinContext = createContext('v1');

export const ChartSkinProvider = ({ skin = 'v1', children }) => (
  <ChartSkinContext.Provider value={skin}>{children}</ChartSkinContext.Provider>
);

// eslint-disable-next-line react-refresh/only-export-components
export const useChartSkin = () => useContext(ChartSkinContext);
