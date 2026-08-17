// src/pages/WishlistPage.jsx
// Travel Bucket List — users can save dream destinations,
// set priority, categorize them, and mark them as visited.

import { useState, useEffect } from 'react';
import toast                   from 'react-hot-toast';
import {
  getWishlist,
  addToWishlist,
  updateWishlistItem,
  removeFromWishlist,
} from '../services/wishlist.service';

// ── Constants ─────────────────────────────────────────────────────────────────

// Category metadata: label, emoji, colour
const CATEGORIES = {
  DOMESTIC:      { label: 'Domestic',      emoji: '🇮🇳', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  INTERNATIONAL: { label: 'International', emoji: '🌍', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30'       },
  ADVENTURE:     { label: 'Adventure',     emoji: '🏔️', color: 'bg-green-500/20 text-green-300 border-green-500/30'     },
  BEACH:         { label: 'Beach',         emoji: '🏖️', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'        },
  CULTURAL:      { label: 'Cultural',      emoji: '🏛️', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30'  },
  WILDLIFE:      { label: 'Wildlife',      emoji: '🦁', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
};

// Priority metadata
const PRIORITIES = {
  1: { label: 'High',   color: 'text-red-400',    dot: 'bg-red-400'    },
  2: { label: 'Medium', color: 'text-yellow-400', dot: 'bg-yellow-400' },
  3: { label: 'Low',    color: 'text-gray-400',   dot: 'bg-gray-500'   },
};

// ── Empty add-item form state ─────────────────────────────────────────────────
const EMPTY_FORM = {
  destination: '',
  country:     '',
  category:    'INTERNATIONAL',
  notes:       '',
  priority:    2,
};

// ── Main Component ────────────────────────────────────────────────────────────
const WishlistPage = () => {
  const [items,       setItems]       = useState([]);
  const [stats,       setStats]       = useState({ total: 0, visited: 0, remaining: 0 });
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [filterCat,   setFilterCat]   = useState('ALL'); // category filter
  const [filterVisit, setFilterVisit] = useState('ALL'); // ALL | PENDING | VISITED
  const [editingId,   setEditingId]   = useState(null);  // ID of item being edited

  // ── Fetch wishlist on mount ─────────────────────────────────────────────────
  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await getWishlist();
      setItems(res.data.data.items);
      setStats(res.data.data.stats);
    } catch {
      toast.error('Failed to load wishlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWishlist(); }, []);

  // ── Add or update a wishlist item ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.destination.trim()) { toast.error('Please enter a destination.'); return; }

    try {
      setSaving(true);
      if (editingId) {
        // Update existing item
        await updateWishlistItem(editingId, form);
        toast.success('Destination updated!');
        setEditingId(null);
      } else {
        // Add new item
        await addToWishlist(form);
        toast.success(`${form.destination} added to your bucket list! 🌟`);
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchWishlist();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle visited status ───────────────────────────────────────────────────
  const toggleVisited = async (item) => {
    try {
      await updateWishlistItem(item.id, { visited: !item.visited });
      toast.success(
        item.visited ? 'Marked as not visited.' : `Dream achieved! You visited ${item.destination} 🎉`
      );
      fetchWishlist();
    } catch {
      toast.error('Failed to update.');
    }
  };

  // ── Delete item ─────────────────────────────────────────────────────────────
  const handleDelete = async (id, destination) => {
    if (!window.confirm(`Remove ${destination} from your wishlist?`)) return;
    try {
      await removeFromWishlist(id);
      toast.success('Removed from wishlist.');
      fetchWishlist();
    } catch {
      toast.error('Failed to remove.');
    }
  };

  // ── Start editing ───────────────────────────────────────────────────────────
  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      destination: item.destination,
      country:     item.country || '',
      category:    item.category,
      notes:       item.notes || '',
      priority:    item.priority,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  // ── Apply filters ───────────────────────────────────────────────────────────
  const filtered = items.filter((item) => {
    const catOk  = filterCat   === 'ALL'     || item.category === filterCat;
    const visitOk = filterVisit === 'ALL'     ||
                   (filterVisit === 'PENDING' && !item.visited) ||
                   (filterVisit === 'VISITED' && item.visited);
    return catOk && visitOk;
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">✈️ Travel Bucket List</h1>
          <p className="text-gray-400 text-sm mt-1">Your dream destinations, all in one place</p>
        </div>
        <button
          id="add-wishlist-btn"
          onClick={() => { cancelForm(); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold
                     rounded-xl text-sm transition-colors shrink-0"
        >
          + Add Destination
        </button>
      </div>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Saved',  value: stats.total,     emoji: '🌍' },
          { label: 'Visited',      value: stats.visited,   emoji: '✅' },
          { label: 'Still To Go',  value: stats.remaining, emoji: '🎯' },
        ].map(({ label, value, emoji }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-2xl mb-1">{emoji}</p>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Add / Edit form ──────────────────────────────────────────────── */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-white font-bold mb-5">
            {editingId ? '✏️ Edit Destination' : '🌟 Add Dream Destination'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Destination */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Destination *</label>
              <input
                id="wishlist-destination"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                placeholder="e.g. Santorini, Bali, Ladakh"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl
                           px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Country */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Country</label>
              <input
                id="wishlist-country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="e.g. Greece, Indonesia, India"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl
                           px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Category</label>
              <select
                id="wishlist-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl
                           px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                {Object.entries(CATEGORIES).map(([key, { label, emoji }]) => (
                  <option key={key} value={key}>{emoji} {label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Priority</label>
              <select
                id="wishlist-priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl
                           px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value={1}>🔴 High — Must visit!</option>
                <option value={2}>🟡 Medium — Would love to</option>
                <option value={3}>⚪ Low — Someday maybe</option>
              </select>
            </div>

            {/* Notes — spans full width */}
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 block mb-1.5">Personal Notes</label>
              <textarea
                id="wishlist-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. Go during spring for cherry blossoms, avoid peak summer..."
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl
                           px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white
                         font-semibold rounded-xl text-sm transition-colors"
            >
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add to Bucket List'}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold
                         rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Category filter chips */}
        <button
          onClick={() => setFilterCat('ALL')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
            ${filterCat === 'ALL'
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'}`}
        >
          All
        </button>
        {Object.entries(CATEGORIES).map(([key, { label, emoji }]) => (
          <button
            key={key}
            onClick={() => setFilterCat(filterCat === key ? 'ALL' : key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
              ${filterCat === key
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'}`}
          >
            {emoji} {label}
          </button>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Visited filter */}
        {['ALL', 'PENDING', 'VISITED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterVisit(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
              ${filterVisit === f
                ? 'bg-gray-700 border-gray-500 text-white'
                : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'}`}
          >
            {f === 'ALL' ? '🗺️ All' : f === 'PENDING' ? '⏳ Pending' : '✅ Visited'}
          </button>
        ))}
      </div>

      {/* ── Wishlist cards ────────────────────────────────────────────────── */}
      {loading ? (
        // Skeleton loading cards
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-900 rounded-2xl h-44 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        // Empty state
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🌏</div>
          <h3 className="text-white font-bold text-lg mb-1">
            {items.length === 0 ? 'Your bucket list is empty' : 'No destinations match your filter'}
          </h3>
          <p className="text-gray-500 text-sm">
            {items.length === 0
              ? 'Add your first dream destination above!'
              : 'Try a different category or filter.'}
          </p>
          {items.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl
                         text-sm font-semibold transition-colors"
            >
              + Add First Destination
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const cat  = CATEGORIES[item.category] || CATEGORIES.INTERNATIONAL;
            const prio = PRIORITIES[item.priority]  || PRIORITIES[2];

            return (
              <div
                key={item.id}
                className={`relative bg-gray-900 border rounded-2xl p-5 flex flex-col gap-3 transition-all
                  ${item.visited
                    ? 'border-green-500/30 opacity-75'
                    : 'border-gray-800 hover:border-gray-700'}`}
              >
                {/* Visited ribbon */}
                {item.visited && (
                  <div className="absolute top-3 right-3 bg-green-500/20 text-green-400 text-[10px]
                                  font-bold px-2 py-0.5 rounded-full border border-green-500/30">
                    ✅ VISITED
                  </div>
                )}

                {/* Top row: category tag + priority dot */}
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cat.color}`}>
                    {cat.emoji} {cat.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${prio.dot}`} />
                    <span className={`text-[11px] font-medium ${prio.color}`}>{prio.label}</span>
                  </div>
                </div>

                {/* Destination name */}
                <div>
                  <h3 className={`font-bold text-base leading-tight
                    ${item.visited ? 'text-gray-400 line-through' : 'text-white'}`}>
                    {item.destination}
                  </h3>
                  {item.country && (
                    <p className="text-gray-500 text-xs mt-0.5">📍 {item.country}</p>
                  )}
                </div>

                {/* Notes */}
                {item.notes && (
                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 italic">
                    "{item.notes}"
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-800">
                  {/* Toggle visited */}
                  <button
                    id={`visited-btn-${item.id}`}
                    onClick={() => toggleVisited(item)}
                    title={item.visited ? 'Mark as not visited' : 'Mark as visited'}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all
                      ${item.visited
                        ? 'bg-gray-800 text-gray-400 hover:bg-red-900/30 hover:text-red-400'
                        : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30'}`}
                  >
                    {item.visited ? 'Unmark' : '🎉 Mark Visited'}
                  </button>

                  {/* Edit */}
                  <button
                    id={`edit-wishlist-${item.id}`}
                    onClick={() => startEdit(item)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10
                               transition-all"
                    title="Edit"
                  >
                    ✏️
                  </button>

                  {/* Delete */}
                  <button
                    id={`delete-wishlist-${item.id}`}
                    onClick={() => handleDelete(item.id, item.destination)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10
                               transition-all"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
