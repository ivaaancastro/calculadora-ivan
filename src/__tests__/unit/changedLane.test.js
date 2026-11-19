import { describe, it, expect } from 'vitest';
import { classify } from '../../../scripts/changed-lane.mjs';

const lane = (...files) => classify(files).lane;

describe('changed-lane · clasificación de carril', () => {
  it('lógica pura, tests y docs → fast', () => {
    expect(lane('src/utils/activityMetricsBySport.js', 'src/services/ai.js', 'src/store/useAppStore.js')).toBe('fast');
    expect(lane('src/__tests__/unit/foo.test.js', 'docs/branches/x/spec.md', 'README.md', 'AGENTS.md')).toBe('fast');
    expect(lane('src/hooks/useThing.js', 'migrations/001.sql', 'supabase/functions/x/index.ts')).toBe('fast');
  });
  it('JSX y CSS → visual', () => {
    expect(lane('src/components/Foo.jsx')).toBe('visual');
    expect(lane('src/index.css')).toBe('visual');
    expect(lane('src/styles/tokens.css', 'src/styles/tailwindTokens.cjs')).toBe('visual');
  });
  it('recetas de ui/, chartTheme, tailwind e index.html → visual', () => {
    expect(lane('src/components/ui/buttonClasses.js')).toBe('visual');
    expect(lane('src/utils/chartTheme.js')).toBe('visual');
    expect(lane('tailwind.config.js')).toBe('visual');
    expect(lane('index.html')).toBe('visual');
  });
  it('infraestructura visual del E2E → visual; E2E funcional → fast', () => {
    expect(lane('e2e/support/ui.js', 'e2e/tools/style-dump.spec.js')).toBe('visual');
    expect(lane('e2e/__screenshots__/visual-v2.spec.js/desktop/a.png')).toBe('visual');
    expect(lane('e2e/visual-v2.spec.js')).toBe('visual');
    expect(lane('e2e/auth.spec.js', 'e2e/strava.spec.js')).toBe('fast');
  });
  it('el workflow de CI y los scripts de volcado → visual (se prueban con el propio style-diff)', () => {
    expect(lane('.github/workflows/ci.yml')).toBe('visual');
    expect(lane('scripts/ci-style-dump.sh')).toBe('visual');
    expect(lane('.github/workflows/update-snapshots.yml')).toBe('fast');
  });
  it('un test JSX o markdown dentro de src no es visual', () => {
    expect(lane('src/components/Foo.test.jsx')).toBe('fast');
    expect(lane('src/components/README.md')).toBe('fast');
  });
  it('mezcla: basta un fichero visual', () => {
    const r = classify(['docs/a.md', 'src/utils/x.js', 'src/components/Card.jsx']);
    expect(r.lane).toBe('visual');
    expect(r.visualFiles).toEqual(['src/components/Card.jsx']);
  });
  it('sin cambios → fast', () => expect(lane()).toBe('fast'));
});
