// src/pages/FlightSearchPage.jsx
// Flight Search & Booking Page — India + Global routes.
// Prices are dynamically adjusted by departure date (yield management), just like real airlines.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { searchFlights, getPopularRoutes, bookFlight } from '../services/flight.service';
import { getMyTrips } from '../services/trip.service';
import { formatCurrency } from '../utils/formatters';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const AIRLINE_COLORS = {
  IndiGo:             'bg-indigo-600/20 text-indigo-400 border-indigo-500/30',
  'Air India':        'bg-red-600/20 text-red-400 border-red-500/30',
  Vistara:            'bg-purple-600/20 text-purple-400 border-purple-500/30',
  'Akasa Air':        'bg-orange-600/20 text-orange-400 border-orange-500/30',
  SpiceJet:           'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
  Emirates:           'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
  Etihad:             'bg-amber-600/20 text-amber-400 border-amber-500/30',
  'Qatar Airways':    'bg-purple-700/20 text-purple-300 border-purple-600/30',
  'Singapore Airlines':'bg-yellow-600/20 text-yellow-300 border-yellow-500/30',
  'Thai Airways':     'bg-blue-600/20 text-blue-300 border-blue-500/30',
  'Cathay Pacific':   'bg-green-600/20 text-green-300 border-green-500/30',
  'British Airways':  'bg-blue-700/20 text-blue-300 border-blue-600/30',
  Lufthansa:          'bg-sky-600/20 text-sky-300 border-sky-500/30',
  'Air France':       'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Turkish Airlines': 'bg-red-700/20 text-red-300 border-red-600/30',
  KLM:                'bg-blue-800/20 text-blue-200 border-blue-700/30',
  'Korean Air':       'bg-blue-600/20 text-blue-300 border-blue-500/30',
  'Japan Airlines':   'bg-red-600/20 text-red-300 border-red-500/30',
  ANA:                'bg-sky-700/20 text-sky-300 border-sky-600/30',
  'United':           'bg-blue-800/20 text-blue-200 border-blue-700/30',
  'Air Canada':       'bg-red-700/20 text-red-300 border-red-600/30',
  Qantas:             'bg-red-500/20 text-red-300 border-red-500/30',
};

const CABIN_CLASSES = ['All', 'Economy', 'Premium Economy', 'Business'];
const REGIONS = ['All Routes', 'India Domestic', 'Middle East', 'Southeast Asia', 'Europe', 'Americas', 'Oceania'];

// ─── BOOK MODAL ───────────────────────────────────────────────────────────────
const BookFlightModal = ({ flight, passengers, cabinClass, onClose, onBooked }) => {
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMyTrips()
      .then((res) => {
        const list = res.data.data || [];
        setTrips(list);
        if (list.length > 0) setSelectedTripId(list[0].id);
      })
      .catch(() => toast.error('Failed to load your trips.'))
      .finally(() => setLoadingTrips(false));
  }, []);

  const totalAmount = (flight.price || 4500) * (passengers || 1);

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!selectedTripId) return toast.error('Please select a trip.');
    setSubmitting(true);
    try {
      await bookFlight({
        flightId:     flight.id,
        tripId:       selectedTripId,
        passengers,
        cabinClass,
        dynamicPrice: flight.price,
      });
      toast.success('✈️ Flight booked & saved to your trip!');
      onBooked(selectedTripId);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h3 className="text-white font-bold text-lg">✈️ Confirm Flight Booking</h3>
            <p className="text-gray-400 text-xs mt-0.5">Ticket will be attached to your selected trip</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleConfirm} className="p-6 space-y-5">
          {/* Flight Summary */}
          <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-blue-500/10 text-blue-400 border-blue-500/20">
                  {flight.airline} · {flight.flightNumber}
                </span>
                <h4 className="text-white font-bold mt-2">
                  {flight.fromCity} ({flight.fromCode}) ➜ {flight.toCity} ({flight.toCode})
                </h4>
              </div>
              <p className="text-blue-400 font-bold text-lg">{formatCurrency(totalAmount)}</p>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-700/50 text-xs text-gray-300">
              <div><span className="text-gray-500 block">Departs</span><span className="font-semibold text-white">{flight.departureTime}</span></div>
              <div><span className="text-gray-500 block">Arrives</span><span className="font-semibold text-white">{flight.arrivalTime}</span></div>
              <div><span className="text-gray-500 block">Duration</span><span className="font-semibold text-white">{flight.duration}</span></div>
              <div><span className="text-gray-500 block">Pax</span><span className="font-semibold text-white">{passengers} ({cabinClass})</span></div>
            </div>
          </div>

          {/* Pricing disclaimer */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300 space-y-1">
            <p className="font-semibold">ℹ️ About this price</p>
            <p>Prices are simulated using real airline yield-management rules (departure proximity, weekends, demand). They are <strong>not</strong> live API prices from IndiGo/Emirates etc. — those require a paid airline API subscription.</p>
          </div>

          {/* Trip Selector */}
          <div>
            <label className="label">Attach to Trip 🗺️</label>
            {loadingTrips ? (
              <div className="h-10 bg-gray-800 animate-pulse rounded-xl" />
            ) : trips.length > 0 ? (
              <select className="input cursor-pointer" value={selectedTripId} onChange={(e) => setSelectedTripId(e.target.value)} required>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>{t.title} — {t.destination}</option>
                ))}
              </select>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
                No trips found. Create a trip first from <strong>My Trips</strong>.
              </div>
            )}
          </div>

          {/* Fare Breakdown */}
          <div className="bg-gray-950/50 rounded-xl p-3 border border-gray-800 space-y-1.5 text-xs text-gray-400">
            <div className="flex justify-between"><span>Base Fare ({passengers} Pax):</span><span className="text-gray-200">{formatCurrency(Math.round(totalAmount * 0.85))}</span></div>
            <div className="flex justify-between"><span>Taxes & Fees:</span><span className="text-gray-200">{formatCurrency(Math.round(totalAmount * 0.15))}</span></div>
            <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-gray-800">
              <span>Total Payable:</span><span className="text-blue-400">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting || trips.length === 0} className="btn-primary flex-1 disabled:opacity-50">
              {submitting ? 'Confirming...' : '🎫 Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── PRICE TREND INDICATOR ─────────────────────────────────────────────────────
// Shows if price is high / low / average based on days until departure
const PriceTrendBadge = ({ departureDate, basePrice, currentPrice }) => {
  if (!departureDate) return null;
  const ratio = currentPrice / basePrice;

  if (ratio >= 1.5) return <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">📈 High Demand</span>;
  if (ratio <= 0.9) return <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">🎁 Early-Bird</span>;
  if (ratio > 1.1) return <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">📊 Rising</span>;
  return null;
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const FlightSearchPage = () => {
  const navigate = useNavigate();

  // Search form
  const [origin,       setOrigin]       = useState('Delhi');
  const [destination,  setDestination]  = useState('Goa');
  const [departDate,   setDepartDate]   = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
  const [passengers,   setPassengers]   = useState(1);
  const [cabinClass,   setCabinClass]   = useState('Economy');

  // Filters
  const [sortBy,          setSortBy]         = useState('price');
  const [maxPrice,        setMaxPrice]        = useState(500000);  // 5 lakh — covers Business class long-haul
  const [airlineFilter,   setAirlineFilter]   = useState('All');
  const [stopsFilter,     setStopsFilter]     = useState('All');
  const [regionFilter,    setRegionFilter]    = useState('All Routes');

  // Data
  const [flights,       setFlights]       = useState([]);
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [selectedFlight,setSelectedFlight]= useState(null);
  const [searched,      setSearched]      = useState(false);

  useEffect(() => {
    getPopularRoutes()
      .then((res) => setPopularRoutes(res.data.data.routes || []))
      .catch(() => {});
    doSearch('Delhi', 'Goa', departDate, 'Economy', 1);
  }, []);

  const doSearch = async (from, to, date, cls, pax) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchFlights({ origin: from, destination: to, departureDate: date, cabinClass: cls, sortBy, passengers: pax });
      setFlights(res.data.data.flights || []);
    } catch (err) {
      toast.error('Search failed — please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    doSearch(origin, destination, departDate, cabinClass, passengers);
  };

  const handlePopularClick = (r) => {
    setOrigin(r.fromCity);
    setDestination(r.toCity);
    doSearch(r.fromCity, r.toCity, departDate, cabinClass, passengers);
    toast.success(`Showing ${r.fromCity} ➜ ${r.toCity} flights`);
  };

  // Unique airlines list for filter
  const availableAirlines = ['All', ...new Set(flights.map((f) => f.airline))];

  // Client-side filter
  const filtered = flights.filter((f) => {
    if (airlineFilter !== 'All' && f.airline !== airlineFilter) return false;
    if (stopsFilter === 'Direct' && f.stops !== 0) return false;
    if (f.price > maxPrice) return false;
    return true;
  });

  // Group popular routes by region for tabs
  const regionGroups = {};
  REGIONS.forEach((r) => { regionGroups[r] = []; });
  popularRoutes.forEach((r) => {
    const g = r.region || 'India Domestic';
    if (regionGroups[g]) regionGroups[g].push(r);
    regionGroups['All Routes'].push(r);
  });

  const displayedRoutes = regionGroups[regionFilter] || popularRoutes;

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-950/60 via-gray-900 to-indigo-950/60 border border-blue-500/20 rounded-3xl p-6 sm:p-8">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold rounded-full">
              ✈️ Global Flight Search
            </span>
            <span className="inline-block px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold rounded-full">
              India + International
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Find Flights Worldwide
          </h1>
          <p className="text-gray-300 text-sm mt-2 max-w-xl">
            Search 60+ routes across India, Middle East, Southeast Asia, Europe, Americas & more.
            Prices auto-adjust by departure date — <em>earlier you book, cheaper the fare!</em>
          </p>
        </div>

        {/* Pricing disclaimer pill */}
        <div className="relative z-10 mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
          <span>ℹ️</span>
          <span><strong>Note:</strong> Prices use dynamic fare simulation (yield management) — not live airline APIs. Actual fares may vary.</span>
        </div>

        {/* Popular Routes with Region Filter Tabs */}
        <div className="relative z-10 mt-6 pt-4 border-t border-blue-500/15">
          {/* Region Tabs */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
            <span className="text-gray-400 text-xs font-semibold whitespace-nowrap">Popular:</span>
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  regionFilter === r
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800/80 text-gray-400 hover:text-white border border-gray-700/60'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Route Chips */}
          <div className="flex flex-wrap gap-2">
            {displayedRoutes.map((r, i) => (
              <button
                key={i}
                onClick={() => handlePopularClick(r)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-900/70 hover:bg-blue-600/30 border border-gray-700/70 hover:border-blue-500/50 rounded-xl text-xs text-gray-200 transition-all duration-200"
              >
                <span className="text-base leading-none">{r.flag}</span>
                <span className="font-medium">{r.fromCity} ➜ {r.toCity}</span>
                <span className="text-blue-400 font-bold">from {formatCurrency(r.price)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Search Bar ──────────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div>
            <label className="label">From 🛫</label>
            <input type="text" className="input" placeholder="City or IATA code" value={origin} onChange={(e) => setOrigin(e.target.value)} required />
          </div>
          <div>
            <label className="label">To 🛬</label>
            <input type="text" className="input" placeholder="City or IATA code" value={destination} onChange={(e) => setDestination(e.target.value)} required />
          </div>
          <div>
            <label className="label">Departure Date 📅</label>
            <input type="date" className="input" value={departDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setDepartDate(e.target.value)} required />
          </div>
          <div>
            <label className="label">Passengers</label>
            <select className="input" value={passengers} onChange={(e) => setPassengers(Number(e.target.value))}>
              {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Cabin Class</label>
            <select className="input" value={cabinClass} onChange={(e) => setCabinClass(e.target.value)}>
              {CABIN_CLASSES.filter(c => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2 h-[42px]">
            {loading ? '🔍 Searching...' : '🔍 Search'}
          </button>
        </form>
      </div>

      {/* ── Results Area ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar Filters */}
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-5 h-fit space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-gray-800">
            <h3 className="text-white font-bold text-sm">⚙️ Filters</h3>
            <button onClick={() => { setMaxPrice(100000); setAirlineFilter('All'); setStopsFilter('All'); }} className="text-xs text-blue-400 hover:underline">Reset</button>
          </div>

          {/* Max Price */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-300 font-medium">Max Price (per adult)</span>
              <span className="text-blue-400 font-bold">{formatCurrency(maxPrice)}</span>
            </div>
            <input type="range" min="2000" max="500000" step="5000" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
              <span>₹2K</span><span className="text-center">₹2.5L</span><span>₹5L</span>
            </div>
            {/* Cabin class price reference */}
            <div className="mt-3 space-y-1 text-[10px] text-gray-500">
              <p className="font-semibold text-gray-400 uppercase tracking-wider">Price Range Guide</p>
              <div className="flex justify-between"><span>✈️ Domestic Economy</span><span>₹2K–₹10K</span></div>
              <div className="flex justify-between"><span>🌏 Short-haul Intl.</span><span>₹12K–₹30K</span></div>
              <div className="flex justify-between"><span>🌍 Europe / Japan</span><span>₹35K–₹85K</span></div>
              <div className="flex justify-between"><span>🇺🇸 Americas</span><span>₹65K–₹95K</span></div>
              <div className="flex justify-between text-amber-400/80"><span>💼 Business (Intl.)</span><span>₹1.5L–₹4L</span></div>
            </div>
          </div>

          {/* Airline */}
          <div>
            <label className="label mb-2">Airline</label>
            <div className="space-y-1">
              {availableAirlines.slice(0, 10).map((a) => (
                <button key={a} onClick={() => setAirlineFilter(a)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${airlineFilter === a ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Stops */}
          <div>
            <label className="label mb-2">Stops</label>
            <div className="grid grid-cols-2 gap-2">
              {['All', 'Direct'].map((s) => (
                <button key={s} onClick={() => setStopsFilter(s)}
                  className={`py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${stopsFilter === s ? 'bg-blue-600/20 text-blue-400 border-blue-500/40' : 'border-gray-800 text-gray-400 hover:border-gray-700'}`}>
                  {s === 'Direct' ? 'Non-stop' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Pricing Legend */}
          <div className="pt-3 border-t border-gray-800">
            <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-2">Price Trend Guide</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-400"><span className="bg-emerald-500/10 px-1.5 py-0.5 rounded font-semibold">🎁 Early-Bird</span><span className="text-gray-500">60+ days ahead</span></div>
              <div className="flex items-center gap-2 text-blue-400"><span className="bg-blue-500/10 px-1.5 py-0.5 rounded font-semibold">✅ Best Value</span><span className="text-gray-500">30–60 days out</span></div>
              <div className="flex items-center gap-2 text-amber-400"><span className="bg-amber-500/10 px-1.5 py-0.5 rounded font-semibold">📊 Rising</span><span className="text-gray-500">14–30 days</span></div>
              <div className="flex items-center gap-2 text-red-400"><span className="bg-red-500/10 px-1.5 py-0.5 rounded font-semibold">📈 High Demand</span><span className="text-gray-500">Within 7 days</span></div>
            </div>
          </div>
        </div>

        {/* Flight Results */}
        <div className="lg:col-span-3 space-y-3">
          {/* Sort bar */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-gray-400">
              {loading ? 'Searching...' : <><strong className="text-white">{filtered.length}</strong> flights found</>}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Sort:</span>
              {[{ id: 'price', label: '💰 Cheapest' }, { id: 'duration', label: '⚡ Fastest' }, { id: 'departure', label: '🕒 Earliest' }].map((s) => (
                <button key={s.id} onClick={() => { setSortBy(s.id); handleSearch(); }}
                  className={`px-3 py-1 rounded-lg transition-colors ${sortBy === s.id ? 'bg-blue-600 text-white font-semibold' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Skeletons */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />)}
            </div>
          )}

          {/* Empty State */}
          {!loading && searched && filtered.length === 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
              <div className="text-5xl mb-3">✈️</div>
              <h3 className="text-white font-bold text-lg">No flights found</h3>
              <p className="text-gray-400 text-sm mt-1">Try adjusting filters or searching a different route.</p>
            </div>
          )}

          {/* Flight Cards */}
          {!loading && filtered.map((flight) => {
            const badge = AIRLINE_COLORS[flight.airline] || 'bg-gray-800 text-gray-300 border-gray-700';
            const isIntl = ['Dubai', 'London', 'Paris', 'Singapore', 'Bangkok', 'New York', 'Tokyo', 'Sydney', 'Frankfurt', 'Abu Dhabi', 'Doha', 'Istanbul', 'Seoul', 'Nairobi'].includes(flight.toCity);

            return (
              <div key={flight.id} className="bg-gray-900 border border-gray-800 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Left: Airline + Route */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${badge}`}>
                        {flight.airline} · {flight.flightNumber}
                      </span>
                      <span className="text-gray-500 text-xs">{flight.cabinClass}</span>
                      {isIntl && <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-semibold">🌏 International</span>}
                      <PriceTrendBadge departureDate={departDate} basePrice={flight.baseFare || flight.price} currentPrice={flight.price} />
                    </div>

                    {/* Timeline */}
                    <div className="flex items-center gap-3 sm:gap-6">
                      <div>
                        <div className="text-white font-extrabold text-xl">{flight.departureTime}</div>
                        <div className="text-gray-400 text-xs font-semibold">{flight.fromCode} · {flight.fromCity}</div>
                      </div>

                      <div className="flex-1 flex flex-col items-center min-w-0">
                        <span className="text-gray-500 text-[10px] font-semibold">{flight.duration}</span>
                        <div className="w-full flex items-center gap-1 my-1">
                          <div className="h-px bg-gray-700 flex-1" />
                          <span className="text-blue-400 text-sm">✈</span>
                          <div className="h-px bg-gray-700 flex-1" />
                        </div>
                        <span className={`text-[10px] font-semibold ${flight.stops === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="text-white font-extrabold text-xl">{flight.arrivalTime}</div>
                        <div className="text-gray-400 text-xs font-semibold">{flight.toCode} · {flight.toCity}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Price + Book */}
                  <div className="sm:border-l border-gray-800 sm:pl-5 flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                    <div className="text-right">
                      <span className="text-gray-500 text-[11px] block">Per adult</span>
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-gray-500 text-xs line-through">{formatCurrency(Math.round(flight.price * 1.25))}</span>
                        <span className="text-white font-bold text-xl">{formatCurrency(flight.price)}</span>
                      </div>
                      {passengers > 1 && (
                        <span className="text-blue-400 text-xs block">Total: {formatCurrency(flight.totalPrice)}</span>
                      )}
                      {flight.availableSeats && flight.availableSeats <= 10 && (
                        <span className="text-red-400 text-[10px] font-semibold mt-0.5 block">
                          🔥 Only {flight.availableSeats} seats left!
                        </span>
                      )}
                    </div>

                    <button onClick={() => setSelectedFlight(flight)} className="btn-primary text-xs py-2 px-4 whitespace-nowrap">
                      🎫 Book
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Book Modal */}
      {selectedFlight && (
        <BookFlightModal
          flight={selectedFlight}
          passengers={passengers}
          cabinClass={cabinClass}
          onClose={() => setSelectedFlight(null)}
          onBooked={(tripId) => navigate(`/trips/${tripId}`)}
        />
      )}
    </div>
  );
};

export default FlightSearchPage;
