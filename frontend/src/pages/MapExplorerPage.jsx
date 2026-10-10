// src/pages/MapExplorerPage.jsx
// Interactive Maps Explorer — powered by Leaflet + OpenStreetMap (100% free, no API key needed).
//
// Tech stack:
//   - Leaflet 1.9.4  (loaded via CDN at runtime to avoid SSR issues)
//   - CartoDB Dark Matter tiles  (dark-themed OSM-based tile layer, free)
//   - OpenStreetMap attribution  (required by OSM/CartoDB license)
//
// Features:
//   - 20+ quick destination chips (domestic 🇮🇳 + international 🌍)
//   - Trip selector: load any saved trip's route & booking pins directly on the map
//   - Category filters: All, Hotels 🏨, Attractions 📍, Restaurants 🍽️
//   - Custom HTML pins with color-coded borders per category
//   - Clickable popups with name, price, rating, description
//   - Directions via OpenStreetMap (no Google Maps dependency)
//   - Marker inspector sidebar with Book Stay / Directions actions
//   - Marker list with fly-to on click

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { getCityMap, getTripMap } from '../services/map.service';
import { getMyTrips } from '../services/trip.service';

// ── Destination chips ────────────────────────────────────────────────────────
// Split into domestic and international sections for clarity
const DOMESTIC_CITIES = ['Goa', 'Delhi', 'Mumbai', 'Jaipur', 'Kerala', 'Manali', 'Udaipur', 'Varanasi', 'Bengaluru', 'Shimla'];
const INTERNATIONAL_CITIES = ['Paris', 'Dubai', 'Tokyo', 'London', 'Singapore', 'Bali', 'Bangkok', 'Rome', 'New York', 'Sydney'];

// ── Category styles ──────────────────────────────────────────────────────────
const CATEGORY_BORDER = {
  HOTEL:      '#a855f7',   // purple
  ATTRACTION: '#3b82f6',   // blue
  RESTAURANT: '#f59e0b',   // amber
  FLIGHT:     '#14b8a6',   // teal
};

const CATEGORY_ICONS = {
  HOTEL:      '🏨',
  ATTRACTION: '📍',
  RESTAURANT: '🍽️',
  FLIGHT:     '✈️',
};

const CATEGORY_TAB_ACTIVE = {
  ALL:        'bg-emerald-600 text-white border-emerald-500',
  HOTEL:      'bg-purple-600/30 text-purple-300 border-purple-500/50',
  ATTRACTION: 'bg-blue-600/30 text-blue-300 border-blue-500/50',
  RESTAURANT: 'bg-amber-600/30 text-amber-300 border-amber-500/50',
};

// ── MapExplorerPage component ────────────────────────────────────────────────
const MapExplorerPage = () => {
  const [searchQuery,     setSearchQuery]     = useState('Goa');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [userTrips,       setUserTrips]       = useState([]);
  const [selectedTripId,  setSelectedTripId]  = useState('');
  const [mapData,         setMapData]         = useState(null);
  const [selectedMarker,  setSelectedMarker]  = useState(null);
  const [loading,         setLoading]         = useState(true);

  const mapInstanceRef     = useRef(null);  // Leaflet map instance
  const markersGroupRef    = useRef(null);  // Leaflet layer group for pins
  const selectedCategoryRef = useRef('ALL'); // Ref mirrors state to avoid stale closures in Leaflet callbacks

  // Keep ref in sync with state
  useEffect(() => { selectedCategoryRef.current = selectedCategory; }, [selectedCategory]);

  // ── Load user trips on mount ───────────────────────────────────────────────
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await getMyTrips();
        setUserTrips(res.data?.data || []);
      } catch (err) {
        console.error('Could not load trips:', err);
      }
    };
    fetchTrips();
  }, []);

  // ── Dynamically load Leaflet CSS + JS ─────────────────────────────────────
  // We load Leaflet from CDN inside useEffect so it never runs during SSR.
  useEffect(() => {
    let mounted = true;

    const injectLeaflet = () => {
      // Inject CSS once
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id   = 'leaflet-css';
        link.rel  = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Inject JS and wait for it to load
      if (window.L) {
        if (mounted) initMap();
      } else {
        const script  = document.createElement('script');
        script.src    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => { if (mounted) initMap(); };
        document.body.appendChild(script);
      }
    };

    const initMap = () => {
      // Don't re-initialize if the map already exists
      if (!window.L || mapInstanceRef.current) return;

      const container = document.getElementById('osm-map');
      if (!container) return;

      // Reset any orphaned leaflet ID on the container before initializing
      if (container._leaflet_id) {
        container._leaflet_id = null;
      }

      const map = window.L.map('osm-map', {
        center:      [20.5937, 78.9629], // India center as default
        zoom:        5,
        zoomControl: false,
      });

      // OpenStreetMap Standard Tiles — 100% free, no API key needed
      // CARTO dark tiles now require a paid API key, so we use OSM instead.
      // A dark CSS filter is applied via the map container's CSS to maintain dark theme.
      window.L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: 'abc',
          maxZoom:    19,
        }
      ).addTo(map);

      // Zoom control bottom-right
      window.L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current  = map;
      markersGroupRef.current = window.L.layerGroup().addTo(map);

      // Invalidate size after layout settles to guarantee tiles are 100% visible
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);

      // Load initial city
      loadCity('Goa');
    };

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    injectLeaflet();
    return () => {
      mounted = false;
      window.removeEventListener('resize', handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
      }
    };
  }, []);

  // ── Render Leaflet markers from data ──────────────────────────────────────
  // Called whenever we have new map data OR category filter changes.
  const renderMarkers = (data, category) => {
    if (!window.L || !mapInstanceRef.current || !data) return;

    const map   = mapInstanceRef.current;
    const group = markersGroupRef.current;
    group.clearLayers();
    map.invalidateSize();

    // Fly to city/trip center
    const center = data.center || data.city;
    if (center) {
      map.flyTo([center.lat, center.lng], center.zoom || 12, { duration: 1.4 });
    }

    // Filter markers by selected category
    const cat      = category || selectedCategoryRef.current;
    const filtered = cat === 'ALL'
      ? data.markers
      : data.markers.filter((m) => m.category === cat);

    filtered.forEach((m) => {
      const emoji      = CATEGORY_ICONS[m.category] || '📍';
      const borderColor = CATEGORY_BORDER[m.category] || '#6b7280';
      const label      = m.title.length > 17 ? m.title.slice(0, 15) + '…' : m.title;

      // Custom HTML label pin
      // Note: filter: invert(1) hue-rotate(180deg) counter-acts the parent map container's dark filter
      const icon = window.L.divIcon({
        className: '',
        html: `
          <div style="
            background:#0f172a;
            border:2px solid ${borderColor};
            color:#f1f5f9;
            padding:5px 9px;
            border-radius:10px;
            font-size:11px;
            font-weight:600;
            white-space:nowrap;
            display:flex;
            align-items:center;
            gap:5px;
            box-shadow:0 6px 20px rgba(0,0,0,0.7);
            cursor:pointer;
            filter: invert(1) hue-rotate(180deg) brightness(1.18) saturate(1.1);
          ">
            <span>${emoji}</span><span>${label}</span>
          </div>`,
        iconSize:   [130, 32],
        iconAnchor: [65, 16],
      });

      const marker = window.L.marker([m.lat, m.lng], { icon }).addTo(group);

      // Dark-styled OSM popup
      marker.bindPopup(`
        <div style="background:#1e293b;color:#f1f5f9;font-family:sans-serif;padding:6px;min-width:180px;border-radius:8px;">
          <p style="margin:0 0 3px;font-size:13px;font-weight:700;">${m.title}</p>
          <p style="margin:0 0 5px;font-size:11px;color:#94a3b8;">${m.address || m.desc || m.category}</p>
          ${m.price  ? `<p style="margin:0 0 4px;font-size:12px;color:#10b981;font-weight:600;">${m.price}</p>` : ''}
          ${m.rating ? `<p style="margin:0;font-size:11px;color:#fbbf24;">⭐ ${m.rating} / 5</p>` : ''}
          <a href="https://www.openstreetmap.org/?mlat=${m.lat}&mlon=${m.lng}&zoom=16"
             target="_blank" rel="noreferrer"
             style="display:inline-block;margin-top:8px;font-size:10px;color:#60a5fa;">
            View on OpenStreetMap ↗
          </a>
        </div>
      `, { className: 'dark-popup' });

      // Clicking a pin also updates the inspector panel
      marker.on('click', () => setSelectedMarker(m));
    });
  };

  // ── Fetch city map data from backend ──────────────────────────────────────
  const loadCity = async (city) => {
    const q = (city || searchQuery).trim();
    if (!q) return;
    setLoading(true);
    setSelectedTripId('');
    try {
      const res  = await getCityMap(q);
      const data = res.data?.data;
      setMapData(data);
      setSelectedMarker(data?.markers?.[0] || null);
      renderMarkers(data, selectedCategoryRef.current);
    } catch {
      toast.error('Could not load map data. Please try another destination.');
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch trip map data from backend ─────────────────────────────────────
  const loadTrip = async (tripId) => {
    setSelectedTripId(tripId);
    if (!tripId) return;
    setLoading(true);
    try {
      const res  = await getTripMap(tripId);
      const data = res.data?.data;
      setMapData(data);
      setSelectedMarker(data?.markers?.[0] || null);
      renderMarkers(data, selectedCategoryRef.current);
      toast.success(`🗺️ Loaded map for "${data.trip?.title}"`);
    } catch {
      toast.error('Could not load trip map route.');
    } finally {
      setLoading(false);
    }
  };

  // ── Re-render markers when category filter changes ─────────────────────────
  useEffect(() => {
    if (mapData) renderMarkers(mapData, selectedCategory);
  }, [selectedCategory]);

  // ── Filtered list for the sidebar panel ───────────────────────────────────
  const filteredMarkers = (mapData?.markers || []).filter(
    (m) => selectedCategory === 'ALL' || m.category === selectedCategory
  );

  // ── OSM directions URL (no Google Maps needed) ────────────────────────────
  const osmDirectionsUrl = (m) =>
    `https://www.openstreetmap.org/?mlat=${m.lat}&mlon=${m.lng}&zoom=16`;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">

      {/* ── Header & Controls ───────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900 border border-gray-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🗺️ Interactive Maps Explorer
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">
            Powered by <span className="text-emerald-400 font-medium">OpenStreetMap + Leaflet</span> — 100% free, no API key required.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Trip picker */}
          <select
            value={selectedTripId}
            onChange={(e) => loadTrip(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 max-w-[200px]"
          >
            <option value="">🧳 Load a Trip Route...</option>
            {userTrips.map((t) => (
              <option key={t.id} value={t.id}>✈️ {t.title} ({t.destination})</option>
            ))}
          </select>

          {/* Search bar */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadCity()}
              placeholder="Type any city..."
              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 w-40"
            />
            <button
              onClick={() => loadCity()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
            >
              Go
            </button>
          </div>
        </div>
      </div>

      {/* ── Destination Chips ────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {/* Domestic */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest shrink-0 font-semibold w-20">🇮🇳 India</span>
          {DOMESTIC_CITIES.map((city) => (
            <button
              key={city}
              onClick={() => { setSearchQuery(city); loadCity(city); }}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition border shrink-0 ${
                searchQuery === city
                  ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-600'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
        {/* International */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest shrink-0 font-semibold w-20">🌍 World</span>
          {INTERNATIONAL_CITIES.map((city) => (
            <button
              key={city}
              onClick={() => { setSearchQuery(city); loadCity(city); }}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition border shrink-0 ${
                searchQuery === city
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/50'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-600'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* ── Map + Inspector layout ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ minHeight: '580px' }}>

        {/* Leaflet map canvas */}
        <div className="lg:col-span-3 relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl" style={{ minHeight: '540px' }}>

          {/* OSM map div — Leaflet renders here */}
          {/* CSS filter: invert(1) hue-rotate(180deg) gives a dark map look — no API key needed */}
          <div
            id="osm-map"
            style={{
              width: '100%',
              height: '100%',
              minHeight: '540px',
              filter: 'invert(1) hue-rotate(180deg) brightness(0.85) saturate(0.9)',
            }}
          />

          {/* Category filter overlay */}
          <div className="absolute top-3 left-3 z-[1000] flex flex-wrap gap-1.5 bg-gray-950/85 backdrop-blur-md p-2 rounded-2xl border border-gray-800">
            {['ALL', 'HOTEL', 'ATTRACTION', 'RESTAURANT'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  selectedCategory === cat
                    ? CATEGORY_TAB_ACTIVE[cat]
                    : 'bg-gray-800/80 text-gray-500 border-gray-700 hover:text-white hover:border-gray-600'
                }`}
              >
                {cat === 'ALL'        && '🗺️ All'}
                {cat === 'HOTEL'      && '🏨 Hotels'}
                {cat === 'ATTRACTION' && '📍 Sights'}
                {cat === 'RESTAURANT' && '🍽️ Dining'}
              </button>
            ))}
          </div>

          {/* OSM/CARTO credit badge */}
          <div className="absolute bottom-8 left-3 z-[1000] text-[10px] text-gray-600 bg-gray-950/70 px-2 py-1 rounded-lg">
            © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="hover:text-gray-400">OpenStreetMap</a> contributors · © <a href="https://carto.com/attributions" target="_blank" rel="noreferrer" className="hover:text-gray-400">CARTO</a>
          </div>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-gray-950/75 backdrop-blur-sm z-[2000] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-300 font-medium">Loading map tiles & pins...</p>
              </div>
            </div>
          )}
        </div>

        {/* Inspector panel */}
        <div className="flex flex-col gap-4">

          {/* Selected marker detail */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3 flex-1">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <h3 className="text-sm font-bold text-white">📍 Location Detail</h3>
              {selectedMarker && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  selectedMarker.category === 'HOTEL'      ? 'text-purple-400 bg-purple-500/10 border-purple-500/30' :
                  selectedMarker.category === 'RESTAURANT' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'   :
                  'text-blue-400 bg-blue-500/10 border-blue-500/30'
                }`}>
                  {CATEGORY_ICONS[selectedMarker.category]} {selectedMarker.category}
                </span>
              )}
            </div>

            {selectedMarker ? (
              <div className="space-y-3">
                {selectedMarker.imageUrl && (
                  <img
                    src={selectedMarker.imageUrl}
                    alt={selectedMarker.title}
                    className="w-full h-28 object-cover rounded-xl border border-gray-800"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}

                <div>
                  <h4 className="text-sm font-bold text-white leading-snug">{selectedMarker.title}</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    {selectedMarker.address || selectedMarker.desc || 'Point of interest'}
                  </p>
                </div>

                {selectedMarker.price && (
                  <div className="flex justify-between items-center bg-gray-800/60 rounded-xl px-3 py-2 text-xs">
                    <span className="text-gray-400">Price</span>
                    <span className="text-emerald-400 font-bold">{selectedMarker.price}</span>
                  </div>
                )}

                {selectedMarker.rating && (
                  <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-xs text-amber-400">
                    <span>Rating</span>
                    <span className="font-bold">⭐ {selectedMarker.rating} / 5</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  {/* OSM Directions — no Google Maps needed */}
                  <a
                    href={osmDirectionsUrl(selectedMarker)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-center py-2 rounded-xl text-xs font-semibold transition"
                  >
                    🗺️ OSM View
                  </a>
                  {selectedMarker.category === 'HOTEL' && (
                    <a
                      href="/hotels"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-center py-2 rounded-xl text-xs font-semibold transition"
                    >
                      🏨 Book Stay
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-3xl mb-2">📍</p>
                <p className="text-xs text-gray-500">Click any pin on the map<br />to view its details here.</p>
              </div>
            )}
          </div>

          {/* Pins list */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 max-h-64 overflow-y-auto">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              Pins on Map ({filteredMarkers.length})
            </h4>
            <div className="space-y-1.5">
              {filteredMarkers.length === 0 && (
                <p className="text-xs text-gray-600 text-center py-4">No pins for this filter.</p>
              )}
              {filteredMarkers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMarker(m);
                    mapInstanceRef.current?.flyTo([m.lat, m.lng], 14, { duration: 0.8 });
                  }}
                  className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs border transition ${
                    selectedMarker?.id === m.id
                      ? 'bg-emerald-600/15 border-emerald-500/40 text-white'
                      : 'bg-gray-800/40 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{CATEGORY_ICONS[m.category] || '📍'}</span>
                    <span className="truncate font-medium">{m.title}</span>
                  </div>
                  {m.price && (
                    <span className="text-emerald-400 font-semibold shrink-0">{m.price}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapExplorerPage;
