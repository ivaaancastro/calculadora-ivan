const fs = require('fs');
const navbarPath = 'src/components/dashboard/Navbar.jsx';
const bottomNavPath = 'src/components/layout/BottomNav.jsx';

// ---- Refactor Navbar ----
let navbarContent = fs.readFileSync(navbarPath, 'utf8');

// Add imports
navbarContent = navbarContent.replace(
  "import { useTheme }", 
  "import { Link, useLocation } from 'react-router-dom';\nimport { useTheme }"
);

// Update props
navbarContent = navbarContent.replace(
  "activeTab, onTabChange",
  ""
);
navbarContent = navbarContent.replace(
  "onAddClick, onProfileClick, isStravaConnected, onSync,",
  "onAddClick, isStravaConnected, onSync"
);

// Add location
navbarContent = navbarContent.replace(
  "const fileInputRef = useRef(null);",
  "const fileInputRef = useRef(null);\n  const location = useLocation();\n  const currentPath = location.pathname;"
);

// Update tabs array
navbarContent = navbarContent.replace(
  "id: 'overview'", "path: '/'"
).replace(
  "id: 'stats'", "path: '/stats'"
).replace(
  "id: 'calendar'", "path: '/calendar'"
).replace(
  "id: 'history'", "path: '/history'"
).replace(
  "id: 'health'", "path: '/health'"
);

// Replace logo button
navbarContent = navbarContent.replace(
  "<button onClick={() => onTabChange('overview')} className=\"flex items-center gap-2.5 hover:opacity-80 transition-opacity\">",
  "<Link to=\"/\" className=\"flex items-center gap-2.5 hover:opacity-80 transition-opacity\">"
);
navbarContent = navbarContent.replace(
  "</p>\n          </div>\n        </button>",
  "</p>\n          </div>\n        </Link>"
);

// Replace tab buttons
navbarContent = navbarContent.replace(
  "const isActive = activeTab === tab.id;",
  "const isActive = currentPath === tab.path || (tab.path === '/' && currentPath === '');"
);
navbarContent = navbarContent.replace(
  "<button key={tab.id} onClick={() => onTabChange(tab.id)}",
  "<Link key={tab.path} to={tab.path}"
);
navbarContent = navbarContent.replace(
  "<span className=\"hidden lg:inline\">{tab.label}</span>\n                </button>",
  "<span className=\"hidden lg:inline\">{tab.label}</span>\n                </Link>"
);

// Replace Profile button
navbarContent = navbarContent.replace(
  "<button onClick={onProfileClick}",
  "<Link to=\"/profile\""
);
navbarContent = navbarContent.replace(
  "hidden lg:inline\">Perfil</span>\n            </button>",
  "hidden lg:inline\">Perfil</span>\n            </Link>"
);

fs.writeFileSync(navbarPath, navbarContent);


// ---- Refactor BottomNav ----
let bottomNavContent = fs.readFileSync(bottomNavPath, 'utf8');

bottomNavContent = bottomNavContent.replace(
  "import React from 'react';",
  "import React from 'react';\nimport { Link, useLocation } from 'react-router-dom';"
);

bottomNavContent = bottomNavContent.replace(
  "export const BottomNav = ({ activeTab, onTabChange }) => {",
  "export const BottomNav = () => {\n  const location = useLocation();\n  const currentPath = location.pathname;"
);

bottomNavContent = bottomNavContent.replace(
  "id: 'overview'", "path: '/'"
).replace(
  "id: 'stats'", "path: '/stats'"
).replace(
  "id: 'calendar'", "path: '/calendar'"
).replace(
  "id: 'history'", "path: '/history'"
).replace(
  "id: 'health'", "path: '/health'"
);

bottomNavContent = bottomNavContent.replace(
  "const isActive = activeTab === item.id;",
  "const isActive = currentPath === item.path || (item.path === '/' && currentPath === '');"
);

bottomNavContent = bottomNavContent.replace(
  "<button\n            key={item.id}\n            onClick={() => onTabChange(item.id)}",
  "<Link\n            key={item.path}\n            to={item.path}"
);

bottomNavContent = bottomNavContent.replace(
  "<span className=\"text-[10px] font-medium mt-1\">{item.label}</span>\n          </button>",
  "<span className=\"text-[10px] font-medium mt-1\">{item.label}</span>\n          </Link>"
);

fs.writeFileSync(bottomNavPath, bottomNavContent);
console.log("Navbars refactored successfully.");
