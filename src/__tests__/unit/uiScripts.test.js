import { describe, it, expect } from 'vitest';
import { elementsOf, recipeOf, inventory } from '../../../scripts/ui-inventory.mjs';
import {
  isAllowedClass,
  exportNames,
  isUiImport,
  classNameViolations,
  retiredHits,
  checkUi,
} from '../../../scripts/check-ui.mjs';

describe('ui-inventory: recetas', () => {
  it('lee clases de cadenas, plantillas y las dos ramas de un ternario', () => {
    const [el] = elementsOf('const A = () => <button className={`px-2 ${on ? "bg-surface-4 text-ink" : "text-ink-3"}`} />;');
    expect(el.tag).toBe('button');
    expect(el.classes).toEqual(['px-2', 'bg-surface-4', 'text-ink', 'text-ink-3']);
  });

  it('quita colocación y espaciado externo, no el relleno ni el color', () => {
    expect(recipeOf(['mt-4', 'sm:ml-2', 'w-full', 'shrink-0', 'p-3', 'bg-surface', 'p-3'])).toBe('bg-surface p-3');
  });

  it('agrupa por receta y cuenta los usos', () => {
    const files = { 'a.jsx': '<><button className="mt-2 px-2 text-ink" /><button className="px-2 text-ink ml-auto" /></>', 'b.jsx': '<button className="px-3" />' };
    const { total, recipes } = inventory(Object.keys(files), 'button', (f) => files[f]);
    expect(total).toBe(3);
    expect(recipes[0]).toEqual({ recipe: 'button | px-2 text-ink', uses: ['a.jsx:1', 'a.jsx:1'] });
  });
});

describe('check-ui', () => {
  it('className: admite colocación y espaciado, rechaza color, tipografía, radio y sombra', () => {
    for (const c of ['p-3.5', 'sm:p-4', 'flex', 'flex-col', 'justify-between', 'mb-5', 'overflow-hidden', 'divide-y', 'w-full', 'lg:col-span-2'])
      expect(isAllowedClass(c), c).toBe(true);
    for (const c of ['bg-surface', 'text-ink', 'text-xs', 'font-bold', 'rounded-2xl', 'border', 'shadow-sm', 'divide-hairline', 'uppercase', 'hover:bg-fill'])
      expect(isAllowedClass(c), c).toBe(false);
  });

  it('lee las exportaciones de index.js', () => {
    expect(exportNames("export { Card, SectionHeader } from './Card.jsx';\nexport const x = 1;\nexport {};")).toEqual(['Card', 'SectionHeader', 'x']);
  });

  it('reconoce los imports de ui/ por su ruta resuelta', () => {
    expect(isUiImport('src/components/pages/HealthPage.jsx', '../ui')).toBe(true);
    expect(isUiImport('src/components/pages/HealthPage.jsx', '../ui/Card.jsx')).toBe(true);
    expect(isUiImport('src/App.jsx', './components/ui')).toBe(true);
    expect(isUiImport('src/components/pages/HealthPage.jsx', '../uix')).toBe(false);
    expect(isUiImport('src/components/pages/HealthPage.jsx', 'recharts')).toBe(false);
  });

  it('señala solo los className literales de primitivas importadas de ui/', () => {
    const src = `import { Card } from '../ui';
const A = () => <><Card className="p-4 text-ink" /><div className="text-ink" /><Card.Body className={\`gap-2 \${x}\`} /></>;`;
    expect(classNameViolations('src/components/pages/X.jsx', src)).toEqual(['src/components/pages/X.jsx:2 <Card> "text-ink"']);
  });

  it('detecta clases y componentes retirados como palabra completa', () => {
    const rules = { classes: ['pt-safe'], components: ['MetricHelp'] };
    expect(retiredHits('a.jsx', 'className="pt-safe-top pt-safe"\n<MetricHelpX />', rules)).toEqual(['a.jsx:1 retirado (clase) "pt-safe"']);
    expect(retiredHits('a.css', '.pt-safe { }\n/* MetricHelp */', rules)).toEqual(['a.css:1 retirado (clase) "pt-safe"']);
  });

  it('falla si una exportación de ui/ no se usa fuera de ui/', () => {
    const files = {
      'src/components/ui/index.js': "export { Card } from './Card.jsx';\nexport { Stat } from './Stat.jsx';",
      'src/components/ui/Stat.jsx': "import { Card } from './Card.jsx';",
      'src/components/pages/A.jsx': "import { Card } from '../ui';",
    };
    const { problems } = checkUi({ files: Object.keys(files), read: (f) => files[f], retired: { classes: [], components: [] } });
    expect(problems).toEqual(['src/components/ui/index.js: "Stat" no se usa fuera de ui/']);
  });
});
