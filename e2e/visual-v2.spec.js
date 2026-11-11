/* global process */
import { test } from '@playwright/test';
import { defineVisualSuite } from './support/visual.js';

// Red de referencia de la piel v2 (RF11): mismas 8 pantallas × 2 temas × 3 tamaños que
// v1, capturadas con `data-ui="v2"`. En el PR del mecanismo son idénticas a v1: esa es
// la prueba de que el atributo no pinta nada por sí solo.
test.skip(
  process.platform !== 'linux',
  'Capturas de referencia solo en Linux. Ejecuta `npm run test:e2e:docker` para compararlas.',
);

defineVisualSuite({ ui: 'v2' });
