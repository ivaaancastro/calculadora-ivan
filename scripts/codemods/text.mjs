#!/usr/bin/env node
/**
 * Codemod de la familia TEXTO (spec-rediseno-02-c1, PR 3). CLI en family.mjs.
 * Solo neutros (slate, zinc, white…): los acentos de texto van con el PR 5.
 * Tabla de equivalencias: src/styles/tokens/text.json.
 */
import { defineFamily, tableFrom } from './family.mjs';

export const FAMILY = 'text';
export const PROPS = 'text|placeholder|caret|decoration';
export const ENTRIES = ['src/components', 'src/App.jsx'];

const family = defineFamily({ family: FAMILY, props: PROPS, entries: ENTRIES });
export const loadDefs = family.loadDefs;
export { tableFrom };

family.cli(import.meta.url);
