// src/pages/TripDetailPage.jsx
// Detailed view of a single trip.
// Lets the user view details, edit the trip, and delete it.
// Also shows bookings and expenses counts as a summary.

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getTripById, updateTrip, deleteTrip } from '../services/trip.service';
import { formatDate, formatCurrency, getStatusLabel, getDayCount } from '../utils/formatters';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED'];

const STATUS_COLORS = {
  PLANNED: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  ONGOING: 'bg-green-500/15 text-green-400 border-green-500/20',
  COMPLETED: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/20',
};

// ─── Itinerary Display ────────────────────────────────────────────────────────
// Renders the AI-generated markdown itinerary with nice visual formatting.

const ItineraryDisplay = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        // Full bold headers: **Day 1: Theme**
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <h3 key={i} className="text-white font-bold text-base mt-5 first:mt-0 border-b border-gray-700 pb-1">
              {line.replace(/\*\*/g, '')}
            </h3>
          );
        }
        // Inline bold labels: **Label:** value
        if (line.includes('**') && line.includes(':')) {
          const html = line.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-blue-400">$1</strong>');
          return <p key={i} className="text-gray-300" dangerouslySetInnerHTML={{ __html: html }} />;
        }
        // Bullet points
        if (line.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2 text-gray-300">
              <span className="text-blue-400 flex-shrink-0 mt-0.5">•</span>
              <span>{line.slice(2)}</span>
            </div>
          );
        }
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i} className="text-gray-300">{line}</p>;
      })}
    </div>
  );
};

// ─── Edit Trip Modal ──────────────────────────────────────────────────────────

const EditTripModal = ({ trip, onClose, onUpdated }) => {
  // Pre-fill form with existing trip data
  const [form, setForm] = useState({
    title: trip.title,
    destination: trip.destination,
    startDate: trip.startDate.split('T')[0], // convert ISO to YYYY-MM-DD
    endDate: trip.endDate.split('T')[0],
    budget: trip.budget,
    status: trip.status,
    notes: trip.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateTrip(trip.id, {
        ...form,
        budget: parseFloat(form.budget),
      });
      toast.success('Trip updated!');
      onUpdated(res.data.data); // notify parent with updated trip
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900">
          <h2 className="text-white font-semibold text-lg">Edit Trip</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Trip Title</label>
            <input name="title" type="text" className="input" value={form.title} onChange={handleChange} required />
          </div>

          <div>
            <label className="label">Destination</label>
            <input name="destination" type="text" className="input" value={form.destination} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input name="startDate" type="date" className="input" value={form.startDate} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">End Date</label>
              <input name="endDate" type="date" className="input" value={form.endDate} min={form.startDate} onChange={handleChange} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Budget (₹)</label>
              <input name="budget" type="number" className="input" value={form.budget} onChange={handleChange} min="0" />
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" className="input" value={form.status} onChange={handleChange}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{getStatusLabel(s)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea name="notes" className="input resize-none" rows={3} value={form.notes} onChange={handleChange} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TripDetailPage = () => {
  // Get the trip ID from the URL: /trips/:id
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch this trip's data on mount
  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await getTripById(id);
        setTrip(res.data.data);
      } catch {
        toast.error('Trip not found.');
        navigate('/trips'); // go back to list if not found
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [id]); // re-fetch if the :id param changes

  /** Delete trip with a confirmation prompt */
  const handleDelete = async () => {
    // window.confirm is simple and appropriate here — no need for a custom modal
    if (!window.confirm(`Delete "${trip.title}"? This will also delete all its bookings and expenses.`)) return;

    setDeleting(true);
    try {
      await deleteTrip(id);
      toast.success('Trip deleted.');
      navigate('/trips'); // redirect to list after deletion
    } catch {
      toast.error('Could not delete trip.');
      setDeleting(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-800 rounded w-1/2" />
        <div className="h-4 bg-gray-800 rounded w-1/4" />
        <div className="h-40 bg-gray-900 border border-gray-800 rounded-2xl mt-4" />
      </div>
    );
  }

  if (!trip) return null;

  const days = getDayCount(trip.startDate, trip.endDate);

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/trips" className="hover:text-gray-300 transition-colors">My Trips</Link>
        <span>/</span>
        <span className="text-gray-300">{trip.title}</span>
      </div>

      {/* ── Trip header card ────────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">📍 {trip.destination}</p>
            <h1 className="text-2xl font-bold text-white">{trip.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[trip.status]}`}>
                {getStatusLabel(trip.status)}
              </span>
              <span className="text-gray-500 text-xs">{days} day{days !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setShowEdit(true)} className="btn-secondary text-xs py-2 px-3">
              ✏️ Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold
                         bg-red-500/10 text-red-400 border border-red-500/20
                         hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              🗑️ {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-gray-800">
          {[
            { label: 'Start', value: formatDate(trip.startDate) },
            { label: 'End', value: formatDate(trip.endDate) },
            { label: 'Budget', value: formatCurrency(trip.budget) },
            { label: 'Duration', value: `${days} day${days !== 1 ? 's' : ''}` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-gray-500 text-xs mb-0.5">{label}</p>
              <p className="text-white text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>

        {/* Notes */}
        {trip.notes && (
          <div className="mt-5 pt-5 border-t border-gray-800">
            <p className="text-gray-500 text-xs mb-1">Notes</p>
            <p className="text-gray-300 text-sm">{trip.notes}</p>
          </div>
        )}
      </div>

      {/* ── Bookings & Expenses summary ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-white">{trip.bookings?.length ?? 0}</p>
          <p className="text-gray-400 text-sm mt-1">Bookings</p>
          <Link to="/bookings" className="text-blue-400 text-xs mt-2 inline-block hover:text-blue-300">
            Manage →
          </Link>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-white">{trip.expenses?.length ?? 0}</p>
          <p className="text-gray-400 text-sm mt-1">Expenses</p>
          <Link to="/expenses" className="text-blue-400 text-xs mt-2 inline-block hover:text-blue-300">
            Manage →
          </Link>
        </div>
      </div>

      {/* ── Expense list preview ─────────────────────────────────────────── */}
      {trip.expenses?.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Recent Expenses</h2>
          <div className="space-y-2">
            {trip.expenses.slice(0, 5).map((exp) => (
              <div key={exp.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-white text-sm">{exp.title}</p>
                  <p className="text-gray-500 text-xs">{exp.category} · {formatDate(exp.date)}</p>
                </div>
                <p className="text-red-400 text-sm font-semibold">−{formatCurrency(exp.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AI-Generated Itinerary ────────────────────────────────────────── */}
      {trip.itinerary && (
        <div className="bg-gray-900 border border-blue-600/20 rounded-2xl p-6">
          {/* Section header with AI badge */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-800">
            <span className="text-2xl">🤖</span>
            <div>
              <h2 className="text-white font-semibold">AI-Generated Itinerary</h2>
              <p className="text-gray-500 text-xs mt-0.5">Powered by Google Gemini</p>
            </div>
            <span className="ml-auto text-xs px-2 py-0.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-full">
              AI Generated
            </span>
          </div>
          {/* Render the markdown itinerary */}
          <div className="overflow-y-auto max-h-[600px] pr-1">
            <ItineraryDisplay text={trip.itinerary} />
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEdit && (
        <EditTripModal
          trip={trip}
          onClose={() => setShowEdit(false)}
          onUpdated={(updated) => setTrip({ ...trip, ...updated })}
        />
      )}
    </div>
  );
};

export default TripDetailPage;
