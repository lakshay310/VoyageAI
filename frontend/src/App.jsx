// src/App.jsx
// Root component: sets up routing and wraps everything in providers.
// React Router v6 declarative routes.
//
// Prompt 26 — Performance:
// Pages are loaded with React.lazy() + Suspense (code splitting).
// The browser only downloads a page's JS chunk when the user FIRST visits it.
// This shrinks the initial bundle and makes first-load much faster.

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider }    from './context/AuthContext';
import ProtectedRoute      from './components/layout/ProtectedRoute';
import DashboardLayout     from './components/layout/DashboardLayout';
import Navbar              from './components/layout/Navbar';
import ErrorBoundary       from './components/ErrorBoundary';
import LoadingSpinner      from './components/common/LoadingSpinner';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
// Each import() call creates a separate JS chunk in the build output.
// The chunk is fetched from the server only when the route is first visited.
const LandingPage        = lazy(() => import('./pages/LandingPage'));
const LoginPage          = lazy(() => import('./pages/LoginPage'));
const RegisterPage       = lazy(() => import('./pages/RegisterPage'));
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const ProfilePage        = lazy(() => import('./pages/ProfilePage'));
const TripsPage          = lazy(() => import('./pages/TripsPage'));
const TripDetailPage     = lazy(() => import('./pages/TripDetailPage'));
const AIPlannerPage      = lazy(() => import('./pages/AIPlannerPage'));
const FlightSearchPage   = lazy(() => import('./pages/FlightSearchPage'));
const HotelSearchPage    = lazy(() => import('./pages/HotelSearchPage'));
const BookingsPage       = lazy(() => import('./pages/BookingsPage'));
const ExpenseTrackerPage = lazy(() => import('./pages/ExpenseTrackerPage'));
const ChatbotPage        = lazy(() => import('./pages/ChatbotPage'));
const MapExplorerPage    = lazy(() => import('./pages/MapExplorerPage'));
const WeatherPage        = lazy(() => import('./pages/WeatherPage'));
const NotificationsPage  = lazy(() => import('./pages/NotificationsPage'));
const WishlistPage       = lazy(() => import('./pages/WishlistPage'));
const JournalPage        = lazy(() => import('./pages/JournalPage'));
const JournalEntryPage   = lazy(() => import('./pages/JournalEntryPage'));
const ReviewsPage        = lazy(() => import('./pages/ReviewsPage'));
const SearchPage         = lazy(() => import('./pages/SearchPage'));
const AdminPage          = lazy(() => import('./pages/AdminPage'));
const AnalyticsPage      = lazy(() => import('./pages/AnalyticsPage'));
const SecurityPage       = lazy(() => import('./pages/SecurityPage'));
const DeploymentPage     = lazy(() => import('./pages/DeploymentPage'));
const InterviewNotesPage = lazy(() => import('./pages/InterviewNotesPage'));
const NotFoundPage       = lazy(() => import('./pages/NotFoundPage'));

const App = () => {
  return (
    // ErrorBoundary catches any unexpected crash in the React tree
    <ErrorBoundary>
      {/* BrowserRouter enables client-side routing */}
      <BrowserRouter>
      {/* AuthProvider makes user data available everywhere */}
      <AuthProvider>
        {/*
          Suspense shows a spinner while a lazy page chunk is loading.
          This fallback only appears for ~100–300ms on first visit to a page.
        */}
        <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
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
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ── Protected routes (must be logged in) ────────────────────────── */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard"       element={<DashboardPage />} />
              <Route path="/trips"           element={<TripsPage />} />
              <Route path="/trips/:id"       element={<TripDetailPage />} />
              <Route path="/ai-planner"      element={<AIPlannerPage />} />
              <Route path="/flights"         element={<FlightSearchPage />} />
              <Route path="/hotels"          element={<HotelSearchPage />} />
              <Route path="/bookings"        element={<BookingsPage />} />
              <Route path="/expenses"        element={<ExpenseTrackerPage />} />
              <Route path="/maps"            element={<MapExplorerPage />} />
              <Route path="/weather"         element={<WeatherPage />} />
              <Route path="/notifications"   element={<NotificationsPage />} />
              <Route path="/wishlist"        element={<WishlistPage />} />
              <Route path="/journal"         element={<JournalPage />} />
              <Route path="/journal/:id"     element={<JournalEntryPage />} />
              <Route path="/reviews"         element={<ReviewsPage />} />
              <Route path="/search"          element={<SearchPage />} />
              <Route path="/admin"           element={<AdminPage />} />
              <Route path="/analytics"       element={<AnalyticsPage />} />
              <Route path="/security"        element={<SecurityPage />} />
              <Route path="/deployment"      element={<DeploymentPage />} />
              <Route path="/interview-notes" element={<InterviewNotesPage />} />
              <Route path="/chatbot"         element={<ChatbotPage />} />
              <Route path="/profile"         element={<ProfilePage />} />
            </Route>

            {/* ── 404 catch-all (must be the very last route) ─────────────────── */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>

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
    </ErrorBoundary>
  );
};

export default App;
