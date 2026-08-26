const fs = require('fs');
const dashboardPath = 'src/components/Dashboard.jsx';

let content = fs.readFileSync(dashboardPath, 'utf8');

// 1. Add useLocation to import
content = content.replace(
  'import { Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";',
  'import { Routes, Route, useNavigate, useParams, Navigate, useLocation } from "react-router-dom";'
);

// 2. Remove isActivityPage from JSX and put it before return
content = content.replace(
  'const isActivityPage = location.pathname.startsWith("/activity/");',
  ''
);

content = content.replace(
  'return (',
  'const isActivityPage = location.pathname.startsWith("/activity/");\n  return ('
);

// 3. Remove activeTab and onTabChange from Navbar and BottomNav
content = content.replace(
  '        activeTab={activeTab}\n        onTabChange={handleTabChange}\n      />',
  '      />'
);
content = content.replace(
  '<BottomNav activeTab={activeTab} onTabChange={handleTabChange} />',
  '<BottomNav />'
);

fs.writeFileSync(dashboardPath, content);
console.log("Fixed dashboard");
