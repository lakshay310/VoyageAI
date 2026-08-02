// src/pages/BookingsPage.jsx
// The Booking Management dashboard.
//
// Features:
//   ✅ Summary metrics (total, confirmed, pending, cancelled, total spend)
//   ✅ Filter bookings by Type (Flight / Hotel / Car / Activity)
//   ✅ Filter by Status (All / Confirmed / Pending / Cancelled)
//   ✅ Filter by Trip dropdown
//   ✅ Real-time text search (provider, PNR, trip name)
//   ✅ "Add Manual Booking" modal with trip selector
//   ✅ Inline status toggle (Confirm / Cancel)
//   ✅ Edit modal — change provider, amount, status, reference
//   ✅ Delete with confirmation
//   ✅ One-click PNR copy to clipboard
//   ✅ Links back to parent trip detail page

import { useState, useEffect, useMemo } from 'react';
import { Link }  from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  getUserBookings,
  createBooking,
  updateBooking,
  deleteBooking,
} from '../services/booking.service';
import { getMyTrips }  from '../services/trip.service';
import { formatCurrency, formatDate } from '../utils/formatters';

// ── Visual Configuration ──────────────────────────────────────────────────────
// Maps enum values to icons and colours used throughout the page.

const TYPE_META = {
  FLIGHT:   { label: 'Flight',   icon: '✈️', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'   },
  HOTEL:    { label: 'Hotel',    icon: '🏨', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  CAR:      { label: 'Car',      icon: '🚗', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'  },
  ACTIVITY: { label: 'Activity', icon: '🎟️', color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20' },
};

const STATUS_META = {
  CONFIRMED: { label: 'Confirmed', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  PENDING:   { label: 'Pending',   badge: 'bg-amber-500/20  text-amber-300   border-amber-500/30'   },
  CANCELLED: { label: 'Cancelled', badge: 'bg-rose-500/20   text-rose-300    border-rose-500/30'    },
};

// ── Add/Edit Booking Modal ────────────────────────────────────────────────────
const BookingModal = ({ isOpen, onClose, onSaved, initialData = null, trips = [] }) => {
  const isEditing = Boolean(initialData);

  // Initialise form from editing data or blank defaults
  const defaultForm = {
    tripId:    trips[0]?.id || '',
    type:      'FLIGHT',
    provider:  '',
    reference: '',
    amount:    '',
    status:    'CONFIRMED',
  };

  const [form,       setForm]       = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  // Whenever the modal opens, reset the form to either the editing item or defaults
  useEffect(() => {
    if (!isOpen) return;
    setForm(
      initialData
        ? { ...defaultForm, ...initialData }   // pre-fill edit fields
        : { ...defaultForm, tripId: trips[0]?.id || '' }
    );
  }, [isOpen, initialData, trips.length]);   // re-run when modal opens

  if (!isOpen) return null;

  const field = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.provider.trim())            return toast.error('Provider name is required.');
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount.');
    if (!isEditing && !form.tripId)       return toast.error('Please select a trip.');

    setSubmitting(true);
    try {
      if (isEditing) {
        // PUT /api/bookings/:id
        await updateBooking(initialData.id, {
          type:      form.type,
          provider:  form.provider,
          reference: form.reference,
          amount:    Number(form.amount),
          status:    form.status,
        });
        toast.success('Booking updated ✅');
      } else {
        // POST /api/trips/:tripId/bookings
        await createBooking(form.tripId, {
          type:      form.type,
          provider:  form.provider,
          reference: form.reference,
          amount:    Number(form.amount),
          status:    form.status,
        });
        toast.success('Booking logged! 🎫');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">
            {isEditing ? '✏️ Edit Booking' : '➕ Log New Booking'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Trip Selector — only shown when creating */}
          {!isEditing && (
            <div>
              <label className="label">Attach to Trip</label>
              <select className="input" value={form.tripId} onChange={field('tripId')} required>
                <option value="">— Select a Trip —</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>{t.title} — {t.destination}</option>
                ))}
              </select>
            </div>
          )}

          {/* Booking Type — button grid */}
          <div>
            <label className="label">Booking Type</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(TYPE_META).map(([typeKey, meta]) => (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => setForm({ ...form, type: typeKey })}
                  className={`py-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    form.type === typeKey
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <span className="text-base">{meta.icon}</span>
                  <span>{meta.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Provider */}
          <div>
            <label className="label">Provider / Service</label>
            <input
              type="text"
              className="input"
              placeholder={
                form.type === 'FLIGHT' ? 'e.g., IndiGo 6E-204' :
                form.type === 'HOTEL'  ? 'e.g., Taj Mahal Palace' :
                form.type === 'CAR'    ? 'e.g., Zoom Car' : 'e.g., Scuba Diving Goa'
              }
              value={form.provider}
              onChange={field('provider')}
              required
            />
          </div>

          {/* PNR / Reference Code */}
          <div>
            <label className="label">PNR / Reference Code <span className="text-gray-600 font-normal text-xs">(optional)</span></label>
            <input
              type="text"
              className="input font-mono tracking-widest uppercase text-sm"
              placeholder="e.g., ABCD12"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value.toUpperCase() })}
            />
          </div>

          {/* Amount + Status side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="100"
                className="input"
                placeholder="e.g., 12500"
                value={form.amount}
                onChange={field('amount')}
                required
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={field('status')}>
                <option value="CONFIRMED">✅ Confirmed</option>
                <option value="PENDING">⏳ Pending</option>
                <option value="CANCELLED">❌ Cancelled</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-gray-800">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50">
              {submitting ? 'Saving...' : isEditing ? 'Update Booking' : 'Add Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Metric Card ───────────────────────────────────────────────────────────────
const MetricCard = ({ title, value, icon, color = 'text-white', subtext }) => (
  <div className="card p-4 border-gray-800 bg-gray-900/60">
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
      <span className="text-lg">{icon}</span>
    </div>
    <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
    {subtext && <p className="text-[11px] text-gray-500 mt-1">{subtext}</p>}
  </div>
);

// ── Main Page Component ───────────────────────────────────────────────────────
const BookingsPage = () => {
  const [bookings,     setBookings]     = useState([]);
  const [trips,        setTrips]        = useState([]);
  const [loading,      setLoading]      = useState(true);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [typeFilter,   setTypeFilter]   = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tripFilter,   setTripFilter]   = useState('ALL');
  const [search,       setSearch]       = useState('');

  // ── Modal ──────────────────────────────────────────────────────────────────
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);   // null = create, object = edit

  // ── Load Data ──────────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, tRes] = await Promise.all([
        getUserBookings(),   // GET /api/bookings
        getMyTrips(),        // GET /api/trips
      ]);
      setBookings(bRes.data.data  || []);
      setTrips(tRes.data.trips    || []);
    } catch {
      toast.error('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Client-side Filtering ──────────────────────────────────────────────────
  // The API supports server-side filters, but we also filter on the client
  // so the UI feels instant without a new network request on every keystroke.
  const displayed = useMemo(() => {
    return bookings.filter((b) => {
      if (typeFilter   !== 'ALL' && b.type   !== typeFilter)   return false;
      if (statusFilter !== 'ALL' && b.status !== statusFilter)  return false;
      if (tripFilter   !== 'ALL' && b.tripId !== tripFilter)    return false;
      if (search) {
        const q = search.toLowerCase();
        const matches =
          b.provider?.toLowerCase().includes(q)     ||
          b.reference?.toLowerCase().includes(q)    ||
          b.trip?.title?.toLowerCase().includes(q)  ||
          b.trip?.destination?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [bookings, typeFilter, statusFilter, tripFilter, search]);

  // ── Summary Metrics ────────────────────────────────────────────────────────
  const metrics = useMemo(() => ({
    total:     bookings.length,
    confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
    pending:   bookings.filter((b) => b.status === 'PENDING').length,
    cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
    spend:     bookings
      .filter((b) => b.status !== 'CANCELLED')
      .reduce((s, b) => s + Number(b.amount || 0), 0),
  }), [bookings]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleStatusChange = async (booking, newStatus) => {
    try {
      await updateBooking(booking.id, { status: newStatus });
      toast.success(`Marked as ${newStatus.toLowerCase()}`);
      loadData();
    } catch {
      toast.error('Status update failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking? This cannot be undone.')) return;
    try {
      await deleteBooking(id);
      toast.success('Booking deleted.');
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch {
      toast.error('Delete failed.');
    }
  };

  const copyRef = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard! 📋');
  };

  const openCreate = () => { setEditTarget(null);  setModalOpen(true); };
  const openEdit   = (b) => { setEditTarget(b);    setModalOpen(true); };

  const resetFilters = () => {
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setTripFilter('ALL');
    setSearch('');
  };

  const hasActiveFilters = typeFilter !== 'ALL' || statusFilter !== 'ALL' || tripFilter !== 'ALL' || search;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">🎫 Bookings</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Track all your flights, hotels, car rentals, and activities in one place.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 self-start md:self-auto shadow-lg shadow-blue-500/20"
        >
          <span className="text-lg">➕</span>
          <span>Add Booking</span>
        </button>
      </div>

      {/* ── Metrics Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard title="Total"     value={metrics.total}     icon="📁" subtext="All bookings" />
        <MetricCard title="Confirmed" value={metrics.confirmed} icon="✅" color="text-emerald-400" subtext="Ready to go" />
        <MetricCard title="Pending"   value={metrics.pending}   icon="⏳" color="text-amber-400"   subtext="Awaiting confirmation" />
        <MetricCard title="Cancelled" value={metrics.cancelled} icon="❌" color="text-rose-400"    subtext="No longer active" />
        <MetricCard
          title="Total Spend"
          value={formatCurrency(metrics.spend)}
          icon="💳"
          color="text-blue-400"
          subtext="Confirmed + Pending"
        />
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div className="card border-gray-800 p-4 space-y-3">
        {/* Row 1: Type tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          {/* Type tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL',      icon: '⚡', label: 'All'        },
              { id: 'FLIGHT',   icon: '✈️', label: 'Flights'    },
              { id: 'HOTEL',    icon: '🏨', label: 'Hotels'     },
              { id: 'CAR',      icon: '🚗', label: 'Cars'       },
              { id: 'ACTIVITY', icon: '🎟️', label: 'Activities' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 whitespace-nowrap transition-all ${
                  typeFilter === t.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-2.5 text-gray-500 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search provider, PNR, trip…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-8 text-xs w-full"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-white text-xs">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Status + Trip dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-800/80">
          <span className="text-xs text-gray-500">Filter:</span>

          {/* Status */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="input text-xs py-1.5 w-auto bg-gray-800 cursor-pointer">
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">✅ Confirmed</option>
            <option value="PENDING">⏳ Pending</option>
            <option value="CANCELLED">❌ Cancelled</option>
          </select>

          {/* Trip */}
          <select value={tripFilter} onChange={(e) => setTripFilter(e.target.value)}
            className="input text-xs py-1.5 w-auto bg-gray-800 cursor-pointer max-w-[200px]">
            <option value="ALL">All Trips</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>🗺️ {t.title} ({t.destination})</option>
            ))}
          </select>

          {/* Reset button */}
          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-xs text-blue-400 hover:underline ml-auto">
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Bookings List ─────────────────────────────────────────────────── */}
      {loading ? (
        /* Skeleton */
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 border-gray-800 animate-pulse flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-800 rounded-2xl"></div>
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-gray-800 rounded"></div>
                  <div className="h-3 w-28 bg-gray-800 rounded"></div>
                </div>
              </div>
              <div className="h-8 w-24 bg-gray-800 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        /* Empty State */
        <div className="card border-gray-800 p-14 text-center space-y-4">
          <p className="text-5xl">🎫</p>
          <h3 className="text-xl font-bold text-white">No Bookings Found</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No bookings match your filters. Try resetting them.'
              : 'You haven\'t logged any bookings yet. Book a flight or hotel, or add one manually.'}
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button onClick={openCreate} className="btn-primary text-sm">
              ➕ Add Manual Booking
            </button>
            <Link to="/flights" className="btn-secondary text-sm">✈️ Search Flights</Link>
            <Link to="/hotels"  className="btn-secondary text-sm">🏨 Search Hotels</Link>
          </div>
        </div>
      ) : (
        /* Booking Cards */
        <div className="space-y-3">
          {displayed.map((b) => {
            const type   = TYPE_META[b.type]   || TYPE_META.FLIGHT;
            const status = STATUS_META[b.status] || STATUS_META.PENDING;

            return (
              <div
                key={b.id}
                className="card border-gray-800 hover:border-gray-700 p-4 md:p-5 transition-all group
                           flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: type icon + details */}
                <div className="flex items-start gap-4">
                  {/* Type icon badge */}
                  <div className={`p-3 rounded-2xl border text-xl shrink-0 ${type.bg}`}>
                    {type.icon}
                  </div>

                  <div className="space-y-1.5">
                    {/* Provider name + status badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                        {b.provider}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.badge}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Meta row: PNR, trip link, date */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      {/* PNR code with copy button */}
                      {b.reference && (
                        <span className="flex items-center gap-1 bg-gray-800 px-2 py-0.5 rounded border border-gray-700 font-mono text-[11px] text-gray-300">
                          {b.reference}
                          <button
                            onClick={() => copyRef(b.reference)}
                            className="hover:text-blue-400 transition-colors ml-0.5"
                            title="Copy PNR"
                          >
                            📋
                          </button>
                        </span>
                      )}

                      {/* Trip link */}
                      {b.trip && (
                        <Link
                          to={`/trips/${b.trip.id}`}
                          className="text-blue-400/80 hover:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          🗺️ {b.trip.destination}
                        </Link>
                      )}

                      {/* Date */}
                      <span className="text-gray-500">{formatDate(b.bookedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: amount + action buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:shrink-0
                                 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-800">
                  {/* Amount */}
                  <div className="text-right">
                    <span className="text-xs text-gray-500 block">Amount</span>
                    <span className="text-lg font-extrabold text-white">
                      {formatCurrency(Number(b.amount))}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Quick Confirm (only when pending) */}
                    {b.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatusChange(b, 'CONFIRMED')}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold
                                   bg-emerald-500/10 text-emerald-400 border border-emerald-500/30
                                   hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        Confirm
                      </button>
                    )}

                    {/* Quick Cancel (only when confirmed) */}
                    {b.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStatusChange(b, 'CANCELLED')}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500
                                   hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      >
                        Cancel
                      </button>
                    )}

                    {/* Edit */}
                    <button
                      onClick={() => openEdit(b)}
                      title="Edit booking"
                      className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                      ✏️
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(b.id)}
                      title="Delete booking"
                      className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-gray-800 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      <BookingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
        initialData={editTarget}
        trips={trips}
      />
    </div>
  );
};

export default BookingsPage;
