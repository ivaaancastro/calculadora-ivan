import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { MAIN_TABS, MAIN_TAB_PATHS } from '../../components/dashboard/mainTabs';
import { MainTabsView } from '../../components/dashboard/MainTabsView';

const views = {
  analytics: <p>V-analytics</p>,
  stats: <p>V-stats</p>,
  calendar: <p>V-calendar</p>,
  health: <p>V-health</p>,
  history: <p>V-history</p>,
};

describe('rutas de las pestañas principales (D17)', () => {
  it('conserva las 5 rutas y su orden', () => {
    expect(MAIN_TAB_PATHS).toEqual(['/', '/stats', '/calendar', '/health', '/history']);
    expect(MAIN_TABS.map((t) => t.view)).toEqual(['analytics', 'stats', 'calendar', 'health', 'history']);
  });

  it.each(MAIN_TABS)('$path: escritorio muestra su vista y móvil las 5', ({ path, view }) => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={[path]}>
        <MainTabsView activeIndex={MAIN_TAB_PATHS.indexOf(path)} onChangeTab={() => {}} views={views} />
      </MemoryRouter>,
    );
    const [mobile, desktop] = html.split('<div class="hidden md:block">');
    expect(desktop.match(/V-\w+/g)).toEqual([`V-${view}`]);
    expect(mobile.match(/V-\w+/g)).toEqual(
      ['analytics', 'stats', 'calendar', 'health', 'history'].map((v) => `V-${v}`),
    );
  });
});
