import { useTheme } from '../../hooks/useTheme';
import { getChartTheme } from './chartTheme';
import { useChartSkin } from './ChartSkin';

/** Tema de gráficas del modo y la piel activos; se actualiza al cambiar claro/oscuro. */
export const useChartTheme = () => {
  const { theme } = useTheme();
  return getChartTheme(theme, useChartSkin());
};
