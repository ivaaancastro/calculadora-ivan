/* global process */
import { test } from '@playwright/test';
import { defineVisualSuite } from './support/visual.js';

// Las capturas de referencia se generan en Linux (imagen oficial de Playwright),
// igual que en CI. Las de macOS/Windows no son comparables: ahí se omiten.
test.skip(
  process.platform !== 'linux',
  'Capturas de referencia solo en Linux. Ejecuta `npm run test:e2e:docker` para compararlas.',
);

defineVisualSuite();
