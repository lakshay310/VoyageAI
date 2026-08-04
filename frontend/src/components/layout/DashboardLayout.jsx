// src/components/layout/DashboardLayout.jsx
// Layout wrapper for authenticated dashboard pages.
// Includes the sidebar, top navbar, main content area, and the floating AI chat widget.

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ChatbotWidget from '../ChatbotWidget';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="flex">
        <Sidebar />
        {/* Main content area */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet /> {/* Nested pages render here */}
        </main>
      </div>

      {/* Floating AI chat button — visible on every dashboard page */}
      <ChatbotWidget />
    </div>
  );
};

export default DashboardLayout;

