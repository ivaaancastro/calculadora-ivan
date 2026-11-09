#!/usr/bin/env node
/**
 * Codemod de la familia BORDES (spec-rediseno-02-c1, PR 2). CLI en family.mjs.
 * Tabla de equivalencias: src/styles/tokens/borders.json.
 */
import { defineFamily, tableFrom } from './family.mjs';

export const FAMILY = 'borders';
export const PROPS = 'border(?:-[trblxyse])?|divide|ring(?:-offset)?|outline';
export const ENTRIES = ['src/components', 'src/App.jsx'];

const family = defineFamily({ family: FAMILY, props: PROPS, entries: ENTRIES });
export const loadDefs = family.loadDefs;
export { tableFrom };

family.cli(import.meta.url);
