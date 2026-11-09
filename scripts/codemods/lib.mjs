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

/** Lista los archivos .js/.jsx de `dirs` (relativos a `root`), sin pruebas. */
export function listFiles(root, entries) {
  const out = [];
  const walk = (p) => {
    const st = statSync(p);
    if (st.isDirectory()) {
      if (p.endsWith('__tests__')) return;
      for (const n of readdirSync(p)) walk(join(p, n));
    } else if (/\.(jsx?|tsx?)$/.test(p)) out.push(p);
  };
  for (const e of entries) walk(join(root, e));
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
  const visit = (node, group) => {
    if (!node || typeof node.type !== 'string') return;
    if (GROUP_RESETS.has(node.type)) group = null;
    if (group === null && GROUP_STARTS.has(node.type)) group = ++nextGroup;
    const own = group ?? ++nextGroup;
    if (node.type === 'StringLiteral') {
      // Texto crudo del fuente, para que las posiciones coincidan aunque haya escapes.
      out.push({ start: node.start + 1, end: node.end - 1, text: source.slice(node.start + 1, node.end - 1), gluedStart: false, gluedEnd: false, group: own });
    } else if (node.type === 'TemplateLiteral') {
      node.quasis.forEach((q, i) => {
        out.push({ start: q.start, end: q.end, text: source.slice(q.start, q.end), gluedStart: i > 0, gluedEnd: !q.tail, group: own });
      });
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'extra' || key === 'leadingComments' || key === 'trailingComments') continue;
      const v = node[key];
      if (Array.isArray(v)) v.forEach((c) => visit(c, group));
      else if (v && typeof v.type === 'string') visit(v, group);
    }
  };
  visit(ast.program, null);
  return out;
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

/** Valor de un color de Tailwind ("zinc-800/50", "black/[0.04]") → { rgb: 'r g b', a: número }. */
export function resolveColor(spec) {
  const [name, alphaRaw] = spec.split('/');
  let hex;
  if (name === 'white') hex = '#ffffff';
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
export function findPairs(lit, props, colors = NEUTRALS) {
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
  const pairedKeys = new Set([...base.keys()].filter((k) => dark.has(k)));
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
    const d = dark.get(k);
    if (!d) continue;
    const prop = k.split('|')[1];
    const reason =
      list.length > 1 || d.length > 1 ? 'ambiguo' : blocked.has(conflictGroup(prop)) ? 'precedencia' : null;
    pairs.push({ key: k, light: list[0], dark: d[0], lightValue: valueOf(list[0].parsed), darkValue: valueOf(d[0].parsed), reason });
  }
  pairs.blocked = blocked;
  return pairs;
}

/** Recorre archivos y devuelve todos los pares con su ubicación. */
export function collectPairs(root, files, props, colors = NEUTRALS) {
  const out = [];
  for (const file of files) {
    const src = readFileSync(join(root, file), 'utf8');
    for (const lit of findLiterals(src)) {
      for (const p of findPairs(lit, props, colors)) out.push({ file, lit, ...p });
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
export function transform(source, props, table, colors = NEUTRALS) {
  const lits = findLiterals(source).map((lit) => ({ lit, pairs: findPairs(lit, props, colors) }));
  const status = new Map(); // `${group}|${propGroup}` → true (migrable) / false (bloqueado)
  const mark = (lit, g, ok) => {
    const k = `${lit.group}|${g}`;
    status.set(k, (status.get(k) ?? true) && ok);
  };
  for (const { lit, pairs } of lits) {
    for (const g of pairs.blocked) mark(lit, g, false);
    for (const p of pairs) mark(lit, conflictGroup(p.light.parsed.prop), !p.reason && !!table[`${p.lightValue}|${p.darkValue}`]);
  }

  const edits = [];
  let replaced = 0;
  const skipped = [];
  for (const { lit, pairs } of lits) {
    for (const p of pairs) {
      const token = table[`${p.lightValue}|${p.darkValue}`];
      if (!token) continue;
      const g = conflictGroup(p.light.parsed.prop);
      const reason = p.reason ?? (status.get(`${lit.group}|${g}`) ? null : 'precedencia (misma expresión)');
      if (reason) {
        skipped.push({ pair: `${p.lightValue} | dark:${p.darkValue}`, reason });
        continue;
      }
      const prefix = p.light.parsed.variants.length ? `${p.light.parsed.variants.join(':')}:` : '';
      edits.push({ start: lit.start + p.light.start, end: lit.start + p.light.end, text: `${prefix}${p.light.parsed.prop}-${token}` });
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
