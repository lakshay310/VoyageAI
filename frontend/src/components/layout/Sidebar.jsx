// src/components/layout/Sidebar.jsx
// Left sidebar — always collapsed (icons only) by default.
// Hover over it → smoothly expands to show labels.
// Mouse leave → collapses back to icons only.
// No toggle button needed.

import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard',        icon: '🏠', path: '/dashboard' },
  { label: 'Analytics',        icon: '📊', path: '/analytics' },
  { label: 'My Trips',         icon: '🧳', path: '/trips' },
  { label: 'AI Planner',       icon: '🤖', path: '/ai-planner' },
  { label: 'Interactive Maps', icon: '🗺️', path: '/maps' },
  { label: 'Weather',          icon: '🌦️', path: '/weather' },
  { label: 'Wishlist',         icon: '🌟', path: '/wishlist' },
  { label: 'Reviews',          icon: '⭐', path: '/reviews' },
  { label: 'Flights',          icon: '✈️', path: '/flights' },
  { label: 'Hotels',           icon: '🏨', path: '/hotels' },
  { label: 'Bookings',         icon: '🎫', path: '/bookings' },
  { label: 'Expenses',         icon: '💰', path: '/expenses' },
  { label: 'Security',         icon: '🔒', path: '/security' },
  { label: 'Profile',          icon: '👤', path: '/profile' },
];


const Sidebar = () => {
  // expanded = true while mouse is over the sidebar
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}   // hover in  → expand
      onMouseLeave={() => setExpanded(false)}  // hover out → collapse
      className={`min-h-screen border-r border-gray-800 bg-gray-900 py-6 flex flex-col
                  transition-all duration-300 ease-in-out shrink-0 overflow-hidden
                  ${expanded ? 'w-56 px-3' : 'w-[68px] px-2'}`}
    >

      {/* ── Section label ──────────────────────────────────────────────── */}
      <div className={`overflow-hidden transition-all duration-200
                       ${expanded ? 'max-h-8 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-2'}`}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 whitespace-nowrap">
          Navigation
        </p>
      </div>

      {/* ── Nav links ──────────────────────────────────────────────────── */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl text-sm font-medium
               transition-all duration-150
               ${expanded ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5'}
               ${isActive
                 ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                 : 'text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent'
               }`
            }
          >
            {/* Icon — always visible */}
            <span className="text-lg leading-none shrink-0">{item.icon}</span>

            {/* Label — fades in when expanded */}
            <span
              className={`whitespace-nowrap transition-all duration-200
                          ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}
            >
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
