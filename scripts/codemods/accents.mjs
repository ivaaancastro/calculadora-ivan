#!/usr/bin/env node
/**
 * Codemod de la familia ACENTOS, parte 5a: ESTADOS (spec-rediseno-02-c1, RF4). CLI en family.mjs.
 *
 * Los acentos no se pueden migrar por color: `emerald-500` es "positivo" en un mensaje de éxito,
 * pero "VO2" o "carrera" en otra pantalla. Por eso solo se migran las expresiones de clases que
 * figuran en ALLOW, revisadas una a una, y todo lo demás queda excluido (y bloquea lo que coexista
 * con ello). El token se elige por valor exacto dentro de la familia de su estado:
 *   action  → azul de Tailwind y azul iOS (#007AFF / #0A84FF): botones primarios, foco, enlaces,
 *             hover de controles, carga, selección y pestaña activa
 *   danger  → rojo: errores, borrar, cerrar sesión
 *   positive→ esmeralda y verde iOS: éxito, estado bueno
 *   warning → ámbar y naranja iOS: aviso, estado intermedio
 * Las métricas (CTL/ATL/TSB), zonas, deportes y demás categorías van en la parte 5b.
 *
 * Una clase sin pareja `dark:` (p. ej. `text-red-500`) se migra a un token con el mismo valor en
 * ambos modos (`singles`). ALLOW usa números de línea de `develop` en `66fc419` + PR 4 (`0ad08c8`);
 * el codemod no cambia líneas, así que se puede volver a ejecutar sobre ese mismo punto.
 */
import { defineFamily, tableFrom } from './family.mjs';

export const FAMILY = 'accents';
export const PROPS =
  'bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|divide|outline|from|via|to|fill|stroke|shadow|accent|decoration|placeholder|caret';
export const ENTRIES = ['src/components', 'src/App.jsx'];
export const COLORS = ['red', 'emerald', 'amber', 'blue', '\\[#(?:007AFF|0A84FF|30D158|FF9F0A)\\]'];

/** Expresiones de clases de estado, por archivo y línea (revisadas a mano). */
export const ALLOW = {
  'src/components/Dashboard.jsx': [103, 191],
  'src/components/auth/LoginPage.jsx': [56, 61, 66, 87, 88, 97, 110, 124, 131, 143],
  'src/components/common/ErrorBoundary.jsx': [37, 38, 51, 63],
  'src/components/common/InfoTooltip.jsx': [7],
  'src/components/common/StravaCallback.jsx': [101, 108, 115],
  'src/components/dashboard/ActivityRouteWrapper.jsx': [11],
  'src/components/dashboard/ActivitySubRoutes.jsx': [12],
  'src/components/dashboard/FuelingPanel.jsx': [180],
  'src/components/dashboard/HistoryList.jsx': [112, 122, 138, 231, 236],
  'src/components/dashboard/Navbar.jsx': [87, 110, 162, 180, 182, 220, 239, 243, 249, 255],
  'src/components/dashboard/UploadStatusBanner.jsx': [12],
  'src/components/fitness/EstimatedFtpCard.jsx': [37, 38],
  'src/components/fitness/MmpAndEfCard.jsx': [120, 130],
  'src/components/fitness/TrainingBalanceCard.jsx': [19],
  'src/components/layout/BottomNav.jsx': [53, 65, 83],
  'src/components/modals/AddActivityModal.jsx': [62, 74, 80, 91, 97, 106, 112, 117],
  'src/components/pages/ActivityDetailPage.jsx': [149, 189],
  'src/components/pages/CalendarPage.jsx': [1416, 1855, 1921, 2022, 2335],
  'src/components/pages/EmailConfirmedPage.jsx': [7, 13, 19, 33],
  'src/components/pages/HealthPage.jsx': [141, 142, 143, 150, 151, 152, 231, 234, 239, 242, 372, 790],
  'src/components/pages/LandingPage.jsx': [171, 182, 183, 192, 205, 214, 236, 280, 286, 312, 327, 328, 329, 380, 469],
  'src/components/pages/ProfilePage.jsx': [207, 209, 575, 591, 608, 650, 710, 804, 929, 972, 973, 975, 979, 986],
};

const lineOf = (source, pos) => source.slice(0, pos).split('\n').length;
export const skip = (file, lit, source) => !(ALLOW[file] ?? []).includes(lineOf(source, lit.start));

const family = defineFamily({ family: FAMILY, props: PROPS, entries: ENTRIES, colors: COLORS, singles: true, skip });
export const loadDefs = family.loadDefs;
export { tableFrom };

family.cli(import.meta.url);
