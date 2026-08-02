// src/pages/DashboardPage.jsx
// Main dashboard — fetches real data from the API and displays:
//   1. A time-based greeting
//   2. Stats row (total trips, active bookings, total spent)
//   3. Recent trips list
//   4. Recent expenses list
//   5. Quick action buttons

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getDashboardData } from '../services/dashboard.service';
import { formatCurrency, formatDate, getStatusLabel } from '../utils/formatters';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a greeting based on the current hour of the day */
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/** Map each TripStatus to a colour class for the badge */
const STATUS_COLORS = {
  PLANNED:   'bg-blue-500/15 text-blue-400 border-blue-500/20',
  ONGOING:   'bg-green-500/15 text-green-400 border-green-500/20',
  COMPLETED: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/20',
};

/** Map expense categories to an emoji icon */
const CATEGORY_ICONS = {
  FOOD:          '🍜',
  TRANSPORT:     '🚌',
  ACCOMMODATION: '🏨',
  ACTIVITIES:    '🎭',
  SHOPPING:      '🛍️',
  HEALTH:        '💊',
  OTHER:         '📦',
};

// ─── Small reusable components ───────────────────────────────────────────────

/** A single stat card in the top row */
const StatCard = ({ icon, label, value, color }) => (
  <div className={`bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4 hover:border-gray-700 transition-colors`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  </div>
);

/** Skeleton placeholder shown while data is loading */
const SkeletonCard = () => (
  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse">
    <div className="h-4 bg-gray-800 rounded w-1/3 mb-3" />
    <div className="h-6 bg-gray-800 rounded w-1/2" />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { user }    = useAuth();
  const navigate    = useNavigate();

  // Dashboard data from the API
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard summary on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDashboardData();
        setData(res.data.data); // { stats, recentTrips, recentExpenses }
      } catch (err) {
        toast.error('Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // empty dependency array = run once when component mounts

  const stats = data?.stats;

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* ── Greeting header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Here's a summary of your travel activity.
          </p>
        </div>
        {/* Quick new-trip CTA in the header */}
        <Link to="/trips" className="btn-primary hidden sm:inline-flex">
          + New Trip
        </Link>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          // Show 3 skeletons while loading
          [1, 2, 3].map((i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              icon="🗺️"
              label="Total Trips"
              value={stats?.totalTrips ?? 0}
              color="bg-blue-500/10"
            />
            <StatCard
              icon="🎫"
              label="Active Bookings"
              value={stats?.activeBookings ?? 0}
              color="bg-purple-500/10"
            />
            <StatCard
              icon="💰"
              label="Total Spent"
              value={formatCurrency(stats?.totalSpent ?? 0)}
              color="bg-green-500/10"
            />
          </>
        )}
      </div>

      {/* ── Two-column grid: Recent Trips + Recent Expenses ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Trips card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold">Recent Trips</h2>
            <Link to="/trips" className="text-blue-400 text-xs hover:text-blue-300 transition-colors">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : data?.recentTrips?.length === 0 ? (
            // Empty state
            <div className="text-center py-10">
              <p className="text-4xl mb-3">🗺️</p>
              <p className="text-gray-400 text-sm">No trips yet.</p>
              <Link to="/trips" className="btn-primary mt-3 text-xs">
                Plan your first trip
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentTrips.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => navigate(`/trips/${trip.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{trip.destination}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex-shrink-0 ml-3 ${STATUS_COLORS[trip.status]}`}>
                    {getStatusLabel(trip.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold">Recent Expenses</h2>
            <Link to="/expenses" className="text-blue-400 text-xs hover:text-blue-300 transition-colors">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : data?.recentExpenses?.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">💸</p>
              <p className="text-gray-400 text-sm">No expenses logged yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Category icon */}
                    <span className="text-xl flex-shrink-0">
                      {CATEGORY_ICONS[expense.category] || '📦'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {expense.title}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {expense.trip?.destination} · {formatDate(expense.date)}
                      </p>
                    </div>
                  </div>
                  <p className="text-red-400 text-sm font-semibold flex-shrink-0 ml-3">
                    −{formatCurrency(expense.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick actions row ──────────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '✈️', label: 'New Trip',        to: '/trips' },
            { icon: '🎫', label: 'Add Booking',     to: '/bookings' },
            { icon: '💰', label: 'Log Expense',     to: '/expenses' },
            { icon: '👤', label: 'My Profile',      to: '/profile' },
          ].map(({ icon, label, to }) => (
            <Link
              key={label}
              to={to}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl
                         bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50
                         hover:border-gray-600 transition-all duration-200 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                {icon}
              </span>
              <span className="text-gray-300 text-xs font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};

export default DashboardPage;
