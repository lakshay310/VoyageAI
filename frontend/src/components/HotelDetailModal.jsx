// src/components/HotelDetailModal.jsx
// Full-screen hotel detail modal that appears when a user clicks on a hotel card.
// Shows: photo gallery, about section, amenities with icons, services,
//        pricing breakdown, and an inline booking form.

import { useState, useEffect } from 'react';
import { toast }               from 'react-hot-toast';
import { getHotelById, bookHotel } from '../services/hotel.service';
import { getMyTrips }              from '../services/trip.service';

// ─── Format helpers ──────────────────────────────────────────────────────────
const formatINR = (n) => {
  if (!n && n !== 0) return '—';
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};

const Stars = ({ count }) => (
  <span className="text-amber-400">
    {'★'.repeat(Math.min(count, 5))}{'☆'.repeat(Math.max(0, 5 - Math.min(count, 5)))}
  </span>
);

// ─── Amenity icon mapping ────────────────────────────────────────────────────
// Maps amenity keyword → emoji icon + label
const AMENITY_ICONS = {
  wifi:           { icon: '📶', label: 'Free WiFi' },
  pool:           { icon: '🏊', label: 'Swimming Pool' },
  spa:            { icon: '💆', label: 'Spa & Wellness' },
  gym:            { icon: '🏋️', label: 'Fitness Centre' },
  restaurant:     { icon: '🍽️', label: 'Restaurant' },
  bar:            { icon: '🍸', label: 'Bar & Lounge' },
  beach:          { icon: '🏖️', label: 'Beach Access' },
  'private beach':{ icon: '🏖️', label: 'Private Beach' },
  butler:         { icon: '🛎️', label: 'Butler Service' },
  parking:        { icon: '🅿️', label: 'Free Parking' },
  casino:         { icon: '🎰', label: 'Casino' },
  golf:           { icon: '⛳', label: 'Golf Course' },
  yoga:           { icon: '🧘', label: 'Yoga Classes' },
  ayurveda:       { icon: '🌿', label: 'Ayurveda' },
  'fine dining':  { icon: '🍾', label: 'Fine Dining' },
  shuttle:        { icon: '🚌', label: 'Airport Shuttle' },
  heritage:       { icon: '🏛️', label: 'Heritage Property' },
  diving:         { icon: '🤿', label: 'Scuba Diving' },
  'water park':   { icon: '🎡', label: 'Water Park' },
  snorkeling:     { icon: '🤿', label: 'Snorkeling' },
  bonfire:        { icon: '🔥', label: 'Bonfire' },
  'mountain view':{ icon: '⛰️', label: 'Mountain View' },
  'sea view':     { icon: '🌊', label: 'Sea View' },
  'lake view':    { icon: '🏞️', label: 'Lake View' },
  'river view':   { icon: '🏞️', label: 'River View' },
  'city view':    { icon: '🏙️', label: 'City View' },
  'jungle view':  { icon: '🌿', label: 'Jungle View' },
  'all inclusive':{ icon: '✅', label: 'All Inclusive' },
  'all meals':    { icon: '🍱', label: 'All Meals' },
  'breakfast':    { icon: '🥐', label: 'Breakfast Included' },
  'locker':       { icon: '🔒', label: 'Secure Lockers' },
  'concierge':    { icon: '🗝️', label: 'Concierge' },
  'rooftop':      { icon: '🌆', label: 'Rooftop Access' },
  'tv':           { icon: '📺', label: 'Smart TV' },
  'ac':           { icon: '❄️', label: 'Air Conditioning' },
  'boat':         { icon: '⛵', label: 'Boat Rides' },
};

// Parse amenity string into icon objects
const parseAmenities = (amenitiesStr = '') => {
  const items = amenitiesStr.split(',').map(a => a.trim().toLowerCase());
  return items.map((a) => {
    const key = Object.keys(AMENITY_ICONS).find((k) => a.includes(k));
    return key
      ? { ...AMENITY_ICONS[key], raw: a }
      : { icon: '✓', label: a.charAt(0).toUpperCase() + a.slice(1), raw: a };
  }).filter(a => a.raw);
};

// ─── Hotel-type specific data ─────────────────────────────────────────────────
const getHotelContext = (hotel) => {
  const tier = hotel.starRating >= 5 ? 'luxury' : hotel.starRating >= 4 ? 'premium' : hotel.starRating >= 3 ? 'midrange' : 'budget';

  const aboutMap = {
    luxury: `${hotel.name} is an iconic ${hotel.starRating}-star luxury property in ${hotel.city}, ${hotel.country}, celebrated for its world-class service, exquisite architecture, and unparalleled guest experience. From the moment you arrive, the hotel wraps you in opulence — personalized butler service, award-winning restaurants, and meticulously designed suites that blend local culture with contemporary luxury.`,
    premium: `${hotel.name} is a distinguished ${hotel.starRating}-star hotel in the heart of ${hotel.city}, offering a premium experience without compromise. The property combines sophisticated design with warm hospitality, making it the perfect choice for discerning travellers who want exceptional comfort at an excellent value.`,
    midrange: `${hotel.name} is a well-appointed ${hotel.starRating}-star hotel in ${hotel.city} that delivers quality and comfort across every category. With thoughtfully designed rooms, essential amenities, and a friendly service culture, it's ideal for both leisure travellers and business guests seeking a reliable, comfortable stay.`,
    budget: `${hotel.name} offers clean, comfortable, and affordable accommodation in ${hotel.city}. Perfect for backpackers, solo travellers, and budget-conscious guests who want a safe, sociable base without spending a fortune — with everything they need within easy reach.`,
  };

  const servicesMap = {
    luxury: [
      { icon: '🛎️', title: '24/7 Butler Service', desc: 'Dedicated butler available around the clock for all your needs' },
      { icon: '🍽️', title: 'Fine Dining Restaurant', desc: 'Award-winning cuisine crafted by world-class chefs' },
      { icon: '💆', title: 'Signature Spa', desc: 'Full-service spa with signature treatments and wellness programs' },
      { icon: '🧹', title: 'Daily Housekeeping', desc: 'Twice-daily room service with turndown service in the evening' },
      { icon: '🚗', title: 'Limousine Transfers', desc: 'Complimentary luxury airport pickup and city transfers' },
      { icon: '🎩', title: 'Concierge Desk', desc: 'Expert local knowledge for dining, tours, and exclusive experiences' },
      { icon: '👔', title: 'Laundry & Valet', desc: 'Same-day laundry, pressing, and dry-cleaning service' },
      { icon: '📶', title: 'High-Speed Internet', desc: 'Complimentary lightning-fast fibre WiFi throughout the property' },
    ],
    premium: [
      { icon: '🍳', title: 'All-Day Dining', desc: 'Breakfast, lunch, and dinner served with an extensive à la carte menu' },
      { icon: '🏋️', title: 'Fitness Centre', desc: 'Fully equipped modern gym open 24 hours' },
      { icon: '🧹', title: 'Daily Housekeeping', desc: 'Full room service every day with evening turndown' },
      { icon: '🚗', title: 'Airport Transfers', desc: 'Scheduled shuttle service to and from the airport' },
      { icon: '🛎️', title: 'Front Desk 24/7', desc: 'Round-the-clock reception to assist with any request' },
      { icon: '💆', title: 'Spa & Wellness', desc: 'On-site spa with a curated menu of relaxing treatments' },
      { icon: '📶', title: 'Free WiFi', desc: 'High-speed internet available throughout the hotel' },
      { icon: '🧺', title: 'Laundry Service', desc: 'Same-day laundry with premium pressing available' },
    ],
    midrange: [
      { icon: '🍳', title: 'Breakfast Buffet', desc: 'Daily hot and cold breakfast buffet from 7 AM – 10:30 AM' },
      { icon: '📶', title: 'Free WiFi', desc: 'Complimentary internet access in all rooms and public areas' },
      { icon: '🧹', title: 'Daily Housekeeping', desc: 'Room cleaning every day with fresh towels and linens' },
      { icon: '🛎️', title: 'Front Desk 24/7', desc: '24-hour reception to assist with check-in, check-out, and queries' },
      { icon: '🅿️', title: 'On-site Parking', desc: 'Secure parking available (charges may apply)' },
      { icon: '🍽️', title: 'In-Room Dining', desc: 'Room service available during restaurant hours' },
    ],
    budget: [
      { icon: '📶', title: 'Free WiFi', desc: 'Complimentary internet throughout the hostel/hotel' },
      { icon: '🔒', title: 'Secure Lockers', desc: 'Personal lockers available in dorms and shared areas' },
      { icon: '🍳', title: 'Communal Kitchen', desc: 'Self-catering kitchen facilities available for guests' },
      { icon: '🛎️', title: 'Reception', desc: 'Friendly front desk staff ready to help with local tips' },
      { icon: '🗺️', title: 'Tour Desk', desc: 'Affordable local tours and activity bookings' },
    ],
  };

  return {
    about: aboutMap[tier],
    services: servicesMap[tier],
    tier,
  };
};

// ─── Curated Unsplash photo pools categorized by hotel destination & style ─
const PHOTO_POOLS = {
  palace: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
  ],
  beach: [
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80',
  ],
  city: [
    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80',
  ],
  mountain: [
    'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80',
  ],
  boutique: [
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80',
  ],
  budget: [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?auto=format&fit=crop&w=1200&q=80',
  ],
};

// Generates unique photos per hotel using hash & theme lookup
export const getPhotosForHotel = (hotel) => {
  if (!hotel) return [];

  const city = (hotel.city || '').toLowerCase();
  const name = (hotel.name || '').toLowerCase();

  let category = 'city';
  if (name.includes('palace') || name.includes('taj') || name.includes('oberoi') || name.includes('ritz') || name.includes('four seasons')) {
    category = 'palace';
  } else if (city.includes('goa') || city.includes('bali') || city.includes('phuket') || city.includes('maldives') || city.includes('kerala') || city.includes('andaman') || city.includes('cancun')) {
    category = 'beach';
  } else if (city.includes('manali') || city.includes('shimla') || city.includes('leh') || city.includes('rishikesh') || city.includes('kathmandu')) {
    category = 'mountain';
  } else if (name.includes('zostel') || name.includes('hostel') || name.includes('pod') || hotel.starRating <= 2) {
    category = 'budget';
  } else if (name.includes('boutique') || name.includes('haveli') || city.includes('jaipur') || city.includes('varanasi') || city.includes('rome') || city.includes('prague')) {
    category = 'boutique';
  }

  const pool = PHOTO_POOLS[category] || PHOTO_POOLS.city;

  let hash = 0;
  const str = hotel.id || hotel.name || 'default';
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const offset = Math.abs(hash) % pool.length;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];

  if (hotel.imageUrl) {
    return [{ url: hotel.imageUrl, label: 'Main View' }, ...rotated.slice(0, 5).map((url, idx) => ({ url, label: `Photo ${idx + 2}` }))];
  }

  return rotated.slice(0, 6).map((url, idx) => ({ url, label: `Photo ${idx + 1}` }));
};

const PhotoGallery = ({ hotel }) => {
  const [active, setActive] = useState(0);
  const photos = getPhotosForHotel(hotel);

  // Automatic slideshow cycle every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % photos.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [photos.length]);

  return (
    <div className="relative group overflow-hidden bg-gray-950">
      {/* Main photo */}
      <div className="h-72 w-full relative overflow-hidden flex items-center justify-center bg-gray-900">
        <img
          key={active}
          src={photos[active]?.url}
          alt={hotel.name}
          className="w-full h-full object-cover transition-opacity duration-700 animate-fadeIn"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
          }}
        />

        {/* Slide counter badge */}
        <div className="absolute bottom-3 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white font-medium tracking-wide">
          {active + 1} / {photos.length}
        </div>

        {/* Prev/Next arrows */}
        <button
          onClick={() => setActive((a) => (a - 1 + photos.length) % photos.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all text-xl opacity-0 group-hover:opacity-100"
        >
          ‹
        </button>
        <button
          onClick={() => setActive((a) => (a + 1) % photos.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all text-xl opacity-0 group-hover:opacity-100"
        >
          ›
        </button>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 p-3 bg-gray-950 overflow-x-auto scrollbar-none">
        {photos.map((p, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`flex-1 min-w-[60px] h-14 rounded-xl overflow-hidden relative transition-all duration-300 ${
              active === i ? 'ring-2 ring-emerald-500 scale-105 opacity-100' : 'opacity-50 hover:opacity-80'
            }`}
          >
            <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};




// ─── Booking Section (inline inside the modal) ────────────────────────────
const BookingPanel = ({ hotel, onClose }) => {
  const [trips,    setTrips]    = useState([]);
  const [tripId,   setTripId]   = useState('');
  const [checkIn,  setCheckIn]  = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [rooms,    setRooms]    = useState(1);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    getMyTrips().then(r => setTrips(r.data.trips || [])).catch(() => {});
  }, []);

  const nights = (checkIn && checkOut)
    ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 1;
  const total = hotel.pricePerNight * rooms * nights;

  const handleBook = async () => {
    if (!tripId || !checkIn || !checkOut) {
      return toast.error('Please select a trip and both check-in & check-out dates.');
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
    <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl p-5 space-y-4">
      <h3 className="text-white font-bold text-sm uppercase tracking-wider">📋 Book This Room</h3>

      {/* Trip selector */}
      <div>
        <label className="block text-xs text-gray-400 mb-1 font-medium">Attach to Trip</label>
        <select value={tripId} onChange={e => setTripId(e.target.value)}
          className="w-full bg-gray-800 text-white rounded-xl border border-gray-700 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500">
          <option value="">— Select a trip —</option>
          {trips.map(t => <option key={t.id} value={t.id}>{t.title} ({t.destination})</option>)}
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Check-In</label>
          <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full bg-gray-800 text-white rounded-xl border border-gray-700 px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Check-Out</label>
          <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
            min={checkIn || new Date().toISOString().split('T')[0]}
            className="w-full bg-gray-800 text-white rounded-xl border border-gray-700 px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500" />
        </div>
      </div>

      {/* Rooms */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Rooms</label>
        <div className="flex items-center gap-3">
          <button onClick={() => setRooms(r => Math.max(1, r - 1))}
            className="w-8 h-8 rounded-lg bg-gray-800 text-white font-bold text-lg flex items-center justify-center hover:bg-gray-700">−</button>
          <span className="text-white font-bold w-8 text-center">{rooms}</span>
          <button onClick={() => setRooms(r => Math.min(10, r + 1))}
            className="w-8 h-8 rounded-lg bg-gray-800 text-white font-bold text-lg flex items-center justify-center hover:bg-gray-700">+</button>
          <span className="text-gray-500 text-xs ml-1">room(s)</span>
        </div>
      </div>

      {/* Price summary */}
      <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-700/40">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{formatINR(hotel.pricePerNight)} × {rooms} room × {nights} night{nights > 1 ? 's' : ''}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300 text-sm font-medium">Total Amount</span>
          <span className="text-emerald-400 font-bold text-xl">{formatINR(total)}</span>
        </div>
      </div>

      {/* Confirm button */}
      <button onClick={handleBook} disabled={loading}
        className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/30">
        {loading ? 'Confirming...' : `✅ Confirm Booking · ${formatINR(total)}`}
      </button>
    </div>
  );
};

// ─── Main Modal Component ────────────────────────────────────────────────────
const HotelDetailModal = ({ hotelId, initialHotel, onClose }) => {
  const [hotel,   setHotel]   = useState(initialHotel || null);
  const [loading, setLoading] = useState(!initialHotel);
  const [tab,     setTab]     = useState('about'); // 'about' | 'amenities' | 'services' | 'book'

  useEffect(() => {
    if (!hotelId) return;
    setLoading(true);
    getHotelById(hotelId)
      .then(r => setHotel(r.data.hotel))
      .catch(() => toast.error('Could not load hotel details.'))
      .finally(() => setLoading(false));
  }, [hotelId]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (loading || !hotel) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🏨</div>
          <p className="text-white font-medium">Loading hotel details…</p>
        </div>
      </div>
    );
  }

  const amenities  = parseAmenities(hotel.amenities);
  const ctx        = getHotelContext(hotel);
  // Rack rate (original price) is always 25% higher than current price so cut rate is higher
  const rackRate   = Math.round((Math.max(hotel.baseFare || 0, hotel.pricePerNight) * 1.25) / 100) * 100;

  const tierColors = {
    luxury:   'from-amber-500/20 to-yellow-600/10 border-amber-500/30',
    premium:  'from-emerald-500/20 to-teal-600/10 border-emerald-500/30',
    midrange: 'from-blue-500/20 to-indigo-600/10 border-blue-500/30',
    budget:   'from-gray-500/20 to-slate-600/10 border-gray-500/30',
  }[ctx.tier];

  const tierBadge = {
    luxury:   { label: '👑 Ultra Luxury', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    premium:  { label: '🌟 Premium',      cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    midrange: { label: '🏨 Mid-Range',    cls: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    budget:   { label: '🎒 Budget',       cls: 'bg-gray-500/20 text-gray-300 border-gray-500/40' },
  }[ctx.tier];

  const TABS = [
    { id: 'about',     label: '📖 About'    },
    { id: 'amenities', label: '✨ Amenities' },
    { id: 'services',  label: '🛎️ Services'  },
    { id: 'book',      label: '📋 Book'     },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm p-4 pt-8">
      <div className="w-full max-w-3xl bg-gray-950 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl mb-8 relative">

        {/* Close button */}
        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all text-lg">
          ✕
        </button>

        {/* Photo Gallery */}
        <PhotoGallery hotel={hotel} />

        {/* Hotel info header */}
        <div className={`bg-gradient-to-r ${tierColors} border-b px-6 py-4`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${tierBadge.cls}`}>
                  {tierBadge.label}
                </span>
                <span className="text-xs bg-gray-800/60 text-gray-400 px-2 py-0.5 rounded-full">
                  {hotel.roomType}
                </span>
              </div>
              <h1 className="text-white font-bold text-xl leading-tight">{hotel.name}</h1>
              <p className="text-gray-400 text-sm mt-0.5">📍 {hotel.address}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <Stars count={hotel.starRating} />
                <span className="bg-emerald-600/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-md">
                  {hotel.rating?.toFixed(1)} ⭐
                </span>
                <span className="text-gray-500 text-xs">{hotel.reviewCount?.toLocaleString()} reviews</span>
                <span className="text-gray-500 text-xs">•</span>
                <span className="text-gray-400 text-xs">{hotel.availableRooms} rooms left</span>
              </div>
            </div>
            {/* Price block */}
            <div className="text-right shrink-0">
              <p className="text-gray-400 text-xs line-through">{formatINR(rackRate)}</p>
              <p className="text-emerald-400 font-bold text-2xl">{formatINR(hotel.pricePerNight)}</p>
              <p className="text-gray-500 text-xs">per night</p>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-gray-800 bg-gray-950">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-xs font-semibold transition-all ${
                tab === t.id
                  ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-950/20'
                  : 'text-gray-500 hover:text-gray-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">

          {/* ABOUT TAB */}
          {tab === 'about' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-2">About the Hotel</h2>
                <p className="text-gray-400 text-sm leading-relaxed">{ctx.about}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: '⭐', label: 'Rating',     val: `${hotel.rating?.toFixed(1)}/5.0` },
                  { icon: '🏆', label: 'Stars',      val: `${Math.min(hotel.starRating, 5)} Star Hotel` },
                  { icon: '🛏️', label: 'Room Type',  val: hotel.roomType },
                  { icon: '📍', label: 'Location',   val: `${hotel.city}, ${hotel.country}` },
                  { icon: '🚪', label: 'Rooms Left',  val: `${hotel.availableRooms} available` },
                  { icon: '💬', label: 'Reviews',    val: `${hotel.reviewCount?.toLocaleString()} reviews` },
                ].map(h => (
                  <div key={h.label} className="bg-gray-900/60 border border-gray-800/60 rounded-xl p-3">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-0.5">{h.icon} {h.label}</p>
                    <p className="text-white text-xs font-semibold">{h.val}</p>
                  </div>
                ))}
              </div>

              <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-4">
                <h3 className="text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-3">💰 Pricing Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Standard Rack Rate</span>
                    <span className="text-gray-400 line-through">{formatINR(rackRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Special Offer Price</span>
                    <span className="text-emerald-400 font-bold">{formatINR(hotel.pricePerNight)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-400/90 pt-1.5 border-t border-gray-800">
                    <span>You Save</span>
                    <span className="font-bold">{formatINR(rackRate - hotel.pricePerNight)} (20% OFF)</span>
                  </div>
                </div>
              </div>


              <button onClick={() => setTab('book')}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-900/30">
                Book This Hotel →
              </button>
            </div>
          )}

          {/* AMENITIES TAB */}
          {tab === 'amenities' && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">Everything included in your stay at {hotel.name}:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenities.map((a, i) => (
                  <div key={i}
                    className="flex items-center gap-3 bg-gray-900/60 border border-gray-800/60 rounded-xl p-3 hover:border-emerald-500/30 transition-all">
                    <span className="text-2xl">{a.icon}</span>
                    <span className="text-gray-300 text-xs font-medium">{a.label}</span>
                  </div>
                ))}
              </div>
              {amenities.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8">No amenity details available.</p>
              )}

              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 mt-2">
                <h3 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">📋 Hotel Policies</h3>
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Check-in Time</span><span className="text-white">2:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Check-out Time</span><span className="text-white">12:00 PM (Noon)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cancellation</span><span className="text-white">Free before 48 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pets</span><span className="text-white">{hotel.starRating >= 4 ? 'Upon request' : 'Not allowed'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Children</span><span className="text-white">Welcome (under 5 free)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment</span><span className="text-white">Credit/Debit/UPI</span>
                  </div>
                </div>
              </div>

              <button onClick={() => setTab('book')}
                className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-all">
                Book Now →
              </button>
            </div>
          )}

          {/* SERVICES TAB */}
          {tab === 'services' && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">Our dedicated team ensures every guest has an exceptional experience:</p>
              <div className="space-y-3">
                {ctx.services.map((s, i) => (
                  <div key={i}
                    className="flex gap-4 bg-gray-900/60 border border-gray-800/60 rounded-xl p-4 hover:border-emerald-500/20 transition-all group">
                    <span className="text-2xl mt-0.5 shrink-0">{s.icon}</span>
                    <div>
                      <p className="text-white font-semibold text-sm group-hover:text-emerald-400 transition-colors">{s.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {ctx.tier === 'luxury' && (
                <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-4">
                  <h3 className="text-amber-400 font-semibold text-xs uppercase tracking-wider mb-2">👑 Signature Experiences</h3>
                  <ul className="space-y-1 text-xs text-gray-400">
                    <li>• Private city tour in a luxury vehicle</li>
                    <li>• In-room spa treatment on arrival</li>
                    <li>• Personalised welcome gift & local delicacies</li>
                    <li>• Exclusive access to hotel rooftop or private deck</li>
                  </ul>
                </div>
              )}

              <button onClick={() => setTab('book')}
                className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-all">
                Book Now →
              </button>
            </div>
          )}

          {/* BOOK TAB */}
          {tab === 'book' && (
            <BookingPanel hotel={hotel} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelDetailModal;
