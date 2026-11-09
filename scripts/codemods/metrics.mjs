#!/usr/bin/env node
/**
 * Tokens de MÉTRICAS (spec-rediseno-02-c1, RF4, PR 5a). Solo `--tokens`: la migración de
 * CTL/ATL/TSB se hizo a mano (unos 15 usos), porque el mismo color significa cosas distintas
 * y varios tokens comparten valor (`legacy-tsb-up` y `positive` son ambos emerald-500).
 *   metric-*-ink  etiquetas de texto del Dashboard (EvolutionChart)
 *   legacy-*      otro color para la misma métrica en otra pantalla (D-07 en paridad.md)
 * Los colores de series de las gráficas (`metric-ctl/atl/tsb`) están en tokens.css desde el PR 1.
 */
import { defineFamily } from './family.mjs';

export const FAMILY = 'metrics';
const family = defineFamily({ family: FAMILY, props: 'text', entries: [] });
export const loadDefs = family.loadDefs;

family.cli(import.meta.url);
