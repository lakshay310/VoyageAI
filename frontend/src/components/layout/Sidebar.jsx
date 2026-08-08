// src/components/layout/Sidebar.jsx
// Left sidebar navigation for the authenticated dashboard area.

import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard',        icon: '🏠', path: '/dashboard' },
  { label: 'My Trips',         icon: '🧳', path: '/trips' },
  { label: 'AI Planner',       icon: '🤖', path: '/ai-planner' },
  { label: 'Interactive Maps', icon: '🗺️', path: '/maps' },
  { label: 'Weather',          icon: '🌦️', path: '/weather' },
  { label: 'Flights',          icon: '✈️', path: '/flights' },
  { label: 'Hotels',           icon: '🏨', path: '/hotels' },
  { label: 'Bookings',         icon: '🎫', path: '/bookings' },
  { label: 'Expenses',         icon: '💰', path: '/expenses' },
  { label: 'Profile',          icon: '👤', path: '/profile' },
];

const Sidebar = () => {
  return (
    <aside className="w-60 min-h-screen border-r border-gray-800 bg-gray-900 px-3 py-6">
      {/* App name */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-4">
        Navigation
      </p>

      {/* Nav links */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
