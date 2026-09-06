// src/App.jsx
// Root component: sets up routing and wraps everything in providers.
// React Router v6 declarative routes.

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import Navbar from './components/layout/Navbar';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import TripsPage from './pages/TripsPage';
import TripDetailPage from './pages/TripDetailPage';
import AIPlannerPage from './pages/AIPlannerPage';
import FlightSearchPage from './pages/FlightSearchPage';
import HotelSearchPage from './pages/HotelSearchPage';
import BookingsPage from './pages/BookingsPage';
import ExpenseTrackerPage from './pages/ExpenseTrackerPage';
import ChatbotPage from './pages/ChatbotPage';
import MapExplorerPage from './pages/MapExplorerPage';
import WeatherPage from './pages/WeatherPage';
import NotificationsPage from './pages/NotificationsPage';
import WishlistPage from './pages/WishlistPage';
import JournalPage from './pages/JournalPage';
import JournalEntryPage from './pages/JournalEntryPage';
import ReviewsPage from './pages/ReviewsPage';
import SearchPage from './pages/SearchPage';
import AdminPage from './pages/AdminPage';
import AnalyticsPage from './pages/AnalyticsPage';

// Placeholder pages for future prompts — prevents broken routes
const PlaceholderPage = ({ title }) => (
  <div className="max-w-4xl mx-auto">
    <div className="card text-center py-16">
      <p className="text-4xl mb-3">🚧</p>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="text-gray-400 mt-2">Coming in the next prompt!</p>
    </div>
  </div>
);

const App = () => {
  return (
    // BrowserRouter enables client-side routing
    <BrowserRouter>
      {/* AuthProvider makes user data available everywhere */}
      <AuthProvider>
        <Routes>
          {/* ── Public routes (no auth needed) ─────────────────────────────── */}
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <LandingPage />
              </>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Protected routes (must be logged in) ────────────────────────── */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/trips/:id" element={<TripDetailPage />} />
            <Route path="/ai-planner" element={<AIPlannerPage />} />
            <Route path="/flights" element={<FlightSearchPage />} />
            <Route path="/hotels" element={<HotelSearchPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/expenses" element={<ExpenseTrackerPage />} />
            <Route path="/maps" element={<MapExplorerPage />} />
            <Route path="/weather" element={<WeatherPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/journal/:id" element={<JournalEntryPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>

        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              border: '1px solid #374151',
              borderRadius: '10px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
