// src/pages/JournalPage.jsx
// Travel Journal — the main diary page.
// Shows all journal entries across all trips, with a form to add new ones.
// Users pick a trip, fill in title/content/mood/location, and save.

import { useState, useEffect } from 'react';
import { Link }                from 'react-router-dom';
import toast                   from 'react-hot-toast';
import { getAllEntries, createEntry, deleteEntry } from '../services/journal.service';
import { getMyTrips }            from '../services/trip.service';   // to populate trip selector

// ── Mood metadata ─────────────────────────────────────────────────────────────
const MOODS = {
  AMAZING:     { emoji: '🤩', label: 'Amazing',     color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  HAPPY:       { emoji: '😊', label: 'Happy',       color: 'text-green-400  bg-green-500/10  border-green-500/30'  },
  EXCITED:     { emoji: '🥳', label: 'Excited',     color: 'text-pink-400   bg-pink-500/10   border-pink-500/30'   },
  RELAXED:     { emoji: '😌', label: 'Relaxed',     color: 'text-blue-400   bg-blue-500/10   border-blue-500/30'   },
  ADVENTUROUS: { emoji: '🧗', label: 'Adventurous', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  NEUTRAL:     { emoji: '😐', label: 'Neutral',     color: 'text-gray-400   bg-gray-500/10   border-gray-500/30'   },
  TIRED:       { emoji: '😴', label: 'Tired',       color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  STRESSED:    { emoji: '😓', label: 'Stressed',    color: 'text-red-400    bg-red-500/10    border-red-500/30'    },
};

// ── Blank form state ──────────────────────────────────────────────────────────
const EMPTY_FORM = { tripId: '', title: '', content: '', mood: 'HAPPY', location: '', date: '' };

// ── Utility: format date nicely ───────────────────────────────────────────────
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

// ── Utility: first 150 chars of content as preview ───────────────────────────
const preview = (text) => text.length > 150 ? text.slice(0, 150) + '…' : text;

// ── Main Component ────────────────────────────────────────────────────────────
const JournalPage = () => {
  const [entries,   setEntries]   = useState([]);
  const [trips,     setTrips]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [moodFilter, setMoodFilter] = useState('ALL');

  // ── Load entries and trips on mount ────────────────────────────────────────
  const loadData = async () => {
    try {
      setLoading(true);
      const [entriesRes, tripsRes] = await Promise.all([getAllEntries(), getMyTrips()]);
      setEntries(entriesRes.data.data.entries);
      // getMyTrips returns { data: { data: [...trips] } }
      setTrips(Array.isArray(tripsRes.data.data) ? tripsRes.data.data : []);
    } catch {
      toast.error('Failed to load journal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Submit new entry ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tripId) { toast.error('Please select a trip.'); return; }
    if (!form.title.trim()) { toast.error('Please enter a title.'); return; }
    if (!form.content.trim()) { toast.error('Please write something!'); return; }

    try {
      setSaving(true);
      await createEntry(form.tripId, form);
      toast.success('Journal entry saved! 📔');
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save entry.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete entry ────────────────────────────────────────────────────────────
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteEntry(id);
      toast.success('Entry deleted.');
      loadData();
    } catch {
      toast.error('Failed to delete.');
    }
  };

  // ── Apply mood filter ───────────────────────────────────────────────────────
  const filtered = moodFilter === 'ALL'
    ? entries
    : entries.filter((e) => e.mood === moodFilter);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">📔 Travel Journal</h1>
          <p className="text-gray-400 text-sm mt-1">
            {entries.length} {entries.length === 1 ? 'memory' : 'memories'} recorded
          </p>
        </div>
        <button
          id="new-entry-btn"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold
                     rounded-xl text-sm transition-colors shrink-0"
        >
          {showForm ? '✕ Cancel' : '+ New Entry'}
        </button>
      </div>

      {/* ── Write form ───────────────────────────────────────────────────── */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-8 space-y-4"
        >
          <h2 className="text-white font-bold text-lg">📝 Write a New Memory</h2>

          {/* Trip selector */}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Trip *</label>
            <select
              id="journal-trip"
              value={form.tripId}
              onChange={(e) => setForm({ ...form, tripId: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl
                         px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">— Select a trip —</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.destination})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Title *</label>
              <input
                id="journal-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Sunrise at the Taj Mahal"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl
                           px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Date</label>
              <input
                id="journal-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl
                           px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Location</label>
              <input
                id="journal-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Agra, Uttar Pradesh"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl
                           px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Mood selector */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">How did you feel?</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(MOODS).map(([key, { emoji, label }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm({ ...form, mood: key })}
                    title={label}
                    className={`flex flex-col items-center py-2 rounded-xl border text-lg transition-all
                      ${form.mood === key
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}
                  >
                    {emoji}
                    <span className="text-[9px] text-gray-400 mt-0.5 leading-none">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content textarea */}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Your story *</label>
            <textarea
              id="journal-content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Describe what happened today, how you felt, what you saw..."
              rows={6}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl
                         px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors
                         resize-none leading-relaxed"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50
                         text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {saving ? 'Saving…' : '💾 Save Entry'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300
                         font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Mood filter bar ───────────────────────────────────────────────── */}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setMoodFilter('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
              ${moodFilter === 'ALL'
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'}`}
          >
            All
          </button>
          {Object.entries(MOODS).map(([key, { emoji, label }]) => (
            <button
              key={key}
              onClick={() => setMoodFilter(moodFilter === key ? 'ALL' : key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                ${moodFilter === key
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'}`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Entry list ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 rounded-2xl h-36 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📖</div>
          <h3 className="text-white font-bold text-lg mb-1">
            {entries.length === 0 ? 'Your journal is empty' : 'No entries match this mood'}
          </h3>
          <p className="text-gray-500 text-sm">
            {entries.length === 0
              ? 'Start recording your travel memories!'
              : 'Try a different mood filter.'}
          </p>
          {entries.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl
                         text-sm font-semibold transition-colors"
            >
              + Write First Entry
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((entry) => {
            const mood = MOODS[entry.mood] || MOODS.HAPPY;
            return (
              <article
                key={entry.id}
                className="bg-gray-900 border border-gray-800 hover:border-gray-700
                           rounded-2xl p-5 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Mood bubble */}
                  <span className={`text-2xl p-2.5 rounded-xl border shrink-0 ${mood.color}`}>
                    {mood.emoji}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <h3 className="text-white font-bold text-base">{entry.title}</h3>
                      {/* Trip badge */}
                      {entry.trip && (
                        <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">
                          🧳 {entry.trip.destination}
                        </span>
                      )}
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
                      <span>📅 {fmtDate(entry.date)}</span>
                      {entry.location && <span>📍 {entry.location}</span>}
                    </div>

                    {/* Content preview */}
                    <p className="text-gray-400 text-sm leading-relaxed">{preview(entry.content)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <Link
                      to={`/journal/${entry.id}`}
                      id={`view-entry-${entry.id}`}
                      className="p-2 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all text-sm"
                      title="Read full entry"
                    >
                      👁️
                    </Link>
                    <button
                      id={`delete-entry-${entry.id}`}
                      onClick={() => handleDelete(entry.id, entry.title)}
                      className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
                      title="Delete entry"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JournalPage;
