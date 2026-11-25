/**
 * Piel de las gráficas (spec-rediseno-02-c3-skin-dir). Desde la Capa 6 solo existe la piel 'v2':
 * los proveedores se conservan como envoltorios neutros para no cambiar la API de las pantallas.
 */
export const ChartSkinProvider = ({ children }) => children;

// eslint-disable-next-line react-refresh/only-export-components
export const useChartSkin = () => 'v2';

/** Envoltorio neutro (antes activaba la piel v2 según `data-ui`). */
export const AutoChartSkin = ({ children }) => children;
