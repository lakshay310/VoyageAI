// src/pages/SearchPage.jsx
// Unified Search, Filter & Pagination page.
// Tabs: Hotels | Flights | Trips | Wishlist
// Each tab has its own filter panel and paginated results.
// Global search bar at top — triggers all tabs at once.

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link }            from 'react-router-dom';
import toast                                from 'react-hot-toast';
import Pagination                           from '../components/common/Pagination';
import StarRating                           from '../components/StarRating';
import { searchHotels, searchFlights, searchTrips, searchWishlist } from '../services/search.service';

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'hotels',   label: 'Hotels',   icon: '🏨' },
  { key: 'flights',  label: 'Flights',  icon: '✈️' },
  { key: 'trips',    label: 'My Trips', icon: '🧳' },
  { key: 'wishlist', label: 'Wishlist', icon: '🌟' },
];

const SearchPage = () => {
  // Sync state with URL params so searches are shareable/bookmarkable
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab]   = useState(searchParams.get('tab') || 'hotels');
  const [query,     setQuery]        = useState(searchParams.get('q')   || '');
  const [results,   setResults]      = useState({ data: [], meta: null });
  const [loading,   setLoading]      = useState(false);
  const [page,      setPage]         = useState(1);

  // Per-tab filters
  const [hotelFilters,  setHotelFilters]  = useState({ city: '', minPrice: '', maxPrice: '', starRating: '', roomType: '' });
  const [flightFilters, setFlightFilters] = useState({ fromCity: '', toCity: '', stops: '', maxPrice: '', cabinClass: '' });
  const [tripFilters,   setTripFilters]   = useState({ status: '' });
  const [wishFilters,   setWishFilters]   = useState({ category: '', visited: '' });

  // ── Search function — runs when tab, query, filters, or page changes ────────
  const runSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { q: query, page, limit: 8 };
      let res;

      if (activeTab === 'hotels')   res = await searchHotels({  ...params, ...hotelFilters  });
      if (activeTab === 'flights')  res = await searchFlights({ ...params, ...flightFilters });
      if (activeTab === 'trips')    res = await searchTrips({   ...params, ...tripFilters   });
      if (activeTab === 'wishlist') res = await searchWishlist({ ...params, ...wishFilters  });

      setResults(res.data.data);
    } catch {
      toast.error('Search failed.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, query, page, hotelFilters, flightFilters, tripFilters, wishFilters]);

  // Re-run search whenever dependencies change
  useEffect(() => { runSearch(); }, [runSearch]);

  // Reset to page 1 whenever tab or query changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSearchParams({ tab, q: query });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchParams({ tab: activeTab, q: query });
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderHotelCard = (h) => (
    <div key={h.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-4 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold truncate">{h.name}</p>
          <p className="text-gray-400 text-sm">📍 {h.city}, {h.country}</p>
          <div className="flex items-center gap-2 mt-1">
            <StarRating value={Math.round(h.rating)} size="sm" />
            <span className="text-xs text-gray-500">{h.rating}/5 · {'⭐'.repeat(h.starRating)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{h.roomType} · {h.amenities?.split(',').slice(0, 3).join(', ')}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-blue-400 font-black text-lg">₹{h.pricePerNight?.toLocaleString('en-IN')}</p>
          <p className="text-gray-500 text-xs">/night</p>
          <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full mt-1 inline-block">
            {h.availableRooms} rooms
          </span>
        </div>
      </div>
    </div>
  );

  const renderFlightCard = (f) => (
    <div key={f.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-4 transition-all">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-white font-bold">{f.airline} <span className="text-gray-500 text-sm font-normal">({f.flightNumber})</span></p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-white font-black text-lg">{f.fromCode}</span>
            <span className="text-gray-500 text-sm">─ {f.duration} ─→</span>
            <span className="text-white font-black text-lg">{f.toCode}</span>
          </div>
          <p className="text-gray-400 text-xs mt-1">{f.fromCity} → {f.toCity} · {f.departureTime}–{f.arrivalTime}</p>
        </div>
        <div className="text-right">
          <p className="text-blue-400 font-black text-xl">₹{f.price?.toLocaleString('en-IN')}</p>
          <p className="text-gray-500 text-xs">{f.cabinClass}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border mt-1 inline-block
            ${f.stops === 0 ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'}`}>
            {f.stops === 0 ? 'Non-stop' : `${f.stops} stop`}
          </span>
        </div>
      </div>
    </div>
  );

  const renderTripCard = (t) => (
    <Link to={`/trips/${t.id}`} key={t.id}
      className="block bg-gray-900 border border-gray-800 hover:border-blue-600/40 rounded-2xl p-4 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white font-bold">{t.title}</p>
          <p className="text-gray-400 text-sm">📍 {t.destination}</p>
          <p className="text-gray-500 text-xs mt-1">
            {new Date(t.startDate).toLocaleDateString('en-IN')} → {new Date(t.endDate).toLocaleDateString('en-IN')}
          </p>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border
          ${t.status === 'PLANNED'   ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
          : t.status === 'ONGOING'  ? 'bg-green-500/10 text-green-300 border-green-500/30'
          : t.status === 'COMPLETED'? 'bg-gray-700 text-gray-400 border-gray-600'
          : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
          {t.status}
        </span>
      </div>
    </Link>
  );

  const renderWishCard = (w) => (
    <div key={w.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-4 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white font-bold">{w.destination}</p>
          {w.country && <p className="text-gray-400 text-sm">🌍 {w.country}</p>}
          {w.notes   && <p className="text-gray-500 text-xs mt-1 line-clamp-1">{w.notes}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[11px] bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">{w.category}</span>
          {w.visited && <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">✓ Visited</span>}
        </div>
      </div>
    </div>
  );

  const renderCard = (item) => {
    if (activeTab === 'hotels')   return renderHotelCard(item);
    if (activeTab === 'flights')  return renderFlightCard(item);
    if (activeTab === 'trips')    return renderTripCard(item);
    if (activeTab === 'wishlist') return renderWishCard(item);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white mb-1">🔍 Search & Explore</h1>
        <p className="text-gray-400 text-sm">Filter hotels, flights, trips and your wishlist</p>
      </div>

      {/* ── Global search bar ───────────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          <input
            id="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${TABS.find(t => t.key === activeTab)?.label || ''}…`}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 text-white
                       rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-sm"
          />
        </div>
        <button type="submit"
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold
                     rounded-xl text-sm transition-colors shrink-0">
          Search
        </button>
      </form>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button key={tab.key}
            id={`tab-${tab.key}`}
            onClick={() => handleTabChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                        border shrink-0 transition-all
                        ${activeTab === tab.key
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Filter panel (per tab) ──────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Filters</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

          {/* Hotel filters */}
          {activeTab === 'hotels' && (<>
            <input value={hotelFilters.city} onChange={e => { setHotelFilters(f => ({...f, city: e.target.value})); setPage(1); }}
              placeholder="City" className="filter-input" />
            <select value={hotelFilters.starRating} onChange={e => { setHotelFilters(f => ({...f, starRating: e.target.value})); setPage(1); }}
              className="filter-input">
              <option value="">⭐ Any Stars</option>
              {[5,4,3,2,1].map(s => <option key={s} value={s}>{s} Star{s>1?'s':''}</option>)}
            </select>
            <select value={hotelFilters.roomType} onChange={e => { setHotelFilters(f => ({...f, roomType: e.target.value})); setPage(1); }}
              className="filter-input">
              <option value="">🛏️ Any Room</option>
              {['Standard','Deluxe','Suite','Premium'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input type="number" value={hotelFilters.minPrice} onChange={e => { setHotelFilters(f => ({...f, minPrice: e.target.value})); setPage(1); }}
              placeholder="Min Price (₹)" className="filter-input" />
            <input type="number" value={hotelFilters.maxPrice} onChange={e => { setHotelFilters(f => ({...f, maxPrice: e.target.value})); setPage(1); }}
              placeholder="Max Price (₹)" className="filter-input" />
          </>)}

          {/* Flight filters */}
          {activeTab === 'flights' && (<>
            <input value={flightFilters.fromCity} onChange={e => { setFlightFilters(f => ({...f, fromCity: e.target.value})); setPage(1); }}
              placeholder="From City" className="filter-input" />
            <input value={flightFilters.toCity} onChange={e => { setFlightFilters(f => ({...f, toCity: e.target.value})); setPage(1); }}
              placeholder="To City" className="filter-input" />
            <select value={flightFilters.stops} onChange={e => { setFlightFilters(f => ({...f, stops: e.target.value})); setPage(1); }}
              className="filter-input">
              <option value="">Any Stops</option>
              <option value="0">Non-stop</option>
              <option value="1">1 Stop</option>
            </select>
            <select value={flightFilters.cabinClass} onChange={e => { setFlightFilters(f => ({...f, cabinClass: e.target.value})); setPage(1); }}
              className="filter-input">
              <option value="">Any Class</option>
              {['Economy','Premium Economy','Business'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" value={flightFilters.maxPrice} onChange={e => { setFlightFilters(f => ({...f, maxPrice: e.target.value})); setPage(1); }}
              placeholder="Max Price (₹)" className="filter-input" />
          </>)}

          {/* Trip filters */}
          {activeTab === 'trips' && (
            <select value={tripFilters.status} onChange={e => { setTripFilters(f => ({...f, status: e.target.value})); setPage(1); }}
              className="filter-input">
              <option value="">Any Status</option>
              {['PLANNED','ONGOING','COMPLETED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          {/* Wishlist filters */}
          {activeTab === 'wishlist' && (<>
            <select value={wishFilters.category} onChange={e => { setWishFilters(f => ({...f, category: e.target.value})); setPage(1); }}
              className="filter-input">
              <option value="">Any Category</option>
              {['DOMESTIC','INTERNATIONAL','ADVENTURE','BEACH','CULTURAL','WILDLIFE'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select value={wishFilters.visited} onChange={e => { setWishFilters(f => ({...f, visited: e.target.value})); setPage(1); }}
              className="filter-input">
              <option value="">All</option>
              <option value="false">Not Visited</option>
              <option value="true">Visited</option>
            </select>
          </>)}
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="bg-gray-900 rounded-2xl h-24 animate-pulse" />)}
        </div>
      ) : results.data?.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className="text-white font-bold text-lg mb-1">No results found</h3>
          <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {(results.data || []).map(item => renderCard(item))}
          </div>

          {/* Pagination controls */}
          <Pagination
            meta={results.meta}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </>
      )}
    </div>
  );
};

export default SearchPage;
