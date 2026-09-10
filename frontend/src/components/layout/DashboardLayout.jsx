// src/components/layout/DashboardLayout.jsx
// Layout wrapper for authenticated dashboard pages.
// Includes the sidebar, top navbar, main content area, and the floating AI chat widget.
//
// Prompt 27 — Responsive UI:
// - Sidebar is hidden on mobile (sm:flex shows it on tablets+)
// - MobileBottomNav gives phone users navigation at the bottom
// - Main content gets padding-bottom on mobile so content isn't hidden by bottom nav

import { Outlet } from 'react-router-dom';
import Sidebar         from './Sidebar';
import Navbar          from './Navbar';
import MobileBottomNav from './MobileBottomNav';
import ChatbotWidget   from '../ChatbotWidget';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="flex">
        {/*
          Sidebar: hidden on phones (default), shown on sm+ screens (640px+).
          `hidden sm:flex` is the Tailwind pattern for this.
        */}
        <div className="hidden sm:flex">
          <Sidebar />
        </div>

        {/*
          Main content area.
          pb-20: adds 80px padding at the bottom on mobile so content is
          not hidden behind the fixed MobileBottomNav bar.
          sm:pb-0: removes that padding on larger screens where there's no bottom nav.
        */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto pb-20 sm:pb-6">
          <Outlet /> {/* Nested pages render here */}
        </main>
      </div>

      {/* Floating AI chat button — visible on every dashboard page */}
      <ChatbotWidget />

      {/* Mobile-only bottom navigation bar */}
      <MobileBottomNav />
    </div>
  );
};

export default DashboardLayout;
