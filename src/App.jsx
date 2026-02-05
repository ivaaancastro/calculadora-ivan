import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importamos tus páginas
import Dashboard from './components/Dashboard'; // El código que acabas de mover
import StravaCallback from './components/common/StravaCallback'; // El recepcionista

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Ruta Principal: Tu Dashboard de siempre */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Ruta de Strava: Donde aterriza el usuario tras autorizar */}
        <Route path="/strava-callback" element={<StravaCallback />} />
      </Routes>
    </Router>
  );
};

export default App;