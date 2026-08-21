// src/pages/JournalEntryPage.jsx
// Shows a single journal entry in full — the complete diary page.
// Also has an inline edit form so the user can update the entry.

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getEntry, updateEntry, deleteEntry } from '../services/journal.service';

// Mood metadata (same as JournalPage — keep in sync)
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

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

const JournalEntryPage = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();

  const [entry,    setEntry]   = useState(null);
  const [loading,  setLoading] = useState(true);
  const [editing,  setEditing] = useState(false);
  const [form,     setForm]    = useState({});
  const [saving,   setSaving]  = useState(false);

  // Load the entry
  const loadEntry = async () => {
    try {
      setLoading(true);
      const res = await getEntry(id);
      setEntry(res.data.data);
      setForm({
        title:    res.data.data.title,
        content:  res.data.data.content,
        mood:     res.data.data.mood,
        location: res.data.data.location || '',
        date:     res.data.data.date?.slice(0, 10) || '',
      });
    } catch {
      toast.error('Entry not found.');
      navigate('/journal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEntry(); }, [id]);

  // Save edits
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateEntry(id, form);
      toast.success('Entry updated!');
      setEditing(false);
      loadEntry();
    } catch {
      toast.error('Failed to update.');
    } finally {
      setSaving(false);
    }
  };

  // Delete and go back
  const handleDelete = async () => {
    if (!window.confirm('Delete this journal entry? This cannot be undone.')) return;
    try {
      await deleteEntry(id);
      toast.success('Entry deleted.');
      navigate('/journal');
    } catch {
      toast.error('Failed to delete.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="h-8  bg-gray-800 rounded-xl animate-pulse w-2/3" />
          <div className="h-4  bg-gray-800 rounded-xl animate-pulse w-1/3" />
          <div className="h-64 bg-gray-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!entry) return null;

  const mood = MOODS[entry.mood] || MOODS.HAPPY;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* ── Back link ──────────────────────────────────────────────────── */}
      <Link
        to="/journal"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm
                   mb-6 transition-colors"
      >
        ← Back to Journal
      </Link>

      {/* ── View mode ──────────────────────────────────────────────────── */}
      {!editing ? (
        <article className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

          {/* Top bar */}
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Mood bubble */}
              <span className={`text-3xl p-3 rounded-xl border ${mood.color}`}>
                {mood.emoji}
              </span>
              <div>
                <p className="text-xs text-gray-500">{mood.label} day</p>
                {entry.trip && (
                  <Link
                    to={`/trips/${entry.trip.id}`}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    🧳 {entry.trip.title} ({entry.trip.destination})
                  </Link>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                id="edit-entry-btn"
                onClick={() => setEditing(true)}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300
                           text-xs font-semibold rounded-xl transition-colors"
              >
                ✏️ Edit
              </button>
              <button
                id="delete-entry-btn"
                onClick={handleDelete}
                className="px-3 py-1.5 bg-gray-800 hover:bg-red-900/40 text-gray-400
                           hover:text-red-400 text-xs font-semibold rounded-xl transition-colors"
              >
                🗑️ Delete
              </button>
            </div>
          </div>

          {/* Title & meta */}
          <div className="px-6 py-5 border-b border-gray-800">
            <h1 className="text-2xl font-black text-white mb-3">{entry.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>📅 {fmtDate(entry.date)}</span>
              {entry.location && <span>📍 {entry.location}</span>}
            </div>
          </div>

          {/* Journal content — preserve paragraphs */}
          <div className="px-6 py-6">
            {entry.content.split('\n').map((para, i) => (
              para.trim()
                ? <p key={i} className="text-gray-300 text-base leading-relaxed mb-4">{para}</p>
                : <br key={i} />
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-800 text-xs text-gray-600">
            Last updated: {new Date(entry.updatedAt).toLocaleString('en-IN')}
          </div>
        </article>
      ) : (
        /* ── Edit mode ──────────────────────────────────────────────────── */
        <form
          onSubmit={handleSave}
          className="bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4"
        >
          <h2 className="text-white font-bold text-lg">✏️ Edit Entry</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Title</label>
              <input
                id="edit-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl
                           px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Date</label>
              <input
                id="edit-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl
                           px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 block mb-1.5">Location</label>
              <input
                id="edit-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl
                           px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Mood picker */}
          <div>
            <label className="text-xs text-gray-400 block mb-2">Mood</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {Object.entries(MOODS).map(([key, { emoji, label }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, mood: key })}
                  title={label}
                  className={`flex flex-col items-center py-2 rounded-xl border text-xl transition-all
                    ${form.mood === key
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}
                >
                  {emoji}
                  <span className="text-[9px] text-gray-400 mt-0.5">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Story</label>
            <textarea
              id="edit-content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={10}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl
                         px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors
                         resize-none leading-relaxed"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50
                         text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {saving ? 'Saving…' : '💾 Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300
                         font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default JournalEntryPage;
