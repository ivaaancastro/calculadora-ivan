#!/usr/bin/env node
/**
 * Inventario de recetas de UI (spec-rediseno-02-c2, 3.4 y 6.3).
 *
 * Recorre el JSX de src/components y src/App.jsx y agrupa los elementos por RECETA: sus clases
 * (las dos ramas de un ternario incluidas) sin las de colocación y espaciado externo. Dos usos con
 * la misma receta pueden compartir variante de una primitiva sin cambiar el aspecto.
 *
 *   node scripts/ui-inventory.mjs <familia> [--all]
 *     familias: button, field, card, modal, tooltip, loading, any
 *     --all   lista también las recetas de un solo uso
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { listFiles } from './codemods/lib.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Clases de colocación y espaciado externo: no forman parte de la receta. */
export const PLACEMENT =
  /^(?:(?:sm|md|lg|xl|2xl):)*-?(?:m[trblxy]?-.+|w-full|flex-1|shrink-0|grow|self-.+|order-.+|col-span-.+|row-span-.+|hidden|block|absolute|relative|top-.+|left-.+|right-.+|bottom-.+|z-.+|ml-auto|mr-auto|mx-auto)$/;

/** Texto de clases de un valor de atributo o expresión (ternarios: ambas ramas). */
function classText(node) {
  if (!node) return [];
  switch (node.type) {
    case 'StringLiteral':
      return [node.value];
    case 'JSXExpressionContainer':
      return classText(node.expression);
    case 'TemplateLiteral':
      return [...node.quasis.map((q) => q.value.cooked), ...node.expressions.flatMap(classText)];
    case 'ConditionalExpression':
      return [...classText(node.consequent), ...classText(node.alternate)];
    case 'LogicalExpression':
    case 'BinaryExpression':
      return [...classText(node.left), ...classText(node.right)];
    case 'CallExpression':
      return node.arguments.flatMap(classText);
    case 'ArrayExpression':
      return node.elements.flatMap(classText);
    default:
      return [];
  }
}

const tagName = (n) =>
  n.type === 'JSXIdentifier' ? n.name : n.type === 'JSXMemberExpression' ? `${tagName(n.object)}.${n.property.name}` : '?';

/** Elementos JSX de un archivo: { line, tag, classes, attrs }. */
export function elementsOf(source) {
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  const out = [];
  const visit = (n) => {
    if (!n || typeof n.type !== 'string') return;
    if (n.type === 'JSXOpeningElement') {
      const attrs = n.attributes.filter((a) => a.type === 'JSXAttribute');
      const cls = attrs.find((a) => a.name.name === 'className');
      const classes = (cls ? classText(cls.value) : []).join(' ').split(/\s+/).filter(Boolean);
      out.push({ line: n.loc.start.line, tag: tagName(n.name), classes, attrs: attrs.map((a) => a.name.name) });
    }
    for (const k of Object.keys(n)) {
      if (k === 'loc' || k === 'start' || k === 'end' || k === 'extra') continue;
      const v = n[k];
      if (Array.isArray(v)) v.forEach(visit);
      else if (v && typeof v === 'object') visit(v);
    }
  };
  visit(ast.program);
  return out;
}

/** Receta: clases sin colocación ni espaciado externo, ordenadas y sin repetir. */
export const recipeOf = (classes) => [...new Set(classes.filter((c) => !PLACEMENT.test(c)))].sort().join(' ');

const has = (re) => (e) => e.classes.some((c) => re.test(c));
export const FAMILIES = {
  button: (e) => e.tag === 'button',
  field: (e) => ['input', 'select', 'textarea'].includes(e.tag) && e.classes.length > 0 && e.classes.join(' ') !== 'hidden',
  card: (e) =>
    e.tag === 'div' &&
    (e.classes.includes('ios-card') ||
      (has(/^rounded-(?:xl|2xl|3xl)$/)(e) && e.classes.includes('border') && has(/^bg-/)(e) && !e.classes.includes('fixed'))),
  modal: (e) => e.classes.includes('fixed') && e.classes.includes('inset-0'),
  tooltip: (e) => /Tooltip$/.test(e.tag),
  loading: (e) => e.classes.includes('animate-spin') || e.classes.includes('animate-pulse') || e.tag === 'Loader2',
  any: (e) => e.classes.length > 0,
};

/** Agrupa por receta los elementos de una familia. */
export function inventory(files, family, read = (f) => readFileSync(join(ROOT, f), 'utf8')) {
  const pick = FAMILIES[family];
  if (!pick) throw new Error(`Familia desconocida: ${family}`);
  const groups = new Map();
  let total = 0;
  for (const file of files) {
    for (const e of elementsOf(read(file)).filter(pick)) {
      total++;
      const key = `${e.tag} | ${recipeOf(e.classes)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(`${file}:${e.line}`);
    }
  }
  const recipes = [...groups.entries()].map(([recipe, uses]) => ({ recipe, uses })).sort((a, b) => b.uses.length - a.uses.length);
  return { total, recipes };
}

function main() {
  const [family, ...rest] = process.argv.slice(2);
  if (!family || !FAMILIES[family]) {
    console.error(`Uso: node scripts/ui-inventory.mjs <${Object.keys(FAMILIES).join('|')}> [--all]`);
    process.exit(2);
  }
  const files = listFiles(ROOT, ['src/components', 'src/App.jsx']).filter((f) => /\.jsx$/.test(f));
  const { total, recipes } = inventory(files, family);
  const repeated = recipes.filter((r) => r.uses.length >= 2);
  console.log(
    `${family}: ${total} elementos, ${recipes.length} recetas, ${repeated.length} con ≥ 2 usos que cubren ${repeated.reduce((s, r) => s + r.uses.length, 0)}`,
  );
  for (const r of rest.includes('--all') ? recipes : repeated) console.log(`\n${r.uses.length}  ${r.recipe}\n   ${r.uses.join('\n   ')}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
