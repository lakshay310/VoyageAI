// src/pages/ReviewsPage.jsx
// Reviews & Ratings — users can write reviews for hotels, flights, and trips.
// Shows the user's own submitted reviews with edit/delete options.
// Also allows writing a new review directly from this page.

import { useState, useEffect } from 'react';
import toast                   from 'react-hot-toast';
import StarRating              from '../components/StarRating';
import { getMyReviews, submitReview, updateReview, deleteReview } from '../services/review.service';
import { getMyTrips }         from '../services/trip.service';
import { getPopularHotels }   from '../services/hotel.service';

// ── Target type metadata ───────────────────────────────────────────────────────
const TARGET_META = {
  HOTEL:  { label: 'Hotel',  emoji: '🏨', color: 'bg-blue-500/10   text-blue-300   border-blue-500/30'   },
  FLIGHT: { label: 'Flight', emoji: '✈️', color: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
  TRIP:   { label: 'Trip',   emoji: '🧳', color: 'bg-green-500/10  text-green-300  border-green-500/30'  },
};

// ── Blank form ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = { targetType: 'HOTEL', targetId: '', rating: 0, comment: '' };

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const ReviewsPage = () => {
  const [reviews,     setReviews]   = useState([]);
  const [trips,       setTrips]     = useState([]);
  const [hotels,      setHotels]    = useState([]);
  const [loading,     setLoading]   = useState(true);
  const [showForm,    setShowForm]  = useState(false);
  const [form,        setForm]      = useState(EMPTY_FORM);
  const [saving,      setSaving]    = useState(false);
  const [editingId,   setEditingId] = useState(null);  // ID of review being edited

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = async () => {
    try {
      setLoading(true);
      const [reviewsRes, tripsRes, hotelsRes] = await Promise.all([
        getMyReviews(),
        getMyTrips(),
        getPopularHotels(),
      ]);
      setReviews(reviewsRes.data.data.reviews);
      setTrips(Array.isArray(tripsRes.data.data) ? tripsRes.data.data : []);
      setHotels(hotelsRes.data.data?.hotels || hotelsRes.data.data || []);
    } catch {
      toast.error('Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Submit / update ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.targetId)  { toast.error('Please select what you are reviewing.'); return; }
    if (form.rating < 1) { toast.error('Please select a star rating.'); return; }

    try {
      setSaving(true);
      if (editingId) {
        await updateReview(editingId, { rating: form.rating, comment: form.comment });
        toast.success('Review updated!');
        setEditingId(null);
      } else {
        await submitReview(form);
        toast.success('Review submitted! ⭐');
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteReview(id);
      toast.success('Review deleted.');
      loadData();
    } catch {
      toast.error('Failed to delete.');
    }
  };

  // ── Start editing ──────────────────────────────────────────────────────────
  const startEdit = (review) => {
    setEditingId(review.id);
    setForm({
      targetType: review.targetType,
      targetId:   review.targetId,
      rating:     review.rating,
      comment:    review.comment || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => {
    setShowForm(false); setEditingId(null); setForm(EMPTY_FORM);
  };

  // ── Dropdown options for each target type ──────────────────────────────────
  const getOptions = () => {
    if (form.targetType === 'TRIP')   return trips.map(t => ({ id: t.id, label: `${t.title} — ${t.destination}` }));
    if (form.targetType === 'HOTEL')  return hotels.map(h => ({ id: h.id, label: `${h.name} — ${h.city}` }));
    if (form.targetType === 'FLIGHT') return []; // flights not easily listed; user pastes ID
    return [];
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">⭐ Reviews & Ratings</h1>
          <p className="text-gray-400 text-sm mt-1">
            {reviews.length} review{reviews.length !== 1 ? 's' : ''} submitted
          </p>
        </div>
        <button
          id="write-review-btn"
          onClick={() => { cancelForm(); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold
                     rounded-xl text-sm transition-colors shrink-0"
        >
          + Write a Review
        </button>
      </div>

      {/* ── Review form ────────────────────────────────────────────────── */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-8 space-y-4"
        >
          <h2 className="text-white font-bold text-lg">
            {editingId ? '✏️ Edit Review' : '⭐ Write a Review'}
          </h2>

          {/* Only show target type + item selector when creating (not editing) */}
          {!editingId && (
            <>
              {/* Target type tabs */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">What are you reviewing?</label>
                <div className="flex gap-2">
                  {Object.entries(TARGET_META).map(([key, { label, emoji }]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm({ ...form, targetType: key, targetId: '' })}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all
                        ${form.targetType === key
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}
                    >
                      {emoji} {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Item selector */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">
                  Select {TARGET_META[form.targetType].label}
                </label>
                {form.targetType === 'FLIGHT' ? (
                  <input
                    id="review-target-id"
                    value={form.targetId}
                    onChange={(e) => setForm({ ...form, targetId: e.target.value })}
                    placeholder="Paste the Flight ID here"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl
                               px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                ) : (
                  <select
                    id="review-target-id"
                    value={form.targetId}
                    onChange={(e) => setForm({ ...form, targetId: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl
                               px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">— Select —</option>
                    {getOptions().map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </>
          )}

          {/* Star rating picker */}
          <div>
            <label className="text-xs text-gray-400 block mb-2">Your Rating *</label>
            <StarRating
              value={form.rating}
              onChange={(r) => setForm({ ...form, rating: r })}
              size="lg"
            />
            {form.rating > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'][form.rating]} — {form.rating}/5
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Your Review (optional)</label>
            <textarea
              id="review-comment"
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="Tell others about your experience..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl
                         px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors
                         resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50
                         text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {saving ? 'Saving…' : editingId ? 'Save Changes' : '⭐ Submit Review'}
            </button>
            <button
              type="button" onClick={cancelForm}
              className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300
                         font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Reviews list ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-900 rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">⭐</p>
          <h3 className="text-white font-bold text-lg mb-1">No reviews yet</h3>
          <p className="text-gray-500 text-sm">Share your experience — help other travellers!</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-6 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white
                       rounded-xl text-sm font-semibold transition-colors"
          >
            + Write Your First Review
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const meta = TARGET_META[review.targetType] || TARGET_META.HOTEL;
            return (
              <div
                key={review.id}
                className="bg-gray-900 border border-gray-800 hover:border-gray-700
                           rounded-2xl p-5 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Type badge + date */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>
                        {meta.emoji} {meta.label}
                      </span>
                      <span className="text-xs text-gray-500">📅 {fmtDate(review.createdAt)}</span>
                    </div>

                    {/* Stars */}
                    <StarRating value={review.rating} size="md" />

                    {/* Comment */}
                    {review.comment && (
                      <p className="text-gray-300 text-sm mt-2 leading-relaxed">
                        "{review.comment}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    <button
                      id={`edit-review-${review.id}`}
                      onClick={() => startEdit(review)}
                      className="p-2 rounded-lg text-gray-500 hover:text-blue-400
                                 hover:bg-blue-500/10 transition-all text-sm"
                      title="Edit"
                    >✏️</button>
                    <button
                      id={`delete-review-${review.id}`}
                      onClick={() => handleDelete(review.id)}
                      className="p-2 rounded-lg text-gray-500 hover:text-red-400
                                 hover:bg-red-500/10 transition-all text-sm"
                      title="Delete"
                    >🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
