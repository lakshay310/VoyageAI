// src/pages/AIPlannerPage.jsx
// The AI trip planner feature page.
// User fills in trip preferences → we call Gemini API → display the itinerary.
// After generation, user can save the trip (with itinerary) to the database.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { generateItinerary } from '../services/ai.service';
import { createTrip } from '../services/trip.service';

// ─── Data ─────────────────────────────────────────────────────────────────────

const TRAVEL_STYLES = [
  { value: 'budget', label: '🎒 Budget', desc: 'Hostels, street food, local transport' },
  { value: 'balanced', label: '🏨 Balanced', desc: 'Mid-range hotels, mix of experiences' },
  { value: 'luxury', label: '💎 Luxury', desc: 'Premium hotels, fine dining, private transfers' },
];

const INTEREST_TAGS = [
  'Culture & History', 'Street Food', 'Nature & Hiking',
  'Adventure Sports', 'Beaches', 'Shopping',
  'Nightlife', 'Temples & Spirituality', 'Photography',
  'Local Markets', 'Museums', 'Wildlife',
];

const EMPTY_FORM = {
  destination: '',
  days: '5',
  budget: '30000',
  travelStyle: 'balanced',
  interests: [],
};

// ─── Itinerary Display ────────────────────────────────────────────────────────
// Renders the markdown text from Gemini with nice formatting.

const ItineraryDisplay = ({ text }) => {
  // Split by lines and apply simple markdown-like rendering
  const lines = text.split('\n');

  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        // **Bold section headers** (e.g. **Day 1: Arrival**)
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <h3 key={i} className="text-white font-bold text-base mt-5 first:mt-0 border-b border-gray-700 pb-1">
              {line.replace(/\*\*/g, '')}
            </h3>
          );
        }
        // **Label:** value pairs (e.g. **Budget Breakdown:**)
        if (line.includes('**') && line.includes(':')) {
          const formatted = line.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-blue-400">$1</strong>');
          return <p key={i} className="text-gray-300" dangerouslySetInnerHTML={{ __html: formatted }} />;
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
        // Empty lines
        if (!line.trim()) return <div key={i} className="h-1" />;

        // Regular text
        return <p key={i} className="text-gray-300">{line}</p>;
      })}
    </div>
  );
};

// ─── Loading Animation ────────────────────────────────────────────────────────

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-4">
    {/* Animated plane */}
    <div className="text-5xl animate-bounce">✈️</div>
    <div className="text-white font-semibold text-lg">Planning your trip...</div>
    <p className="text-gray-400 text-sm text-center max-w-xs">
      Our AI is crafting a personalised itinerary for you. This takes about 10–15 seconds.
    </p>
    {/* Pulsing dots */}
    <div className="flex gap-2 mt-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AIPlannerPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false); // true while saving to database
  const [itinerary, setItinerary] = useState(null); // the generated text
  const [currency, setCurrency] = useState(null);   // { code, symbol, rate, budgetLocal } from backend

  /** Toggle an interest tag on/off */
  const toggleInterest = (tag) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(tag)
        ? prev.interests.filter((t) => t !== tag)  // remove
        : [...prev.interests, tag],                 // add
    }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!form.destination.trim()) {
      toast.error('Please enter a destination.');
      return;
    }

    setLoading(true);
    setItinerary(null); // clear previous result
    setCurrency(null);

    try {
      const res = await generateItinerary({
        ...form,
        interests: form.interests.length > 0
          ? form.interests.join(', ')  // convert array → comma-separated string
          : 'culture, food, sightseeing',
      });

      // Backend now returns { itinerary, currency } in res.data.data
      setItinerary(res.data.data.itinerary);
      setCurrency(res.data.data.currency);
      toast.success('Itinerary ready! 🎉');
    } catch (err) {
      const msg = err.response?.data?.message || 'AI generation failed.';
      toast.error(msg);
      // Show a helpful message if the API key is missing
      if (msg.includes('API key')) {
        setItinerary('⚠️ **Setup Required**\n\nPlease add your Gemini API key to the backend `.env` file:\n```\nGEMINI_API_KEY=your_key_here\n```\nGet a free key at https://aistudio.google.com/app/apikey');
      }
    } finally {
      setLoading(false);
    }
  };

  /** Reset everything to start over */
  const handleReset = () => {
    setItinerary(null);
    setCurrency(null);
    setForm(EMPTY_FORM);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Save the generated trip + itinerary to the database.
   * We auto-calculate start/end dates from today + the number of days.
   */
  const handleSaveTrip = async () => {
    setSaving(true);
    try {
      // Calculate start date (today) and end date (today + N days)
      const startDate = new Date();
      const endDate   = new Date();
      endDate.setDate(endDate.getDate() + parseInt(form.days, 10) - 1);

      await createTrip({
        title:       `${form.destination} Trip`,  // auto-generate a title
        destination: form.destination,
        startDate:   startDate.toISOString(),
        endDate:     endDate.toISOString(),
        budget:      parseFloat(form.budget),
        notes:       `Style: ${form.travelStyle}. Interests: ${form.interests.join(', ')}`,
        itinerary,   // the AI-generated markdown text
      });

      toast.success('Trip saved! 🎉 Find it in My Trips.');
      navigate('/trips'); // redirect to the trips list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save trip.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          🤖 AI Trip Planner
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Tell us your preferences and get a complete day-by-day itinerary powered by Google Gemini.
        </p>
      </div>

      {/* ── Two-column layout: Form + Output ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Input Form (2 cols on desktop) ─────────────────────────── */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleGenerate}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5 sticky top-20"
          >
            <h2 className="text-white font-semibold">Trip Preferences</h2>

            {/* Destination */}
            <div>
              <label className="label">Where to? 📍 <span className="text-gray-500 font-normal">(India or International)</span></label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Paris, France or Goa, India"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                required
              />
              {/* Quick destination chips — India & International */}
              <div className="mt-2 space-y-2">
                <p className="text-gray-600 text-[10px] font-semibold uppercase tracking-wider">🇮🇳 India</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Goa', 'Manali', 'Jaipur', 'Kerala', 'Leh Ladakh', 'Varanasi'].map((d) => (
                    <button type="button" key={d} onClick={() => setForm({ ...form, destination: d })}
                      className="px-2.5 py-1 rounded-lg text-xs bg-gray-800 hover:bg-blue-600/20 text-gray-400 hover:text-blue-400 border border-gray-700 hover:border-blue-500/40 transition-all">
                      {d}
                    </button>
                  ))}
                </div>
                <p className="text-gray-600 text-[10px] font-semibold uppercase tracking-wider mt-1">🌍 International</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Dubai, UAE', 'Bangkok, Thailand', 'Singapore', 'Paris, France', 'Bali, Indonesia', 'Tokyo, Japan', 'London, UK', 'New York, USA'].map((d) => (
                    <button type="button" key={d} onClick={() => setForm({ ...form, destination: d })}
                      className="px-2.5 py-1 rounded-lg text-xs bg-gray-800 hover:bg-purple-600/20 text-gray-400 hover:text-purple-400 border border-gray-700 hover:border-purple-500/40 transition-all">
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Days + Budget side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Duration (days)</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  max="30"
                  value={form.days}
                  onChange={(e) => setForm({ ...form, days: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Budget (₹) <span className="text-gray-600 font-normal">total trip</span></label>
                <input
                  type="number"
                  className="input"
                  min="5000"
                  step="5000"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                />
                {/* Contextual budget hints */}
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {[
                    { label: '🏖️ Goa 5D', value: 25000 },
                    { label: '🇦🇪 Dubai 5D', value: 120000 },
                    { label: '🇫🇷 Europe 7D', value: 200000 },
                    { label: '🇹🇭 Bangkok 5D', value: 75000 },
                    { label: '🇺🇸 USA 10D', value: 350000 },
                    { label: '🇯🇵 Japan 7D', value: 180000 },
                  ].map((preset) => (
                    <button type="button" key={preset.label}
                      onClick={() => setForm({ ...form, budget: preset.value.toString() })}
                      className="text-[10px] px-1.5 py-1 rounded-lg bg-gray-800/80 hover:bg-blue-600/20 text-gray-500 hover:text-blue-400 border border-gray-700/60 hover:border-blue-500/40 transition-all truncate">
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Travel style — button group */}
            <div>
              <label className="label">Travel Style</label>
              <div className="grid grid-cols-3 gap-2">
                {TRAVEL_STYLES.map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => setForm({ ...form, travelStyle: style.value })}
                    className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all duration-200 ${form.travelStyle === style.value
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                      }`}
                  >
                    <div className="text-base mb-0.5">{style.label.split(' ')[0]}</div>
                    <div>{style.label.split(' ').slice(1).join(' ')}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Interest tags */}
            <div>
              <label className="label">
                Interests
                <span className="text-gray-600 font-normal ml-1">(pick any)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-all duration-200 ${form.interests.includes(tag)
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                        : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400'
                      }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base animate-pulse-glow"
            >
              {loading ? '✨ Generating...' : '✨ Generate Itinerary'}
            </button>
          </form>
        </div>

        {/* ── Itinerary Output (3 cols on desktop) ────────────────────── */}
        <div className="lg:col-span-3">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 min-h-[400px]">

            {/* Empty state */}
            {!loading && !itinerary && (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-white font-semibold text-lg mb-2">Your itinerary will appear here</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  Fill in your trip preferences on the left and click "Generate Itinerary" to get started.
                </p>

                {/* Example suggestions */}
                <div className="mt-8 text-left w-full max-w-sm">
                  <p className="text-gray-600 text-xs uppercase tracking-wider mb-3">Try these destinations</p>
                  <div className="flex flex-wrap gap-2">
                    {['Goa, India', 'Manali, India', 'Jaipur, India', 'Bangkok, Thailand', 'Bali, Indonesia'].map((dest) => (
                      <button
                        key={dest}
                        onClick={() => setForm((f) => ({ ...f, destination: dest }))}
                        className="px-3 py-1.5 text-xs bg-gray-800 text-gray-400 rounded-lg border border-gray-700 hover:border-blue-500/50 hover:text-blue-400 transition-colors"
                      >
                        {dest}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Loading spinner */}
            {loading && <LoadingSpinner />}

            {/* Generated itinerary */}
            {!loading && itinerary && (
              <>
                {/* Itinerary header */}
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-800">
                  <div>
                    <h2 className="text-white font-bold text-lg">
                      ✈️ {form.destination} — {form.days}-Day Plan
                    </h2>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {form.travelStyle.charAt(0).toUpperCase() + form.travelStyle.slice(1)} style ·
                      Budget: ₹{parseInt(form.budget).toLocaleString('en-IN')}
                      {currency && currency.code !== 'INR' && (
                        <span className="ml-1 text-emerald-400 font-semibold">
                          = {currency.symbol}{currency.budgetLocal?.toLocaleString()} {currency.code}
                        </span>
                      )}
                    </p>
                  </div>
                  {/* Action buttons */}
                  <div className="flex gap-2 flex-shrink-0 flex-wrap">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(itinerary);
                        toast.success('Copied to clipboard!');
                      }}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      📋 Copy
                    </button>
                    <button onClick={handleReset} className="btn-secondary text-xs py-1.5 px-3">
                      🔄 New Plan
                    </button>
                    {/* Save Trip — creates a Trip record in the database with the itinerary */}
                    <button
                      onClick={handleSaveTrip}
                      disabled={saving}
                      className="btn-primary text-xs py-1.5 px-3 disabled:opacity-60"
                    >
                      {saving ? '💾 Saving...' : '💾 Save Trip'}
                    </button>
                  </div>
                </div>

                {/* Currency Banner — shown for international trips */}
                {currency && currency.code !== 'INR' && (
                  <div className="mb-4 bg-emerald-950/30 border border-emerald-700/30 rounded-xl p-3">
                    <p className="text-emerald-400 text-xs font-bold mb-1.5">💱 Currency Reference for {currency.country}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[1000, 5000, 10000, 50000].map((inr) => (
                        <div key={inr} className="bg-emerald-950/40 rounded-lg p-2 text-center">
                          <div className="text-xs text-gray-400">₹{inr.toLocaleString('en-IN')}</div>
                          <div className="text-sm font-bold text-emerald-300">
                            {currency.symbol}{Math.round(inr / currency.rate).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-500">{currency.code}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-gray-500 text-[10px] mt-1.5">
                      Rate: 1 {currency.code} ≈ ₹{currency.rate} · Your budget: ₹{currency.budgetINR?.toLocaleString('en-IN')} = {currency.symbol}{currency.budgetLocal?.toLocaleString()} {currency.code}
                    </p>
                  </div>
                )}

                {/* Rendered itinerary text */}
                <div className="overflow-y-auto max-h-[600px] pr-1 scrollbar-thin">
                  <ItineraryDisplay text={itinerary} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Info banner at the bottom ────────────────────────────────── */}
      <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-4 flex items-start gap-3">
        <span className="text-xl flex-shrink-0">💡</span>
        <div>
          <p className="text-blue-300 text-sm font-medium">Powered by Google Gemini</p>
          <p className="text-gray-400 text-xs mt-0.5">
            This feature requires a Gemini API key in the backend <code className="text-blue-400">.env</code> file.
            Get a free key at{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-blue-300"
            >
              Google AI Studio
            </a>
            .
          </p>
        </div>
      </div>

    </div>
  );
};

export default AIPlannerPage;
