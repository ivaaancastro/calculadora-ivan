import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MobileSwipePager } from '../layout/MobileSwipePager';
import { MAIN_TABS } from './mainTabs';

/**
 * Las 5 pestañas principales: carrusel táctil en móvil y rutas estándar en escritorio,
 * generados desde la misma lista (MAIN_TABS). `views` mapea cada `view` a su elemento.
 */
export function MainTabsView({ activeIndex, onChangeTab, views }) {
  return (
    <>
      <div className="block md:hidden">
        <MobileSwipePager activeIndex={activeIndex} onChangeTab={onChangeTab}>
          {MAIN_TABS.map((t) => (
            <React.Fragment key={t.path}>{views[t.view]}</React.Fragment>
          ))}
        </MobileSwipePager>
      </div>
      <div className="hidden md:block">
        <Routes>
          {MAIN_TABS.map((t) => (
            <Route key={t.path} path={t.path} element={views[t.view]} />
          ))}
        </Routes>
      </div>
    </>
  );
}
