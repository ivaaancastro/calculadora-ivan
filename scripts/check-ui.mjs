#!/usr/bin/env node
/**
 * Comprobaciones de las primitivas de UI (spec-rediseno-02-c2, 6.6). `npm run lint:ui`.
 *
 *  1. Cada exportación de src/components/ui/index.js se importa fuera de ui/ (RF7).
 *  2. Ninguna clase ni componente retirado (scripts/ui-retired.json) vuelve a aparecer en src/ (RF6).
 *  3. El `className` literal que se pasa a una primitiva solo lleva colocación y espaciado (RF3).
 *     Las partes dinámicas (`${…}`, variables) no se pueden comprobar aquí: se revisan a mano.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { listFiles } from './codemods/lib.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const UI_DIR = 'src/components/ui';
const RETIRED = join(ROOT, 'scripts', 'ui-retired.json');

const VARIANT = '(?:(?:sm|md|lg|xl|2xl|hover|focus|focus-visible|active|disabled|group-hover|first|last|odd|even):)*';
/** Lo único que puede ir en el `className` de una primitiva: colocación, tamaño y espaciado. */
const ALLOWED = new RegExp(
  `^${VARIANT}-?(?:` +
    [
      'm[trblxy]?-.+',
      'p[trblxy]?-.+',
      'space-[xy]-.+',
      'gap(?:-[xy])?-.+',
      '(?:min-|max-)?[wh]-.+',
      'size-.+',
      'flex',
      'inline-flex',
      'flex-(?:row|col|wrap|nowrap|1|auto|initial|none)(?:-reverse)?',
      'grid',
      'inline-grid',
      'grid-(?:cols|rows|flow)-.+',
      '(?:col|row)-(?:span|start|end)-.+',
      'items-.+',
      'justify-.+',
      'content-(?:start|end|center|between|around|evenly|stretch)',
      'self-.+',
      'place-.+',
      'order-.+',
      'shrink(?:-0)?',
      'grow(?:-0)?',
      'basis-.+',
      'static',
      'relative',
      'absolute',
      'fixed',
      'sticky',
      'inset(?:-[xy])?-.+',
      '(?:top|right|bottom|left)-.+',
      'z-.+',
      'overflow(?:-[xy])?-.+',
      'hidden',
      'block',
      'inline',
      'inline-block',
      'contents',
      'divide-[xy](?:-\\d+)?',
      'truncate',
      'aspect-.+',
      'object-.+',
      'pointer-events-.+',
      'snap-.+',
      'scroll-.+',
      'touch-.+',
      'select-none',
      'text-(?:left|center|right)',
      'whitespace-.+',
    ].join('|') +
    ')$',
);
export const isAllowedClass = (c) => ALLOWED.test(c);

const parseJsx = (source) => parse(source, { sourceType: 'module', plugins: ['jsx', 'typescript'] });

function walk(node, fn) {
  if (!node || typeof node.type !== 'string') return;
  fn(node);
  for (const k of Object.keys(node)) {
    if (k === 'loc' || k === 'start' || k === 'end' || k === 'extra') continue;
    const v = node[k];
    if (Array.isArray(v)) v.forEach((x) => walk(x, fn));
    else if (v && typeof v === 'object') walk(v, fn);
  }
}

/** Nombres exportados por un módulo (export { a, b } [from …], export const/function). */
export function exportNames(source) {
  const names = [];
  for (const n of parseJsx(source).program.body) {
    if (n.type !== 'ExportNamedDeclaration') continue;
    for (const s of n.specifiers || []) names.push(s.exported.name);
    const d = n.declaration;
    if (d?.declarations) for (const v of d.declarations) names.push(v.id.name);
    else if (d?.id) names.push(d.id.name);
  }
  return names;
}

/** ¿Resuelve `spec`, importado desde `file`, a src/components/ui (o a un archivo suyo)? */
export function isUiImport(file, spec) {
  if (!spec.startsWith('.')) return false;
  const target = relative(ROOT, resolve(ROOT, dirname(file), spec)).split(sep).join('/');
  return target === UI_DIR || target.startsWith(`${UI_DIR}/`);
}

/** Primitivas importadas desde ui/ en un archivo: { local → importado }. */
export function uiImports(file, source) {
  const out = new Map();
  for (const n of parseJsx(source).program.body) {
    if (n.type !== 'ImportDeclaration' || !isUiImport(file, n.source.value)) continue;
    for (const s of n.specifiers) if (s.type === 'ImportSpecifier') out.set(s.local.name, s.imported.name);
  }
  return out;
}

/** Clases no permitidas en los `className` literales que recibe una primitiva. */
export function classNameViolations(file, source) {
  const prims = uiImports(file, source);
  if (!prims.size) return [];
  const out = [];
  walk(parseJsx(source).program, (n) => {
    if (n.type !== 'JSXOpeningElement') return;
    const root = n.name.type === 'JSXMemberExpression' ? n.name.object : n.name;
    if (root.type !== 'JSXIdentifier' || !prims.has(root.name)) return;
    const attr = n.attributes.find((a) => a.type === 'JSXAttribute' && a.name.name === 'className');
    if (!attr) return;
    const v = attr.value.type === 'JSXExpressionContainer' ? attr.value.expression : attr.value;
    const texts = v.type === 'StringLiteral' ? [v.value] : v.type === 'TemplateLiteral' ? v.quasis.map((q) => q.value.cooked) : [];
    for (const t of texts)
      for (const c of t.split(/\s+/).filter(Boolean)) if (!isAllowedClass(c)) out.push(`${file}:${n.loc.start.line} <${root.name}> "${c}"`);
  });
  return out;
}

/** Apariciones de clases o componentes retirados en un fuente (palabra completa). */
export function retiredHits(file, source, retired) {
  const out = [];
  const lines = source.split('\n');
  const check = (name, kind) => {
    const re = new RegExp(`(?<![\\w-])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`);
    lines.forEach((l, i) => {
      if (re.test(l)) out.push(`${file}:${i + 1} retirado (${kind}) "${name}"`);
    });
  };
  for (const c of retired.classes || []) check(c, 'clase');
  if (!/\.css$/.test(file)) for (const c of retired.components || []) check(c, 'componente');
  return out;
}

export function checkUi({ root = ROOT, read = (f) => readFileSync(join(root, f), 'utf8'), files, retired } = {}) {
  const all = files ?? listFiles(root, ['src', 'src/index.css']).filter((f) => /\.(jsx?|tsx?|css)$/.test(f));
  const rules = retired ?? (existsSync(RETIRED) ? JSON.parse(readFileSync(RETIRED, 'utf8')) : { classes: [], components: [] });
  const problems = [];
  const index = `${UI_DIR}/index.js`;
  const exported = all.includes(index) ? exportNames(read(index)) : [];
  const used = new Set();
  for (const f of all) {
    const src = read(f);
    problems.push(...retiredHits(f, src, rules));
    if (/\.css$/.test(f) || f.startsWith(`${UI_DIR}/`)) continue;
    for (const imported of uiImports(f, src).values()) used.add(imported);
    problems.push(...classNameViolations(f, src));
  }
  for (const name of exported) if (!used.has(name)) problems.push(`${index}: "${name}" no se usa fuera de ui/`);
  return { problems, exported };
}

function main() {
  const { problems, exported } = checkUi();
  if (problems.length) {
    console.error('Primitivas de UI con problemas:\n  ' + problems.join('\n  '));
    process.exit(1);
  }
  console.log(`Primitivas de UI correctas (${exported.length} exportaciones, todas con uso).`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
