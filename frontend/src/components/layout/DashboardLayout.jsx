// src/components/layout/DashboardLayout.jsx
// Layout wrapper for authenticated dashboard pages.
// Includes the sidebar and a main content area.

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

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
    </div>
  );
};

export default DashboardLayout;
