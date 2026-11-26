import { useTheme } from '../../hooks/useTheme';
import { getChartTheme } from './chartTheme';

/** Tema de gráficas del modo activo; se actualiza al cambiar claro/oscuro. */
export const useChartTheme = () => {
  const { theme } = useTheme();
  return getChartTheme(theme);
};
