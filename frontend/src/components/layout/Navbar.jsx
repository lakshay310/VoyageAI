// src/components/layout/Navbar.jsx
// Top navigation bar — shown on the public landing page and the dashboard.
// On the landing page it starts transparent and turns solid on scroll.
// On the dashboard (inside DashboardLayout) it always shows solid.

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth }                 from '../../context/AuthContext';
import toast                       from 'react-hot-toast';
import NotificationBell            from '../NotificationBell';

const Navbar = () => {
  const { user, logout }  = useAuth();
  const navigate          = useNavigate();
  const location          = useLocation();

  // Track whether the user has scrolled down (for transparent→solid effect)
  const [scrolled, setScrolled] = useState(false);
  // Mobile menu open/close
  const [menuOpen, setMenuOpen] = useState(false);

  // Only apply the scroll-fade on the landing page (path = '/')
  const isLanding = location.pathname === '/';

  useEffect(() => {
    if (!isLanding) return; // no scroll listener needed outside landing page

    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLanding]);

  // Close mobile menu when navigating
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out!');
    navigate('/');
  };

  // On landing page: start transparent, become solid after scroll
  // On any other page: always solid
  const navBg = isLanding && !scrolled
    ? 'bg-transparent'
    : 'bg-gray-950/95 backdrop-blur-md border-b border-gray-800';

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white hover:text-blue-400 transition-colors">
          ✈️ <span>Voyage<span className="text-blue-400">AI</span></span>
        </Link>

        {/* ── Desktop nav ────────────────────────────────────────────────── */}
        <div className="hidden sm:flex items-center gap-4">
          {user ? (
            <>
              <span className="text-gray-400 text-sm">
                Hey, <span className="text-white font-medium">{user.name.split(' ')[0]}</span>
              </span>
              {/* 🔔 Real-time notification bell */}
              <NotificationBell />

              {/* 📔 Journal quick-access icon with tooltip */}
              <div className="relative group">
                <Link
                  to="/journal"
                  id="navbar-journal-btn"
                  className="relative flex items-center justify-center w-9 h-9 rounded-xl
                             text-gray-400 hover:text-white hover:bg-gray-800 transition-all
                             text-lg"
                  aria-label="Travel Journal"
                >
                  📔
                </Link>
                {/* Tooltip — visible only on hover */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1
                                bg-gray-800 text-white text-xs font-medium rounded-lg
                                border border-gray-700 whitespace-nowrap pointer-events-none
                                opacity-0 group-hover:opacity-100 transition-opacity duration-150
                                shadow-lg z-50">
                  Journal
                  {/* Tiny arrow pointing up */}
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-4
                                   border-transparent border-b-gray-700" />
                </div>
              </div>

              {/* 🔍 Search quick-access icon with tooltip */}
              <div className="relative group">
                <Link
                  to="/search"
                  id="navbar-search-btn"
                  className="relative flex items-center justify-center w-9 h-9 rounded-xl
                             text-gray-400 hover:text-white hover:bg-gray-800 transition-all
                             text-lg"
                  aria-label="Search"
                >
                  🔍
                </Link>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1
                                bg-gray-800 text-white text-xs font-medium rounded-lg
                                border border-gray-700 whitespace-nowrap pointer-events-none
                                opacity-0 group-hover:opacity-100 transition-opacity duration-150
                                shadow-lg z-50">
                  Search
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-4
                                   border-transparent border-b-gray-700" />
                </div>
              </div>

              <Link to="/dashboard" className="btn-secondary py-2 px-4 text-xs">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="btn-secondary py-2 px-4 text-xs">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="text-gray-300 text-sm hover:text-white transition-colors font-medium">Login</Link>
              <Link to="/register" className="btn-primary py-2 px-5 text-sm rounded-xl">Get Started</Link>
            </>
          )}
        </div>

        {/* ── Mobile hamburger ────────────────────────────────────────────── */}
        <button
          className="sm:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-gray-800 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {/* Animated hamburger → X */}
          <span className={`block w-5 h-0.5 bg-gray-300 transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-300 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-300 transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* ── Mobile menu dropdown ─────────────────────────────────────────── */}
      {menuOpen && (
        <div className="sm:hidden bg-gray-950 border-t border-gray-800 px-4 py-4 flex flex-col gap-3">
          {user ? (
            <>
              <p className="text-gray-400 text-sm">
                Signed in as <span className="text-white font-medium">{user.name}</span>
              </p>
              <Link to="/dashboard" className="btn-secondary w-full justify-center">Dashboard</Link>
              <button onClick={handleLogout} className="btn-secondary w-full justify-center">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn-secondary w-full justify-center">Login</Link>
              <Link to="/register" className="btn-primary w-full justify-center">Get Started Free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
