// src/components/layout/MobileBottomNav.jsx
// Bottom navigation bar — shown only on small screens (mobile phones).
// Gives quick access to the 5 most important pages without opening the sidebar.
//
// Why a bottom nav?
// On phones, thumbs naturally reach the bottom of the screen.
// Top navigation is harder to reach. This follows mobile UX best practices
// (the same pattern used by Instagram, Twitter, Zomato etc.)
//
// Prompt 27 — Responsive UI

import { NavLink } from 'react-router-dom';

// The 5 most-used pages — kept short so they fit on a phone screen
const BOTTOM_NAV_ITEMS = [
  { label: 'Home',     icon: '🏠', path: '/dashboard' },
  { label: 'Trips',    icon: '🧳', path: '/trips' },
  { label: 'AI',       icon: '🤖', path: '/ai-planner' },
  { label: 'Expenses', icon: '💰', path: '/expenses' },
  { label: 'Profile',  icon: '👤', path: '/profile' },
];

const MobileBottomNav = () => {
  return (
    // `sm:hidden` means this is ONLY shown on screens smaller than 640px (phones)
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50
                    bg-gray-950/95 backdrop-blur-md
                    border-t border-gray-800
                    flex items-center justify-around
                    px-2 py-2 safe-area-pb">
      {BOTTOM_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl
             transition-all duration-150 min-w-[52px]
             ${isActive
               ? 'text-blue-400 bg-blue-500/10'
               : 'text-gray-500 hover:text-gray-300'
             }`
          }
        >
          <span className="text-xl leading-none">{item.icon}</span>
          <span className="text-[10px] font-medium leading-none">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileBottomNav;
