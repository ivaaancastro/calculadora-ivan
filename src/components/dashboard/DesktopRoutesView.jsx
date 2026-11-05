import React from 'react';
import { Routes, Route } from 'react-router-dom';

/**
 * Vista de escritorio con navegación estándar por rutas para las 5 pestañas principales.
 * Extraído de Dashboard.jsx para cumplir SRP.
 */
export function DesktopRoutesView({
  renderAdvancedAnalytics,
  renderFitnessStats,
  renderCalendar,
  renderHealth,
  renderHistory,
}) {
  return (
    <div className="hidden md:block">
      <Routes>
        <Route path="/" element={renderAdvancedAnalytics} />
        <Route path="/stats" element={renderFitnessStats} />
        <Route path="/calendar" element={renderCalendar} />
        <Route path="/health" element={renderHealth} />
        <Route path="/history" element={renderHistory} />
      </Routes>
    </div>
  );
}
