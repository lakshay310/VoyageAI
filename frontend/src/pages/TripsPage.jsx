// src/pages/TripsPage.jsx
// Shows all the user's trips in a card grid.
// Includes a modal to create a new trip.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMyTrips, createTrip } from '../services/trip.service';
import { formatDate, formatCurrency, getStatusLabel, getDayCount } from '../utils/formatters';
import { PageHeader, EmptyState } from '../components/common';
import { STATUS_COLORS } from '../constants';

// Today's date in YYYY-MM-DD format (for date input default values)
const today = new Date().toISOString().split('T')[0];

// Empty form state — reused for reset
const EMPTY_FORM = {
  title:       '',
  destination: '',
  startDate:   today,
  endDate:     '',
  budget:      '',
  notes:       '',
};

// ─── Create Trip Modal ────────────────────────────────────────────────────────

const CreateTripModal = ({ onClose, onCreated }) => {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createTrip({
        ...form,
        budget: form.budget ? parseFloat(form.budget) : 0,
      });
      toast.success(`Trip to ${form.destination} created! ✈️`);
      onCreated(res.data.data); // tell parent to add new trip to list
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create trip.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop — click outside to close
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">Plan a New Trip ✈️</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Trip title */}
          <div>
            <label className="label">Trip Title</label>
            <input
              name="title"
              type="text"
              className="input"
              placeholder="e.g. Goa Winter Trip"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* Destination */}
          <div>
            <label className="label">Destination</label>
            <input
              name="destination"
              type="text"
              className="input"
              placeholder="e.g. Goa, India"
              value={form.destination}
              onChange={handleChange}
              required
            />
          </div>

          {/* Dates — side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input
                name="startDate"
                type="date"
                className="input"
                value={form.startDate}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                name="endDate"
                type="date"
                className="input"
                value={form.endDate}
                min={form.startDate} // can't end before it starts
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="label">Budget (₹)</label>
            <input
              name="budget"
              type="number"
              className="input"
              placeholder="e.g. 50000"
              value={form.budget}
              onChange={handleChange}
              min="0"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              name="notes"
              className="input resize-none"
              rows={3}
              placeholder="Any special plans or reminders..."
              value={form.notes}
              onChange={handleChange}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Trip Card ─────────────────────────────────────────────────────────────────

const TripCard = ({ trip, onClick }) => {
  const days = getDayCount(trip.startDate, trip.endDate);

  return (
    <div
      onClick={onClick}
      className="bg-gray-900 border border-gray-800 rounded-2xl p-5 cursor-pointer
                 hover:border-gray-600 hover:shadow-lg hover:shadow-black/20
                 transition-all duration-200 group"
    >
      {/* Top row: destination + status badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <p className="text-gray-400 text-xs mb-0.5">📍 {trip.destination}</p>
          <h3 className="text-white font-semibold text-base group-hover:text-blue-400 transition-colors truncate">
            {trip.title}
          </h3>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex-shrink-0 ml-3 ${STATUS_COLORS[trip.status]}`}>
          {getStatusLabel(trip.status)}
        </span>
      </div>

      {/* Dates */}
      <p className="text-gray-500 text-xs mb-4">
        📅 {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
        <span className="text-gray-600 ml-1">({days} day{days !== 1 ? 's' : ''})</span>
      </p>

      {/* Budget + stats footer */}
      <div className="flex items-center justify-between border-t border-gray-800 pt-3 mt-1">
        <div>
          <p className="text-xs text-gray-500">Budget</p>
          <p className="text-sm font-semibold text-white">{formatCurrency(trip.budget)}</p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-xs text-gray-500">Bookings</p>
            <p className="text-sm font-semibold text-white">{trip._count?.bookings ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Expenses</p>
            <p className="text-sm font-semibold text-white">{trip._count?.expenses ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const TripsPage = () => {
  const navigate = useNavigate();

  const [trips, setTrips]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Fetch all trips when the page loads
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await getMyTrips();
        setTrips(res.data.data);
      } catch {
        toast.error('Could not load trips.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  /** Called by modal on successful creation — prepends new trip to list */
  const handleTripCreated = (newTrip) => {
    setTrips((prev) => [newTrip, ...prev]);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header (Prompt 27 / Prompt 28 reusable component) */}
      <PageHeader
        title="My Trips"
        subtitle={`${trips.length} trip${trips.length !== 1 ? 's' : ''} planned`}
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + New Trip
          </button>
        }
      />

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-800 rounded w-full mb-2" />
              <div className="h-3 bg-gray-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state (Prompt 28 reusable component) */}
      {!loading && trips.length === 0 && (
        <EmptyState
          icon="🗺️"
          title="No trips yet!"
          description="Plan your first trip and start tracking bookings and expenses."
          action={
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Plan your first trip
            </button>
          }
        />
      )}

      {/* Trip cards grid */}
      {!loading && trips.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onClick={() => navigate(`/trips/${trip.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create trip modal */}
      {showModal && (
        <CreateTripModal
          onClose={() => setShowModal(false)}
          onCreated={handleTripCreated}
        />
      )}
    </div>
  );
};

export default TripsPage;
