#!/usr/bin/env node
/**
 * Codemod de la familia SUPERFICIES (spec-rediseno-02-c1, PR 4). CLI en family.mjs.
 * Fondos neutros, incluidos los grises de iOS en hex (`#1c1c1e`, `#2c2c2e`) y los `@apply`
 * de src/index.css. Los acentos (`bg-blue-500`, `#0A84FF`…) van con el PR 5.
 * Tabla de equivalencias: src/styles/tokens/surfaces.json. Los tokens de `canvas`,
 * `liquid-*` y `scrollbar-*` se usan a mano en el CSS de index.css (no son clases).
 */
import { defineFamily, tableFrom } from './family.mjs';
import { NEUTRALS } from './lib.mjs';

export const FAMILY = 'surfaces';
export const PROPS = 'bg';
export const ENTRIES = ['src/components', 'src/App.jsx', 'src/index.css'];
export const COLORS = [...NEUTRALS, '\\[#(?:2c2c2e|1c1c1e|1C1C1E)\\]'];

const family = defineFamily({ family: FAMILY, props: PROPS, entries: ENTRIES, colors: COLORS });
export const loadDefs = family.loadDefs;
export { tableFrom };

family.cli(import.meta.url);
