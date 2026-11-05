import React from 'react';
import { MobileSwipePager } from '../layout/MobileSwipePager';

/**
 * Vista móvil con deslizamiento táctil en tiempo real (1:1) para las 5 pestañas principales.
 * Extraído de Dashboard.jsx para cumplir SRP.
 */
export function MobileTabsView({
  activeIndex,
  onChangeTab,
  renderAdvancedAnalytics,
  renderFitnessStats,
  renderCalendar,
  renderHealth,
  renderHistory,
}) {
  return (
    <div className="block md:hidden">
      <MobileSwipePager activeIndex={activeIndex} onChangeTab={onChangeTab}>
        {renderAdvancedAnalytics}
        {renderFitnessStats}
        {renderCalendar}
        {renderHealth}
        {renderHistory}
      </MobileSwipePager>
    </div>
  );
}
