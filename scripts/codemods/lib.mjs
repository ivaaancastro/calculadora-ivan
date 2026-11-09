/**
 * Base común de los codemods de tokens (spec-rediseno-02-c1, RF6).
 *
 * Regla de oro: solo se sustituye un par claro/oscuro EXACTO que tenga token, y solo dentro
 * del mismo literal (string o tramo estático de una plantilla). Lo demás no se toca.
 *
 *   'border-slate-200 dark:border-zinc-800'  →  'border-line'
 *   'hover:border-slate-300 dark:hover:border-zinc-600'  →  'hover:border-line-strong'
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parse } from '@babel/parser';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const twColors = require('tailwindcss/colors');

export const NEUTRALS = ['slate', 'gray', 'zinc', 'neutral', 'stone', 'white', 'black'];

/** Cualquier color que pueda competir por la misma propiedad CSS (para la regla de precedencia). */
// Se excluyen los alias obsoletos antes de leerlos (su getter imprime un aviso).
const DEPRECATED = new Set(['lightBlue', 'warmGray', 'trueGray', 'coolGray', 'blueGray']);
const PALETTE = Object.keys(twColors).filter((k) => !DEPRECATED.has(k) && typeof twColors[k] === 'object');
const TOKENS = (() => {
  try {
    return Object.keys(require('../../src/styles/tailwindTokens.cjs').flatColorNames());
  } catch {
    return [];
  }
})();
const ANY_COLOR = `(?:(?:${[...PALETTE, 'white', 'black', 'transparent', 'current', 'inherit', ...TOKENS]
  .sort((a, b) => b.length - a.length)
  .join('|')})(?:-\\d{2,3})?|\\[(?:#|rgb|var)[^\\]]*\\])`;

/** Grupo de propiedad CSS: `border`, `border-b`… compiten entre sí. */
const conflictGroup = (prop) => (prop.startsWith('border') ? 'border' : prop);

/** Lista los archivos .js/.jsx de `entries` (relativos a `root`), sin pruebas. Un archivo nombrado (p. ej. index.css) entra siempre. */
export function listFiles(root, entries) {
  const out = [];
  const walk = (p, named = false) => {
    const st = statSync(p);
    if (st.isDirectory()) {
      if (p.endsWith('__tests__')) return;
      for (const n of readdirSync(p)) walk(join(p, n));
    } else if (named || /\.(jsx?|tsx?)$/.test(p)) out.push(p);
  };
  for (const e of entries) walk(join(root, e), true);
  return out.map((p) => relative(root, p).split(sep).join('/')).sort();
}

/**
 * Literales que pueden contener clases: { start, end, text, gluedStart, gluedEnd, group }.
 * `start`/`end` son posiciones en el fuente; en plantillas, `glued*` indica que el tramo
 * toca una expresión `${…}` sin espacio (esa clase de borde no es una clase completa).
 * `group` agrupa los literales de una misma expresión de clases (un atributo JSX, una
 * plantilla, un ternario…), que pueden acabar en el mismo elemento.
 */
const GROUP_STARTS = new Set([
  'JSXAttribute',
  'TemplateLiteral',
  'ConditionalExpression',
  'LogicalExpression',
  'BinaryExpression',
]);
const GROUP_RESETS = new Set(['JSXElement', 'JSXFragment', 'ArrowFunctionExpression', 'FunctionExpression', 'FunctionDeclaration']);

export function findLiterals(source) {
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    errorRecovery: false,
  });
  const out = [];
  let nextGroup = 0;
  let nextCond = 0;
  // `branches`: ramas de ternario por las que se llega al literal ('3:c', '3:a'). Dos literales
  // en ramas opuestas del mismo ternario nunca se aplican a la vez al mismo elemento.
  const visit = (node, group, branches) => {
    if (!node || typeof node.type !== 'string') return;
    if (GROUP_RESETS.has(node.type)) {
      group = null;
      branches = [];
    }
    if (group === null && GROUP_STARTS.has(node.type)) group = ++nextGroup;
    const own = group ?? ++nextGroup;
    if (node.type === 'StringLiteral') {
      // Texto crudo del fuente, para que las posiciones coincidan aunque haya escapes.
      out.push({ start: node.start + 1, end: node.end - 1, text: source.slice(node.start + 1, node.end - 1), gluedStart: false, gluedEnd: false, group: own, branches });
    } else if (node.type === 'TemplateLiteral') {
      node.quasis.forEach((q, i) => {
        out.push({ start: q.start, end: q.end, text: source.slice(q.start, q.end), gluedStart: i > 0, gluedEnd: !q.tail, group: own, branches });
      });
    }
    const cond = node.type === 'ConditionalExpression' ? ++nextCond : null;
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'extra' || key === 'leadingComments' || key === 'trailingComments') continue;
      const b =
        cond && key === 'consequent' ? [...branches, `${cond}:c`] : cond && key === 'alternate' ? [...branches, `${cond}:a`] : branches;
      const v = node[key];
      if (Array.isArray(v)) v.forEach((c) => visit(c, group, b));
      else if (v && typeof v.type === 'string') visit(v, group, b);
    }
  };
  visit(ast.program, null, []);
  return out;
}

/**
 * Literales de un CSS: cada `@apply …;` es una expresión de clases (Tailwind aplica sus
 * utilidades con el mismo orden que en un className, así que rige la misma precedencia).
 */
export function findCssLiterals(source) {
  const out = [];
  const re = /@apply\s+([^;]+);/g;
  let m;
  let group = 0;
  while ((m = re.exec(source))) {
    const start = m.index + m[0].indexOf(m[1]);
    out.push({ start, end: start + m[1].length, text: m[1], gluedStart: false, gluedEnd: false, group: `css${++group}`, branches: [] });
  }
  return out;
}

/** Literales de un archivo según su tipo. */
export const literalsOf = (file, source) => (/\.css$/.test(file) ? findCssLiterals(source) : findLiterals(source));

/** ¿Pueden dos literales de la misma expresión acabar a la vez en el mismo elemento? */
export function canCoexist(a, b) {
  if (a === b) return true;
  const ma = new Map(a.branches.map((x) => x.split(':')));
  return !b.branches.some((x) => {
    const [id, side] = x.split(':');
    return ma.has(id) && ma.get(id) !== side;
  });
}

/** Divide un literal en clases con su posición: [{ cls, start, end, glued }]. */
export function splitClasses(lit) {
  const out = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(lit.text))) {
    const glued =
      (lit.gluedStart && m.index === 0) || (lit.gluedEnd && m.index + m[0].length === lit.text.length);
    out.push({ cls: m[0], start: m.index, end: m.index + m[0].length, glued });
  }
  return out;
}

/**
 * Analiza una clase de color: { variants: [...] (sin 'dark'), dark: bool, prop, color, alpha }.
 * `props` es la alternancia de propiedades de la familia; `colors` la de colores admitidos.
 */
export function parseColorClass(cls, props, colors = NEUTRALS, colorPattern = null) {
  const color = colorPattern ?? `(?:${colors.join('|')})(?:-\\d{2,3})?`;
  const re = new RegExp(
    `^((?:[\\w-]+(?:\\[[^\\]]*\\])?:)*)(${props})-(${color})(?:\\/(\\d+|\\[[\\d.]+\\]))?$`,
  );
  const m = cls.match(re);
  if (!m) return null;
  const variants = m[1] ? m[1].slice(0, -1).split(':') : [];
  const dark = variants.includes('dark');
  return {
    variants: variants.filter((v) => v !== 'dark'),
    dark,
    prop: m[2],
    color: m[3],
    alpha: m[4] ?? null,
  };
}

/** Valor de un color de Tailwind ("zinc-800/50", "black/[0.04]", "[#1c1c1e]/95") → { rgb: 'r g b', a: número }. */
export function resolveColor(spec) {
  const [name, alphaRaw] = spec.split('/');
  let hex;
  const arbitrary = name.match(/^\[(#[0-9a-fA-F]{6})\]$/) || name.match(/^(#[0-9a-fA-F]{6})$/);
  if (arbitrary) hex = arbitrary[1];
  else if (name === 'white') hex = '#ffffff';
  else if (name === 'black') hex = '#000000';
  else {
    const [family, shade] = name.split(/-(?=\d+$)/);
    hex = twColors[family]?.[shade];
  }
  if (!hex) throw new Error(`Color desconocido: ${spec}`);
  const h = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ');
  let a = 1;
  if (alphaRaw) a = alphaRaw.startsWith('[') ? Number(alphaRaw.slice(1, -1)) : Number(alphaRaw) / 100;
  return { rgb, a };
}

const valueOf = (p) => (p.alpha ? `${p.color}/${p.alpha}` : p.color);
const keyOf = (p) => `${p.variants.join(':')}|${p.prop}`;

/**
 * Pares claro/oscuro de un literal. Devuelve los pares sustituibles y los motivos de los que no.
 * Un par se descarta (conservador) si en el mismo literal hay otra clase de la misma propiedad
 * sin pareja: al convertir el par en un solo token cambiaría la precedencia CSS frente a ella.
 */
/**
 * `opts.singles`: una clase sin pareja `dark:` cuenta como par consigo misma (token con el
 * mismo valor en claro y oscuro). Solo para la familia de acentos.
 */
export function findPairs(lit, props, colors = NEUTRALS, opts = {}) {
  const classes = splitClasses(lit);
  const items = classes
    .map((c) => ({ ...c, parsed: c.glued ? null : parseColorClass(c.cls, props, colors) }))
    .filter((c) => c.parsed);
  const base = new Map();
  const dark = new Map();
  for (const it of items) {
    const map = it.parsed.dark ? dark : base;
    const k = keyOf(it.parsed);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(it);
  }
  // Clases de color de la misma propiedad que no forman un par de la familia (otro color,
  // otra variante sin pareja, un token, transparent…) o que tocan una expresión `${…}`.
  const familyItems = new Set(items);
  const singleKeys = new Set(
    opts.singles ? [...base.keys()].filter((k) => !dark.has(k) && base.get(k).length === 1) : [],
  );
  const pairedKeys = new Set([...base.keys()].filter((k) => dark.has(k) || singleKeys.has(k)));
  const blocked = new Set();
  for (const c of classes) {
    const any = parseColorClass(c.cls, props, [], ANY_COLOR);
    if (!any && !c.glued) continue;
    if (c.glued) {
      // Una clase cortada por `${…}` puede ser de cualquier propiedad: bloquea toda la familia.
      if (/(^|[\s:])(border|divide|ring|outline|bg|text|from|via|to|fill|stroke)/.test(c.cls) || /-$/.test(c.cls)) {
        for (const p of props.split('|')) blocked.add(conflictGroup(p.replace(/\(.*$/, '')));
      }
      continue;
    }
    const it = items.find((i) => i.start === c.start);
    const inPair = it && familyItems.has(it) && pairedKeys.has(keyOf(it.parsed));
    if (!inPair) blocked.add(conflictGroup(any.prop));
  }
  const pairs = [];
  for (const [k, list] of base) {
    const d = dark.get(k) ?? (singleKeys.has(k) ? [null] : null);
    if (!d) continue;
    const prop = k.split('|')[1];
    const reason =
      list.length > 1 || d.length > 1 ? 'ambiguo' : blocked.has(conflictGroup(prop)) ? 'precedencia' : null;
    const lightValue = valueOf(list[0].parsed);
    pairs.push({ key: k, light: list[0], dark: d[0], lightValue, darkValue: d[0] ? valueOf(d[0].parsed) : lightValue, reason });
  }
  pairs.blocked = blocked;
  return pairs;
}

/** Recorre archivos y devuelve todos los pares con su ubicación. */
export function collectPairs(root, files, props, colors = NEUTRALS, opts = {}) {
  const out = [];
  for (const file of files) {
    const src = readFileSync(join(root, file), 'utf8');
    for (const lit of literalsOf(file, src)) {
      const excluded = opts.skip?.(file, lit, src);
      for (const p of findPairs(lit, props, colors, opts)) out.push({ file, lit, ...p, reason: excluded ? 'excluido' : p.reason });
    }
  }
  return out;
}

/**
 * Aplica a `source` la tabla { 'luz|oscuro': token }. Devuelve { code, replaced, skipped }.
 *
 * Regla de precedencia: para cada propiedad (bordes, divide, ring…) y cada expresión de clases,
 * se migran todos sus pares o ninguno. Si en esa expresión queda alguna clase de color de la
 * misma propiedad que no se migra (sin pareja, sin token, otro color, cortada por `${…}`),
 * se deja todo como está: un token es una sola clase y cambiaría cuál gana en CSS frente a
 * `dark:`, que hoy se genera después de `hover:`/`focus:`.
 */
export function transform(source, props, table, colors = NEUTRALS, file = 'x.jsx', opts = {}) {
  const lits = literalsOf(file, source).map((lit) => {
    const pairs = findPairs(lit, props, colors, opts);
    // Literal excluido a mano (otro significado): no se migra y bloquea lo que coexiste con él.
    if (opts.skip?.(file, lit, source)) for (const p of pairs) p.reason = 'excluido';
    return { lit, pairs };
  });
  // Propiedades que cada literal deja sin migrar (clase suelta, par sin token, par descartado).
  const stuck = new Map();
  for (const { lit, pairs } of lits) {
    const s = new Set(pairs.blocked);
    for (const p of pairs) if (p.reason || !tokenFor(p, table)) s.add(conflictGroup(p.light.parsed.prop));
    stuck.set(lit, s);
  }
  // Un literal se migra para una propiedad si ningún literal que pueda coexistir con él en el
  // mismo elemento (misma expresión y no en la rama opuesta de un ternario) la deja sin migrar.
  const migrable = (lit, g) =>
    lits.every(({ lit: other }) => other.group !== lit.group || !stuck.get(other).has(g) || !canCoexist(lit, other));
  // El bloqueo se propaga: un literal que acaba sin migrar bloquea a todo lo que coexiste con él
  // (p. ej. `base ${on ? 'text-blue-500' : 'hover:…'}`: la base no se migra, así que la otra
  // rama tampoco). Se repite hasta que no cambia nada.
  for (let changed = true; changed; ) {
    changed = false;
    for (const { lit, pairs } of lits) {
      for (const p of pairs) {
        const g = conflictGroup(p.light.parsed.prop);
        if (!stuck.get(lit).has(g) && !migrable(lit, g)) {
          stuck.get(lit).add(g);
          changed = true;
        }
      }
    }
  }

  const edits = [];
  let replaced = 0;
  const skipped = [];
  for (const { lit, pairs } of lits) {
    for (const p of pairs) {
      const token = tokenFor(p, table);
      if (!token) continue;
      const g = conflictGroup(p.light.parsed.prop);
      const reason = p.reason ?? (migrable(lit, g) ? null : 'precedencia (misma expresión)');
      if (reason) {
        skipped.push({ pair: `${p.lightValue} | dark:${p.darkValue}`, reason });
        continue;
      }
      const prefix = p.light.parsed.variants.length ? `${p.light.parsed.variants.join(':')}:` : '';
      edits.push({ start: lit.start + p.light.start, end: lit.start + p.light.end, text: `${prefix}${p.light.parsed.prop}-${token}` });
      if (!p.dark) {
        replaced++;
        continue;
      }
      // Se quita la clase dark y el espacio que la separa de la anterior (o de la siguiente).
      let s = lit.start + p.dark.start;
      let e = lit.start + p.dark.end;
      const before = lit.text.slice(0, p.dark.start);
      const ws = before.match(/[ \t]+$/);
      if (ws && before.trim().length) s -= ws[0].length;
      else {
        const after = lit.text.slice(p.dark.end).match(/^[ \t]+/);
        if (after) e += after[0].length;
      }
      edits.push({ start: s, end: e, text: '' });
      replaced++;
    }
  }
  edits.sort((a, b) => b.start - a.start);
  let code = source;
  for (const ed of edits) code = code.slice(0, ed.start) + ed.text + code.slice(ed.end);
  return { code, replaced, skipped };
}

/**
 * Token (con su modificador de opacidad, si hace falta) para un par. Una clase suelta con
 * opacidad (`bg-red-500/10`) usa el token de su color con el mismo modificador
 * (`bg-danger/10`): da exactamente el mismo color.
 */
export function tokenFor(p, table) {
  const direct = table[`${p.lightValue}|${p.darkValue}`];
  if (direct) return direct;
  if (!p.dark && p.light.parsed.alpha) {
    const c = p.light.parsed.color;
    const base = table[`${c}|${c}`];
    if (base) return `${base}/${p.light.parsed.alpha}`;
  }
  return null;
}

/** Bloque CSS de tokens a partir de { token: { light, dark } }. */
export function tokensCss(family, defs) {
  const lines = (mode) =>
    Object.entries(defs).flatMap(([name, d]) => {
      const v = resolveColor(d[mode]);
      const needsA = resolveColor(d.light).a !== 1 || resolveColor(d.dark).a !== 1;
      return [`  --${name}: ${v.rgb};${needsA ? ` --${name}-a: ${v.a};` : ''} /* ${d[mode]} */`];
    });
  return [
    `/* @tokens:${family}:start (generado por scripts/codemods/${family}.mjs --tokens; no editar a mano) */`,
    ':root {',
    ...lines('light'),
    '}',
    '.dark {',
    ...lines('dark'),
    '}',
    `/* @tokens:${family}:end */`,
  ].join('\n');
}

/** ¿Algún modo del token lleva opacidad propia? (usa la variante con `calc`). */
export const needsAlpha = (d) => resolveColor(d.light).a !== 1 || resolveColor(d.dark).a !== 1;
