const fs = require('fs');

let navbarContent = fs.readFileSync('src/components/dashboard/Navbar.jsx', 'utf8');
// Fix Logo Link
navbarContent = navbarContent.replace(
  '</p>\n          </div>\n        </button>',
  '</p>\n          </div>\n        </Link>'
);
// Fix Tab Links
navbarContent = navbarContent.replace(
  '<span className="hidden lg:inline">{tab.label}</span>\n                </button>',
  '<span className="hidden lg:inline">{tab.label}</span>\n                </Link>'
);
// Fix Profile Link
navbarContent = navbarContent.replace(
  '<span className="text-xs font-medium text-slate-600 dark:text-zinc-300 hidden lg:inline">Perfil</span>\n            </button>',
  '<span className="text-xs font-medium text-slate-600 dark:text-zinc-300 hidden lg:inline">Perfil</span>\n            </Link>'
);

fs.writeFileSync('src/components/dashboard/Navbar.jsx', navbarContent);

let bottomNavContent = fs.readFileSync('src/components/layout/BottomNav.jsx', 'utf8');
bottomNavContent = bottomNavContent.replace(
  '<span className="text-[10px] font-medium mt-1">{item.label}</span>\n          </button>',
  '<span className="text-[10px] font-medium mt-1">{item.label}</span>\n          </Link>'
);
fs.writeFileSync('src/components/layout/BottomNav.jsx', bottomNavContent);

console.log("Navs fixed 2");
