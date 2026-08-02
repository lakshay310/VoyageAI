// src/pages/HotelSearchPage.jsx
// Hotel search and booking page.
// Features:
//   - City / destination search input
//   - Check-in / Check-out date pickers
//   - Filters: Stars, Price, Room type, Sort order
//   - Dynamic pricing displayed (with nights + total price)
//   - One-click Book to attach hotel to a trip
//   - Popular destinations quick-chips

import { useState, useEffect } from 'react';
import { toast }               from 'react-hot-toast';
import { searchHotels, getPopularHotels, bookHotel } from '../services/hotel.service';
import { getMyTrips } from '../services/trip.service';
import HotelDetailModal, { getPhotosForHotel } from '../components/HotelDetailModal';


// ── Helper: format large INR numbers ─────────────────────────────────────────
const formatINR = (amount) => {
  if (!amount && amount !== 0) return '—';
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000)   return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
};

// ── Helper: star icons ────────────────────────────────────────────────────────
const Stars = ({ count }) => (
  <span className="text-amber-400 text-sm">
    {'★'.repeat(Math.min(count, 5))}{'☆'.repeat(Math.max(0, 5 - Math.min(count, 5)))}
  </span>
);

// ── Popular destination chips ─────────────────────────────────────────────────
const QUICK_DESTINATIONS = [
  { label: '🏖️ Goa',        city: 'Goa'       },
  { label: '🏙️ Delhi',      city: 'Delhi'     },
  { label: '🌆 Mumbai',     city: 'Mumbai'    },
  { label: '🏰 Jaipur',     city: 'Jaipur'    },
  { label: '🌿 Kerala',     city: 'Kerala'    },
  { label: '🗼 Paris',      city: 'Paris'     },
  { label: '🎡 London',     city: 'London'    },
  { label: '🌃 Dubai',      city: 'Dubai'     },
  { label: '🌴 Bali',       city: 'Bali'      },
  { label: '🦁 Singapore',  city: 'Singapore' },
  { label: '🗽 New York',   city: 'New York'  },
  { label: '🗾 Tokyo',      city: 'Tokyo'     },
  { label: '🦘 Sydney',     city: 'Sydney'    },
  { label: '🌺 Bangkok',    city: 'Bangkok'   },
];

const ROOM_TYPES = ['All', 'Standard', 'Deluxe', 'Suite', 'Premium', 'Villa', 'Heritage'];

// ─── Book Modal ───────────────────────────────────────────────────────────────
const BookHotelModal = ({ hotel, onClose }) => {
  const [trips,     setTrips]     = useState([]);
  const [tripId,    setTripId]    = useState('');
  const [checkIn,   setCheckIn]   = useState('');
  const [checkOut,  setCheckOut]  = useState('');
  const [rooms,     setRooms]     = useState(1);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    // Load user's trips so they can attach hotel to one
    getMyTrips().then((r) => setTrips(r.data.trips || [])).catch(() => {});
  }, []);

  const nights = (checkIn && checkOut)
    ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 1;
  const total = hotel.pricePerNight * rooms * nights;

  const handleBook = async () => {
    if (!tripId || !checkIn || !checkOut) {
      return toast.error('Please select a trip, check-in and check-out date.');
    }
    setLoading(true);
    try {
      await bookHotel({
        hotelId:      hotel.id,
        tripId,
        checkIn,
        checkOut,
        rooms,
        guests:       rooms * 2,
        dynamicPrice: hotel.pricePerNight,
      });
      toast.success(`${hotel.name} booked! 🏨`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600/30 to-teal-600/20 px-6 py-4 border-b border-gray-700 flex items-start justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">{hotel.name}</h2>
            <p className="text-gray-400 text-sm">{hotel.city}, {hotel.country}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Trip selector */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Attach to Trip</label>
            <select value={tripId} onChange={(e) => setTripId(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-xl border border-gray-700 px-4 py-3 text-sm focus:outline-none focus:border-emerald-500">
              <option value="">— Select a trip —</option>
              {trips.map((t) => <option key={t.id} value={t.id}>{t.title} ({t.destination})</option>)}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Check-In</label>
              <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-gray-800 text-white rounded-xl border border-gray-700 px-3 py-3 text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Check-Out</label>
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split('T')[0]}
                className="w-full bg-gray-800 text-white rounded-xl border border-gray-700 px-3 py-3 text-sm focus:outline-none focus:border-emerald-500" />
            </div>
          </div>

          {/* Rooms */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Rooms</label>
            <input type="number" min="1" max="10" value={rooms} onChange={(e) => setRooms(Number(e.target.value))}
              className="w-full bg-gray-800 text-white rounded-xl border border-gray-700 px-3 py-3 text-sm focus:outline-none focus:border-emerald-500" />
          </div>

          {/* Price summary */}
          <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>{formatINR(hotel.pricePerNight)} × {rooms} room(s) × {nights} night(s)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300 font-medium">Total</span>
              <span className="text-emerald-400 font-bold text-lg">{formatINR(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button onClick={handleBook} disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50">
            {loading ? 'Booking...' : `Confirm Booking · ${formatINR(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Hotel Card ───────────────────────────────────────────────────────────────
const HotelCard = ({ hotel, nights, onBook, onViewDetails }) => {
  const amenityList = (hotel.amenities || '').split(',').slice(0, 4);

  return (
    <div
      onClick={() => onViewDetails(hotel)}
      className="bg-gray-900/80 border border-gray-800 hover:border-emerald-500/40 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-emerald-900/20 group cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Card Photo */}
        <div className="h-44 relative overflow-hidden bg-gray-950">
          <img
            src={getPhotosForHotel(hotel)[0]?.url || `https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80`}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-black/30" />


          {/* Star badge */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg">
            <Stars count={hotel.starRating} />
          </div>
          {/* Room type badge */}
          <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-lg font-semibold shadow-md">
            {hotel.roomType}
          </div>
          {/* View Details Overlay prompt */}
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-emerald-300 text-[11px] px-2.5 py-1 rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            Photos & Details 🔍
          </div>
        </div>


        <div className="p-4 space-y-3">
          {/* Hotel name + location */}
          <div>
            <h3 className="text-white font-semibold text-sm leading-snug group-hover:text-emerald-400 transition-colors line-clamp-2">
              {hotel.name}
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">{hotel.city}, {hotel.country}</p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <span className="bg-emerald-600/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-md">
              {hotel.rating?.toFixed(1)}
            </span>
            <span className="text-gray-500 text-xs">{hotel.reviewCount?.toLocaleString()} reviews</span>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-1">
            {amenityList.map((a) => (
              <span key={a} className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                {a.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Price + Book / View Details */}
      <div className="p-4 pt-0">
        <div className="flex items-end justify-between pt-2 border-t border-gray-800">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 text-xs line-through">
                {formatINR(Math.round((Math.max(hotel.baseFare || 0, hotel.pricePerNight) * 1.25) / 100) * 100)}
              </span>
              <span className="text-emerald-400 font-bold text-base">{formatINR(hotel.pricePerNight)}</span>
            </div>
            <p className="text-gray-500 text-[10px]">per night</p>
            {nights > 1 && (
              <p className="text-gray-400 text-xs">{formatINR(hotel.totalPrice)} for {nights} nights</p>
            )}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(hotel);
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all"
            >
              Details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBook(hotel);
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-500 transition-all"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};


// ─── Main Page ────────────────────────────────────────────────────────────────
const HotelSearchPage = () => {
  // ── Search form state ─────────────────────────────────────────────────────
  const [city,     setCity]     = useState('');
  const [checkIn,  setCheckIn]  = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests,   setGuests]   = useState(1);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [sortBy,    setSortBy]    = useState('price');
  const [minStar,   setMinStar]   = useState(1);
  const [maxPrice,  setMaxPrice]  = useState(300000); // ₹3L covers ultra-luxury
  const [roomType,  setRoomType]  = useState('All');

  // ── Results state ─────────────────────────────────────────────────────────
  const [hotels,    setHotels]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [searched,  setSearched]  = useState(false);
  const [popular,   setPopular]   = useState([]);

  // ── Modal states ──────────────────────────────────────────────────────────
  const [bookHotelTarget, setBookHotelTarget] = useState(null);
  const [detailHotelTarget, setDetailHotelTarget] = useState(null);

  // Load popular hotels on mount
  useEffect(() => {
    getPopularHotels()
      .then((r) => setPopular((r.data.hotels || []).slice(0, 6)))
      .catch(() => {});
  }, []);

  // Calculate nights from dates
  const nights = (checkIn && checkOut)
    ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 0;

  const handleSearch = async () => {
    if (!city.trim()) return toast.error('Please enter a city or destination.');
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchHotels({ city, checkIn, checkOut, minStar, maxPrice, roomType, sortBy, guests });
      setHotels(res.data.hotels || []);
      if ((res.data.hotels || []).length === 0) toast('No hotels found. Try different filters.', { icon: '🔍' });
    } catch {
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (destination) => {
    setCity(destination);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Hotel Search</h1>
        <p className="text-gray-400 text-sm">Find the perfect stay — from budget guesthouses to luxury palaces worldwide</p>
      </div>

      {/* ── Search Panel ─────────────────────────────────────────────────── */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 mb-8 shadow-xl">
        {/* Main search fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          {/* City / Destination */}
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wider">Destination</label>
            <input
              type="text"
              placeholder="City, country, or region"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl border border-gray-700 px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>
          {/* Check-in */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wider">Check-In</label>
            <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-gray-800 text-white rounded-xl border border-gray-700 px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
          </div>
          {/* Check-out */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wider">Check-Out</label>
            <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || new Date().toISOString().split('T')[0]}
              className="w-full bg-gray-800 text-white rounded-xl border border-gray-700 px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
          </div>
          {/* Guests + Search button */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wider">Guests</label>
            <div className="flex gap-2">
              <input type="number" min="1" max="10" value={guests} onChange={(e) => setGuests(Number(e.target.value))}
                className="w-20 bg-gray-800 text-white rounded-xl border border-gray-700 px-3 py-3 text-sm focus:outline-none focus:border-emerald-500" />
              <button onClick={handleSearch} disabled={loading}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50">
                {loading ? '...' : '🔍 Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Duration badge */}
        {nights > 0 && (
          <p className="text-xs text-emerald-400/70 mb-3">📅 {nights} night{nights > 1 ? 's' : ''} selected</p>
        )}

        {/* Quick destination chips */}
        <div className="flex flex-wrap gap-2">
          {QUICK_DESTINATIONS.map((d) => (
            <button key={d.city} onClick={() => handleChipClick(d.city)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                city === d.city
                  ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-400'
                  : 'bg-gray-800/60 border-gray-700/60 text-gray-400 hover:border-emerald-500/40 hover:text-emerald-400'
              }`}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content: Filters + Results ──────────────────────────────── */}
      <div className="flex gap-6">
        {/* ── Filter Panel ──────────────────────────────────────────────── */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 sticky top-6 space-y-6">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Filters</h3>

            {/* Sort by */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Sort By</label>
              <div className="flex flex-col gap-1">
                {[
                  { val: 'price',  label: '💸 Price (Low → High)' },
                  { val: 'rating', label: '⭐ Rating (Best First)' },
                  { val: 'stars',  label: '🏆 Stars (Luxury First)' },
                ].map((s) => (
                  <button key={s.val} onClick={() => setSortBy(s.val)}
                    className={`text-xs text-left px-3 py-2 rounded-lg transition-all ${sortBy === s.val ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Min Stars */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Minimum Stars</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setMinStar(s)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${minStar === s ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>
                    {s}★
                  </button>
                ))}
              </div>
            </div>

            {/* Room Type */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Room Type</label>
              <div className="flex flex-col gap-1">
                {ROOM_TYPES.map((rt) => (
                  <button key={rt} onClick={() => setRoomType(rt)}
                    className={`text-xs text-left px-3 py-2 rounded-lg transition-all ${roomType === rt ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                    {rt}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Price */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-400 font-medium">Max Price / Night</span>
                <span className="text-emerald-400 font-bold">{formatINR(maxPrice)}</span>
              </div>
              <input type="range" min="1000" max="300000" step="2000" value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>₹1K</span><span>₹1.5L</span><span>₹3L</span>
              </div>
              {/* Price guide */}
              <div className="mt-3 space-y-1 text-[10px] text-gray-500">
                <p className="font-semibold text-gray-400 uppercase tracking-wider">Price Guide</p>
                <div className="flex justify-between"><span>🏡 Budget</span><span>₹1K–₹5K</span></div>
                <div className="flex justify-between"><span>🏨 Mid-range</span><span>₹5K–₹20K</span></div>
                <div className="flex justify-between"><span>🌟 Luxury</span><span>₹20K–₹80K</span></div>
                <div className="flex justify-between text-amber-400/80"><span>👑 Ultra-luxury</span><span>₹80K+</span></div>
              </div>
            </div>

            {/* Apply button */}
            <button onClick={handleSearch}
              className="w-full py-2.5 rounded-xl font-semibold text-sm bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-500 transition-all">
              Apply Filters
            </button>
          </div>
        </aside>

        {/* ── Results / Popular ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {loading ? (
            /* Loading skeleton */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-40 bg-gray-800"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-800 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : searched ? (
            hotels.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-400 text-sm">
                    <span className="text-white font-semibold">{hotels.length}</span> hotels found in{' '}
                    <span className="text-emerald-400 font-semibold">{city}</span>
                    {nights > 0 && <span> · {nights} night{nights > 1 ? 's' : ''}</span>}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {hotels.map((hotel) => (
                    <HotelCard
                      key={hotel.id}
                      hotel={hotel}
                      nights={nights}
                      onBook={setBookHotelTarget}
                      onViewDetails={setDetailHotelTarget}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">🏨</p>
                <h3 className="text-white text-lg font-semibold mb-2">No hotels found</h3>
                <p className="text-gray-400 text-sm">Try a different city or adjust your filters.</p>
              </div>
            )
          ) : (
            /* Default: Popular Hotels */
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold text-lg">🌟 Featured Hotels</h2>
                <span className="text-gray-500 text-xs">Top-rated picks worldwide</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {popular.map((hotel) => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    nights={0}
                    onBook={setBookHotelTarget}
                    onViewDetails={setDetailHotelTarget}
                  />
                ))}
              </div>

              {/* "How it works" info banner */}
              <div className="mt-8 bg-emerald-900/20 border border-emerald-500/20 rounded-2xl p-5">
                <h3 className="text-emerald-400 font-semibold mb-3">💡 How Hotel Pricing Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-400">
                  <div className="flex gap-3"><span className="text-lg">📅</span><div><p className="text-white text-xs font-medium mb-0.5">Check-in Proximity</p><p className="text-xs">Last-minute bookings cost more. Book 60+ days ahead for best rates.</p></div></div>
                  <div className="flex gap-3"><span className="text-lg">📆</span><div><p className="text-white text-xs font-medium mb-0.5">Weekend Premium</p><p className="text-xs">Friday & Saturday check-ins cost ~15% more. Consider weekdays.</p></div></div>
                  <div className="flex gap-3"><span className="text-lg">🌸</span><div><p className="text-white text-xs font-medium mb-0.5">Peak Season</p><p className="text-xs">October–January is peak in India. Expect a 20% premium.</p></div></div>
                  <div className="flex gap-3"><span className="text-lg">🌙</span><div><p className="text-white text-xs font-medium mb-0.5">Longer Stays = Savings</p><p className="text-xs">Stay 7+ nights for up to 15% off. 14+ nights gets 25% off.</p></div></div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Book Hotel Modal ───────────────────────────────────────────────── */}
      {bookHotelTarget && (
        <BookHotelModal hotel={bookHotelTarget} onClose={() => setBookHotelTarget(null)} />
      )}

      {/* ── Hotel Detail Modal ─────────────────────────────────────────────── */}
      {detailHotelTarget && (
        <HotelDetailModal
          hotelId={detailHotelTarget.id}
          initialHotel={detailHotelTarget}
          onClose={() => setDetailHotelTarget(null)}
        />
      )}
    </div>
  );
};

export default HotelSearchPage;
