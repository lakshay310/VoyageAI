// src/services/hotel.service.js
// Business logic for hotel search and booking.
// Sits between Controller (HTTP layer) and Repository (Database layer).
//
// ⚠️ PRICING NOTE:
//   Hotel prices do NOT come from live APIs.
//   We use a curated inventory of realistic INR base fares + dynamic pricing rules.
//   Dynamic pricing factors:
//   - Closer check-in date = higher price (last-minute premium)
//   - Weekend stays (Fri/Sat nights) = 15% surcharge
//   - Peak season months (Oct–Jan) = 20% premium
//   - More nights = per-night discount (length-of-stay discount)

const hotelRepository = require('../repositories/hotel.repository');
const bookingRepository = require('../repositories/booking.repository');
const tripRepository = require('../repositories/trip.repository');

// ─── Seed Version ─────────────────────────────────────────────────────────────
// Bump this number whenever you add new hotels so the DB gets refreshed.
const SEED_VERSION = 3;

// ─── Curated Hotel Inventory ──────────────────────────────────────────────────
// 200+ hotels across 40+ cities in India and internationally.
// Prices are realistic INR base fares (per night, per room) as of mid-2026.

const SEED_HOTELS = [
  // ══════════════════════════════════════════════════════════════
  // INDIA
  // ══════════════════════════════════════════════════════════════

  // ── GOA ───────────────────────────────────────────────────────
  { name: 'Taj Exotica Resort & Spa',        city: 'Goa',       country: 'India', address: 'Calangute Beach, North Goa',       starRating: 5, pricePerNight: 22000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Beach,Bar,Restaurant',           rating: 4.8, reviewCount: 2840,  availableRooms: 12 },
  { name: 'W Goa',                           city: 'Goa',       country: 'India', address: 'Vagator Beach, North Goa',          starRating: 5, pricePerNight: 18500, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Beach,Gym,Bar',                   rating: 4.7, reviewCount: 1920,  availableRooms: 18 },
  { name: 'Alila Diwa Goa',                  city: 'Goa',       country: 'India', address: 'Majorda, South Goa',                starRating: 5, pricePerNight: 16800, roomType: 'Suite',    amenities: 'WiFi,Pool,Spa,Yoga,Restaurant,Bar',             rating: 4.8, reviewCount: 1450,  availableRooms: 8  },
  { name: 'Novotel Goa Resort & Spa',        city: 'Goa',       country: 'India', address: 'Dona Paula, North Goa',             starRating: 4, pricePerNight: 9500,  roomType: 'Deluxe',   amenities: 'WiFi,Pool,Gym,Restaurant,Bar',                  rating: 4.4, reviewCount: 3200,  availableRooms: 30 },
  { name: 'Lemon Tree Amarante Beach',       city: 'Goa',       country: 'India', address: 'Candolim Beach, North Goa',         starRating: 4, pricePerNight: 7200,  roomType: 'Standard', amenities: 'WiFi,Pool,Restaurant,Beach',                    rating: 4.2, reviewCount: 2100,  availableRooms: 45 },
  { name: 'The LaLiT Golf & Spa Resort',     city: 'Goa',       country: 'India', address: 'Canacona, South Goa',               starRating: 5, pricePerNight: 19500, roomType: 'Premium',  amenities: 'WiFi,Golf,Pool,Spa,Beach,Gym',                  rating: 4.6, reviewCount: 1100,  availableRooms: 15 },
  { name: 'Zostel Goa Panaji',               city: 'Goa',       country: 'India', address: 'Fontainhas, Old Goa',               starRating: 2, pricePerNight: 900,   roomType: 'Standard', amenities: 'WiFi,Common Room,Lockers',                      rating: 4.1, reviewCount: 1800,  availableRooms: 40 },
  { name: 'OYO Rooms Baga Beach',            city: 'Goa',       country: 'India', address: 'Baga Beach Road, Goa',              starRating: 2, pricePerNight: 1800,  roomType: 'Standard', amenities: 'WiFi,AC',                                       rating: 3.5, reviewCount: 980,   availableRooms: 20 },

  // ── DELHI ─────────────────────────────────────────────────────
  { name: 'The Imperial New Delhi',          city: 'Delhi',     country: 'India', address: 'Janpath, Connaught Place',          starRating: 5, pricePerNight: 28000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Gym,Fine Dining,Bar',             rating: 4.9, reviewCount: 3500,  availableRooms: 10 },
  { name: 'Taj Palace Hotel Delhi',          city: 'Delhi',     country: 'India', address: 'Sardar Patel Marg, Delhi',          starRating: 5, pricePerNight: 24000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Gym,Restaurant,Bar',              rating: 4.8, reviewCount: 2800,  availableRooms: 14 },
  { name: 'The Leela Palace Delhi',          city: 'Delhi',     country: 'India', address: 'Chanakyapuri, New Delhi',           starRating: 5, pricePerNight: 26000, roomType: 'Suite',    amenities: 'WiFi,Pool,Spa,Butlers,Fine Dining',             rating: 4.9, reviewCount: 2200,  availableRooms: 8  },
  { name: 'ITC Maurya',                      city: 'Delhi',     country: 'India', address: 'Sardar Patel Marg, Delhi',          starRating: 5, pricePerNight: 20000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Gym,Restaurant',                  rating: 4.7, reviewCount: 3100,  availableRooms: 20 },
  { name: 'Hyatt Regency Delhi',             city: 'Delhi',     country: 'India', address: 'Bhikaiji Cama Place',               starRating: 5, pricePerNight: 14500, roomType: 'Standard', amenities: 'WiFi,Pool,Gym,Restaurant,Bar',                  rating: 4.5, reviewCount: 4200,  availableRooms: 35 },
  { name: 'The Lodhi New Delhi',             city: 'Delhi',     country: 'India', address: 'Lodhi Road, New Delhi',             starRating: 5, pricePerNight: 32000, roomType: 'Suite',    amenities: 'WiFi,Private Pool,Spa,Butler,Restaurant',       rating: 4.9, reviewCount: 1800,  availableRooms: 8  },
  { name: 'ibis New Delhi Aerocity',         city: 'Delhi',     country: 'India', address: 'Aerocity, Near Airport',            starRating: 3, pricePerNight: 4200,  roomType: 'Standard', amenities: 'WiFi,Restaurant,Gym',                           rating: 4.1, reviewCount: 5600,  availableRooms: 60 },
  { name: 'Zostel Delhi',                    city: 'Delhi',     country: 'India', address: 'Paharganj, New Delhi',              starRating: 2, pricePerNight: 900,   roomType: 'Standard', amenities: 'WiFi,Common Room,Locker',                       rating: 4.0, reviewCount: 2300,  availableRooms: 30 },

  // ── MUMBAI ────────────────────────────────────────────────────
  { name: 'Taj Mahal Palace',                city: 'Mumbai',    country: 'India', address: 'Apollo Bunder, Colaba',             starRating: 5, pricePerNight: 45000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Fine Dining,Heritage Tour',       rating: 4.9, reviewCount: 5100,  availableRooms: 8  },
  { name: 'The Oberoi Mumbai',               city: 'Mumbai',    country: 'India', address: 'Nariman Point, Mumbai',             starRating: 5, pricePerNight: 38000, roomType: 'Suite',    amenities: 'WiFi,Pool,Spa,Gym,Sea View,Restaurant',         rating: 4.8, reviewCount: 3400,  availableRooms: 10 },
  { name: 'JW Marriott Mumbai Juhu',         city: 'Mumbai',    country: 'India', address: 'Juhu Tara Road, Juhu',              starRating: 5, pricePerNight: 22000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Gym,Beach View',                  rating: 4.7, reviewCount: 4800,  availableRooms: 18 },
  { name: 'Trident Bandra Kurla',            city: 'Mumbai',    country: 'India', address: 'BKC, Mumbai',                       starRating: 5, pricePerNight: 16000, roomType: 'Standard', amenities: 'WiFi,Pool,Gym,Restaurant,Bar',                  rating: 4.5, reviewCount: 2900,  availableRooms: 25 },
  { name: 'Holiday Inn Mumbai International',city: 'Mumbai',    country: 'India', address: 'Near Airport, Andheri',             starRating: 4, pricePerNight: 7500,  roomType: 'Standard', amenities: 'WiFi,Pool,Gym,Restaurant',                      rating: 4.2, reviewCount: 3800,  availableRooms: 40 },
  { name: 'FabHotel Prime Colaba',           city: 'Mumbai',    country: 'India', address: 'Colaba Causeway, Mumbai',           starRating: 3, pricePerNight: 3500,  roomType: 'Standard', amenities: 'WiFi,AC,24hr Desk',                             rating: 3.8, reviewCount: 1200,  availableRooms: 25 },

  // ── JAIPUR ────────────────────────────────────────────────────
  { name: 'Rambagh Palace',                  city: 'Jaipur',    country: 'India', address: 'Bhawani Singh Road, Jaipur',        starRating: 5, pricePerNight: 42000, roomType: 'Suite',    amenities: 'WiFi,Pool,Spa,Heritage,Polo,Restaurant',        rating: 4.9, reviewCount: 2100,  availableRooms: 6  },
  { name: 'Taj Jai Mahal Palace',            city: 'Jaipur',    country: 'India', address: 'Jacob Road, Civil Lines',           starRating: 5, pricePerNight: 24000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Gym,Restaurant',                  rating: 4.8, reviewCount: 1800,  availableRooms: 12 },
  { name: 'ITC Rajputana',                   city: 'Jaipur',    country: 'India', address: 'Palace Road, Jaipur',               starRating: 5, pricePerNight: 16000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Gym,Restaurant',                  rating: 4.6, reviewCount: 2400,  availableRooms: 20 },
  { name: 'Samode Haveli',                   city: 'Jaipur',    country: 'India', address: 'Gangapole, Walled City',            starRating: 4, pricePerNight: 11000, roomType: 'Heritage', amenities: 'WiFi,Pool,Restaurant,Courtyard',                rating: 4.7, reviewCount: 980,   availableRooms: 10 },
  { name: 'Pearl Palace Heritage',           city: 'Jaipur',    country: 'India', address: 'Hathroi Fort, Ajmer Road',          starRating: 3, pricePerNight: 3800,  roomType: 'Standard', amenities: 'WiFi,Rooftop Restaurant,Garden',                rating: 4.6, reviewCount: 2200,  availableRooms: 18 },
  { name: 'FabHotel Jaipur Station',         city: 'Jaipur',    country: 'India', address: 'Near Railway Station',              starRating: 2, pricePerNight: 1500,  roomType: 'Standard', amenities: 'WiFi,AC,TV',                                    rating: 3.6, reviewCount: 750,   availableRooms: 30 },

  // ── MANALI ────────────────────────────────────────────────────
  { name: 'Span Resort & Spa',               city: 'Manali',    country: 'India', address: 'Kullu-Manali Bypass, NH3',          starRating: 4, pricePerNight: 12000, roomType: 'Deluxe',   amenities: 'WiFi,Spa,River View,Restaurant,Bonfire',        rating: 4.6, reviewCount: 1200,  availableRooms: 15 },
  { name: 'The Himalayan',                   city: 'Manali',    country: 'India', address: 'Old Manali, Himachal Pradesh',      starRating: 3, pricePerNight: 6500,  roomType: 'Standard', amenities: 'WiFi,Mountain View,Restaurant',                 rating: 4.3, reviewCount: 1800,  availableRooms: 20 },
  { name: 'Solang Valley Resort',            city: 'Manali',    country: 'India', address: 'Solang Valley, Manali',             starRating: 3, pricePerNight: 4500,  roomType: 'Standard', amenities: 'WiFi,Valley View,Restaurant',                   rating: 4.1, reviewCount: 900,   availableRooms: 25 },
  { name: 'Hotel Apple Country',             city: 'Manali',    country: 'India', address: 'Circuit House Road, Manali',        starRating: 3, pricePerNight: 3200,  roomType: 'Standard', amenities: 'WiFi,AC,TV,Restaurant',                         rating: 4.0, reviewCount: 1400,  availableRooms: 35 },
  { name: 'Snow Valley Resorts',             city: 'Manali',    country: 'India', address: 'Prini, Near Manali',                starRating: 3, pricePerNight: 5500,  roomType: 'Standard', amenities: 'WiFi,Snow View,Restaurant,Bonfire',             rating: 4.2, reviewCount: 1100,  availableRooms: 20 },

  // ── KERALA ────────────────────────────────────────────────────
  { name: 'Kumarakom Lake Resort',           city: 'Kerala',    country: 'India', address: 'Kumarakom, Kottayam',               starRating: 5, pricePerNight: 32000, roomType: 'Villa',    amenities: 'WiFi,Pool,Spa,Lake View,Ayurveda,Boat',         rating: 4.9, reviewCount: 1400,  availableRooms: 10 },
  { name: 'Fragrant Nature Backwater',       city: 'Kerala',    country: 'India', address: 'Kollam Backwaters',                 starRating: 5, pricePerNight: 22000, roomType: 'Suite',    amenities: 'WiFi,Pool,Spa,Backwater View',                  rating: 4.7, reviewCount: 980,   availableRooms: 12 },
  { name: 'Taj Bekal Resort & Spa',          city: 'Kerala',    country: 'India', address: 'Bekal, Kasaragod',                  starRating: 5, pricePerNight: 28000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Beach,Restaurant',                rating: 4.8, reviewCount: 1100,  availableRooms: 8  },
  { name: 'Sterling Munnar',                 city: 'Kerala',    country: 'India', address: 'Munnar, Kerala',                    starRating: 4, pricePerNight: 8500,  roomType: 'Deluxe',   amenities: 'WiFi,Tea Garden View,Restaurant',               rating: 4.4, reviewCount: 1800,  availableRooms: 22 },
  { name: 'Houseboat Alleppey Deluxe',       city: 'Kerala',    country: 'India', address: 'Alappuzha Backwaters, Kerala',      starRating: 4, pricePerNight: 14000, roomType: 'Suite',    amenities: 'WiFi,Backwater Cruise,All Meals,AC,Sunset View', rating: 4.7, reviewCount: 2100, availableRooms: 8  },
  { name: 'KTDC Tamarind Kovalam',           city: 'Kerala',    country: 'India', address: 'Kovalam Beach, Thiruvananthapuram', starRating: 3, pricePerNight: 4200,  roomType: 'Standard', amenities: 'WiFi,Beach,Restaurant,AC',                      rating: 3.9, reviewCount: 1200,  availableRooms: 30 },

  // ── KOLKATA ───────────────────────────────────────────────────
  { name: 'ITC Royal Bengal',                city: 'Kolkata',   country: 'India', address: '1 JBS Haldane Avenue',              starRating: 5, pricePerNight: 18000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Gym,Restaurant,Bar',              rating: 4.7, reviewCount: 2100,  availableRooms: 20 },
  { name: 'Taj Bengal',                      city: 'Kolkata',   country: 'India', address: '34B Belvedere Road',                starRating: 5, pricePerNight: 15000, roomType: 'Suite',    amenities: 'WiFi,Pool,Spa,Gym,Restaurant',                  rating: 4.6, reviewCount: 1800,  availableRooms: 15 },
  { name: 'The Oberon Kolkata',              city: 'Kolkata',   country: 'India', address: 'Park Street, Kolkata',              starRating: 4, pricePerNight: 8500,  roomType: 'Standard', amenities: 'WiFi,Restaurant,Gym,Bar',                       rating: 4.3, reviewCount: 1500,  availableRooms: 25 },
  { name: 'ibis Kolkata Rajarhat',           city: 'Kolkata',   country: 'India', address: 'Rajarhat, New Town',                starRating: 3, pricePerNight: 3800,  roomType: 'Standard', amenities: 'WiFi,Restaurant,Gym',                           rating: 4.0, reviewCount: 2800,  availableRooms: 50 },

  // ── HYDERABAD ─────────────────────────────────────────────────
  { name: 'Park Hyatt Hyderabad',            city: 'Hyderabad', country: 'India', address: 'Banjara Hills, Hyderabad',          starRating: 5, pricePerNight: 16000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Gym,Restaurant',                  rating: 4.7, reviewCount: 2600,  availableRooms: 22 },
  { name: 'Taj Falaknuma Palace',            city: 'Hyderabad', country: 'India', address: 'Engine Bowli, Falaknuma',           starRating: 5, pricePerNight: 48000, roomType: 'Suite',    amenities: 'WiFi,Nizam Heritage,Pool,Spa,Fine Dining',      rating: 4.9, reviewCount: 1800,  availableRooms: 6  },
  { name: 'Novotel Hyderabad Airport',       city: 'Hyderabad', country: 'India', address: 'Near Rajiv Gandhi Airport',         starRating: 4, pricePerNight: 7500,  roomType: 'Standard', amenities: 'WiFi,Pool,Gym,Restaurant',                      rating: 4.2, reviewCount: 3100,  availableRooms: 40 },

  // ── BENGALURU ─────────────────────────────────────────────────
  { name: 'The Leela Palace Bengaluru',      city: 'Bengaluru', country: 'India', address: 'Old Airport Road, Bengaluru',       starRating: 5, pricePerNight: 22000, roomType: 'Suite',    amenities: 'WiFi,Pool,Spa,Gym,Restaurant,Bar',              rating: 4.8, reviewCount: 2200,  availableRooms: 15 },
  { name: 'Marriott Bengaluru Whitefield',   city: 'Bengaluru', country: 'India', address: 'Whitefield, Bengaluru',             starRating: 5, pricePerNight: 12000, roomType: 'Standard', amenities: 'WiFi,Pool,Gym,Restaurant,Bar',                  rating: 4.5, reviewCount: 3400,  availableRooms: 30 },
  { name: 'Ibis Bengaluru City Centre',      city: 'Bengaluru', country: 'India', address: 'Hosur Road, Bengaluru',             starRating: 3, pricePerNight: 3800,  roomType: 'Standard', amenities: 'WiFi,Restaurant,Gym',                           rating: 4.1, reviewCount: 4200,  availableRooms: 55 },

  // ── UDAIPUR ───────────────────────────────────────────────────
  { name: 'Taj Lake Palace',                 city: 'Udaipur',   country: 'India', address: 'Lake Pichola, Udaipur',             starRating: 5, pricePerNight: 55000, roomType: 'Suite',    amenities: 'WiFi,Lake View,Pool,Spa,Heritage,Fine Dining',  rating: 4.9, reviewCount: 3200,  availableRooms: 6  },
  { name: 'The Oberoi Udaivilas',            city: 'Udaipur',   country: 'India', address: 'Haridasji Ki Magri, Udaipur',       starRating: 5, pricePerNight: 68000, roomType: 'Suite',    amenities: 'WiFi,Private Pool,Spa,Lake View,Butler',        rating: 5.0, reviewCount: 2100,  availableRooms: 4  },
  { name: 'Trident Udaipur',                 city: 'Udaipur',   country: 'India', address: 'Lake Pichola, Udaipur',             starRating: 5, pricePerNight: 18000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Lake View,Restaurant',            rating: 4.7, reviewCount: 2800,  availableRooms: 15 },
  { name: 'Hotel Mahendra Prakash',          city: 'Udaipur',   country: 'India', address: 'Outside Chand Pol, Udaipur',        starRating: 3, pricePerNight: 3500,  roomType: 'Standard', amenities: 'WiFi,Restaurant,AC',                            rating: 4.2, reviewCount: 1100,  availableRooms: 25 },

  // ── VARANASI ──────────────────────────────────────────────────
  { name: 'Taj Nadesar Palace',              city: 'Varanasi',  country: 'India', address: 'Nadesar, Varanasi',                 starRating: 5, pricePerNight: 28000, roomType: 'Suite',    amenities: 'WiFi,Heritage Garden,Pool,Spa,Fine Dining',     rating: 4.9, reviewCount: 980,   availableRooms: 8  },
  { name: 'BrijRama Palace Hotel',           city: 'Varanasi',  country: 'India', address: 'Darbhanga Ghat, Varanasi',          starRating: 5, pricePerNight: 22000, roomType: 'Heritage', amenities: 'WiFi,Ganga View,Heritage,Restaurant,Ghat',      rating: 4.8, reviewCount: 1400,  availableRooms: 10 },
  { name: 'Ramada Varanasi',                 city: 'Varanasi',  country: 'India', address: 'The Mall, Varanasi',                starRating: 4, pricePerNight: 6500,  roomType: 'Standard', amenities: 'WiFi,Pool,Restaurant,Gym',                      rating: 4.2, reviewCount: 1800,  availableRooms: 28 },
  { name: 'Ganga Fuji Home',                 city: 'Varanasi',  country: 'India', address: 'B3/236 Manikarnika Ghat',           starRating: 2, pricePerNight: 1800,  roomType: 'Standard', amenities: 'WiFi,Ganga View,Rooftop',                       rating: 4.3, reviewCount: 950,   availableRooms: 15 },

  // ── AGRA ──────────────────────────────────────────────────────
  { name: 'The Oberoi Amarvilas',            city: 'Agra',      country: 'India', address: 'Taj East Gate Road, Agra',          starRating: 5, pricePerNight: 65000, roomType: 'Suite',    amenities: 'WiFi,Taj Mahal View,Pool,Spa,Butler,Fine Dining',rating: 5.0, reviewCount: 3800,  availableRooms: 4  },
  { name: 'ITC Mughal Agra',                 city: 'Agra',      country: 'India', address: 'Fatehabad Road, Agra',              starRating: 5, pricePerNight: 22000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Gym,Mughal Garden,Restaurant',    rating: 4.7, reviewCount: 2600,  availableRooms: 15 },
  { name: 'Crystal Sarovar Premiere',        city: 'Agra',      country: 'India', address: 'Fatehabad Road, Agra',              starRating: 4, pricePerNight: 7500,  roomType: 'Standard', amenities: 'WiFi,Pool,Restaurant,Gym',                      rating: 4.3, reviewCount: 2100,  availableRooms: 30 },
  { name: 'Hotel Sheela Inn',                city: 'Agra',      country: 'India', address: 'Near Taj Mahal East Gate',          starRating: 2, pricePerNight: 1500,  roomType: 'Standard', amenities: 'WiFi,AC,Rooftop Taj View',                      rating: 4.0, reviewCount: 1600,  availableRooms: 22 },

  // ── SHIMLA ────────────────────────────────────────────────────
  { name: 'Wildflower Hall',                 city: 'Shimla',    country: 'India', address: 'Mashobra, Near Shimla',             starRating: 5, pricePerNight: 38000, roomType: 'Suite',    amenities: 'WiFi,Pool,Spa,Himalayan View,Restaurant',       rating: 4.9, reviewCount: 1500,  availableRooms: 8  },
  { name: 'Oberoi Cecil Shimla',             city: 'Shimla',    country: 'India', address: 'Chaura Maidan, Shimla',             starRating: 5, pricePerNight: 22000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Heritage,Restaurant',             rating: 4.8, reviewCount: 2100,  availableRooms: 12 },
  { name: 'Hotel Combermere',                city: 'Shimla',    country: 'India', address: 'The Mall, Shimla',                  starRating: 3, pricePerNight: 4500,  roomType: 'Standard', amenities: 'WiFi,Mall View,Restaurant,AC',                  rating: 4.2, reviewCount: 1800,  availableRooms: 20 },
  { name: 'The Terrace Shimla',              city: 'Shimla',    country: 'India', address: 'Lakkar Bazaar, Shimla',             starRating: 2, pricePerNight: 2000,  roomType: 'Standard', amenities: 'WiFi,Valley View',                              rating: 4.0, reviewCount: 900,   availableRooms: 25 },

  // ── LEH / LADAKH ─────────────────────────────────────────────
  { name: 'The Grand Dragon Ladakh',         city: 'Leh',       country: 'India', address: 'Old Leh Road, Ladakh',              starRating: 5, pricePerNight: 18000, roomType: 'Deluxe',   amenities: 'WiFi,Mountain View,Spa,Restaurant,Yoga',        rating: 4.8, reviewCount: 1200,  availableRooms: 12 },
  { name: 'Nimmu House',                     city: 'Leh',       country: 'India', address: 'Nimmu Village, Ladakh',             starRating: 4, pricePerNight: 9500,  roomType: 'Suite',    amenities: 'WiFi,Organic Garden,Indus View,Restaurant',    rating: 4.7, reviewCount: 680,   availableRooms: 8  },
  { name: 'Hotel Spic N Span',               city: 'Leh',       country: 'India', address: 'Changspa Road, Leh',                starRating: 3, pricePerNight: 3500,  roomType: 'Standard', amenities: 'WiFi,Rooftop,Mountain View,Restaurant',         rating: 4.4, reviewCount: 1100,  availableRooms: 18 },
  { name: 'Zostel Leh',                      city: 'Leh',       country: 'India', address: 'Old Town Area, Leh',                starRating: 2, pricePerNight: 1200,  roomType: 'Standard', amenities: 'WiFi,Common Room,Mountain View',                rating: 4.3, reviewCount: 1800,  availableRooms: 35 },

  // ── RISHIKESH ─────────────────────────────────────────────────
  { name: 'Ananda in the Himalayas',         city: 'Rishikesh', country: 'India', address: 'The Palace Estate, Narendra Nagar', starRating: 5, pricePerNight: 45000, roomType: 'Suite',    amenities: 'WiFi,Ayurveda,Spa,Yoga,Himalayan View',         rating: 4.9, reviewCount: 1800,  availableRooms: 8  },
  { name: 'Aloha on the Ganges',             city: 'Rishikesh', country: 'India', address: 'Swargashram, Rishikesh',            starRating: 4, pricePerNight: 8500,  roomType: 'Deluxe',   amenities: 'WiFi,Ganga View,Yoga,Restaurant,Pool',          rating: 4.5, reviewCount: 1200,  availableRooms: 18 },
  { name: 'Zostel Rishikesh',                city: 'Rishikesh', country: 'India', address: 'Ram Jhula, Rishikesh',              starRating: 2, pricePerNight: 900,   roomType: 'Standard', amenities: 'WiFi,Ganga View,Common Room',                   rating: 4.4, reviewCount: 2400,  availableRooms: 40 },

  // ── ANDAMAN ───────────────────────────────────────────────────
  { name: 'Fortune Resort Bay Island',       city: 'Andaman',   country: 'India', address: 'Marine Hill, Port Blair',           starRating: 4, pricePerNight: 12000, roomType: 'Deluxe',   amenities: 'WiFi,Sea View,Pool,Restaurant,Gym',             rating: 4.5, reviewCount: 1400,  availableRooms: 20 },
  { name: 'Munjoh Ocean Resort',             city: 'Andaman',   country: 'India', address: 'Havelock Island, Andaman',          starRating: 5, pricePerNight: 22000, roomType: 'Villa',    amenities: 'WiFi,Beach,Pool,Spa,Sea View,Restaurant',       rating: 4.8, reviewCount: 980,   availableRooms: 10 },
  { name: 'Wild Orchid Havelock',            city: 'Andaman',   country: 'India', address: 'Beach No. 5, Havelock Island',      starRating: 4, pricePerNight: 8500,  roomType: 'Deluxe',   amenities: 'WiFi,Beach,Restaurant,Snorkeling',              rating: 4.4, reviewCount: 1100,  availableRooms: 15 },

  // ══════════════════════════════════════════════════════════════
  // MIDDLE EAST
  // ══════════════════════════════════════════════════════════════

  // ── DUBAI ─────────────────────────────────────────────────────
  { name: 'Burj Al Arab Jumeirah',           city: 'Dubai',     country: 'UAE',         address: 'Jumeirah Beach Road, Dubai',      starRating: 7, pricePerNight: 280000,roomType: 'Suite',    amenities: 'WiFi,Butler,Private Beach,All Dining,Spa,Rolls Royce',rating: 4.9, reviewCount: 8200,  availableRooms: 4  },
  { name: 'Atlantis The Palm',               city: 'Dubai',     country: 'UAE',         address: 'Palm Jumeirah, Dubai',             starRating: 5, pricePerNight: 55000, roomType: 'Deluxe',   amenities: 'WiFi,Water Park,Beach,Pool,Spa,Gym,Restaurant',        rating: 4.7, reviewCount: 12000, availableRooms: 20 },
  { name: 'JW Marriott Marquis Dubai',       city: 'Dubai',     country: 'UAE',         address: 'Sheikh Zayed Road, Dubai',         starRating: 5, pricePerNight: 42000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Gym,Bar,Restaurant',                     rating: 4.6, reviewCount: 9400,  availableRooms: 25 },
  { name: 'Sofitel Dubai The Palm',          city: 'Dubai',     country: 'UAE',         address: 'Palm Jumeirah, Dubai',             starRating: 5, pricePerNight: 38000, roomType: 'Suite',    amenities: 'WiFi,Private Beach,Pool,Spa,Gym,Restaurant,Bar',       rating: 4.7, reviewCount: 7200,  availableRooms: 18 },
  { name: 'Premier Inn Dubai Airport',       city: 'Dubai',     country: 'UAE',         address: 'Near Airport Terminal 3',          starRating: 3, pricePerNight: 9500,  roomType: 'Standard', amenities: 'WiFi,Restaurant,Gym,Free Shuttle',                     rating: 4.1, reviewCount: 5100,  availableRooms: 50 },
  { name: 'Rove Downtown Dubai',             city: 'Dubai',     country: 'UAE',         address: 'Sheikh Mohammed Bin Rashid Blvd',  starRating: 3, pricePerNight: 8200,  roomType: 'Standard', amenities: 'WiFi,Pool,Gym,Restaurant,Burj Khalifa View',           rating: 4.3, reviewCount: 6800,  availableRooms: 40 },
  { name: 'XVA Art Hotel',                   city: 'Dubai',     country: 'UAE',         address: 'Al Fahidi Historic District',      starRating: 3, pricePerNight: 7500,  roomType: 'Standard', amenities: 'WiFi,Art Gallery,Cafe,Old Dubai View',                 rating: 4.5, reviewCount: 2100,  availableRooms: 12 },

  // ── ABU DHABI ─────────────────────────────────────────────────
  { name: 'Emirates Palace Mandarin',        city: 'Abu Dhabi', country: 'UAE',         address: 'West Corniche Road, Abu Dhabi',    starRating: 5, pricePerNight: 95000, roomType: 'Suite',    amenities: 'WiFi,Private Beach,Pool,Spa,Fine Dining,Butler',       rating: 4.9, reviewCount: 6200,  availableRooms: 6  },
  { name: 'Yas Island Rotana',               city: 'Abu Dhabi', country: 'UAE',         address: 'Yas Island, Abu Dhabi',            starRating: 5, pricePerNight: 28000, roomType: 'Deluxe',   amenities: 'WiFi,Beach,Pool,Spa,F1 Circuit View,Restaurant',       rating: 4.6, reviewCount: 4200,  availableRooms: 22 },
  { name: 'Citymax Hotel Abu Dhabi',         city: 'Abu Dhabi', country: 'UAE',         address: 'Al Wahda Mall Area, Abu Dhabi',    starRating: 3, pricePerNight: 8500,  roomType: 'Standard', amenities: 'WiFi,Pool,Restaurant,Gym',                             rating: 4.1, reviewCount: 3100,  availableRooms: 45 },

  // ── DOHA ──────────────────────────────────────────────────────
  { name: 'Mandarin Oriental Doha',          city: 'Doha',      country: 'Qatar',       address: 'Msheireb Downtown Doha',           starRating: 5, pricePerNight: 55000, roomType: 'Suite',    amenities: 'WiFi,Pool,Spa,Fine Dining,City View',                  rating: 4.8, reviewCount: 3200,  availableRooms: 10 },
  { name: 'W Doha Hotel',                    city: 'Doha',      country: 'Qatar',       address: 'West Bay, Doha',                   starRating: 5, pricePerNight: 38000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Gym,Restaurant,Bar',                     rating: 4.6, reviewCount: 4100,  availableRooms: 18 },
  { name: 'ibis Doha',                       city: 'Doha',      country: 'Qatar',       address: 'C-Ring Road, Doha',                starRating: 3, pricePerNight: 9800,  roomType: 'Standard', amenities: 'WiFi,Restaurant,Gym',                                  rating: 4.0, reviewCount: 2800,  availableRooms: 40 },

  // ══════════════════════════════════════════════════════════════
  // SOUTHEAST ASIA
  // ══════════════════════════════════════════════════════════════

  // ── BANGKOK ───────────────────────────────────────────────────
  { name: 'Mandarin Oriental Bangkok',       city: 'Bangkok',   country: 'Thailand',    address: '48 Oriental Avenue, Bangkok',      starRating: 5, pricePerNight: 42000, roomType: 'Suite',    amenities: 'WiFi,River View,Pool,Spa,Gym,Fine Dining,Bar',         rating: 4.9, reviewCount: 11000, availableRooms: 8  },
  { name: 'The Peninsula Bangkok',           city: 'Bangkok',   country: 'Thailand',    address: '333 Charoennakorn Road',            starRating: 5, pricePerNight: 35000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Gym,River View,Restaurant',              rating: 4.8, reviewCount: 8200,  availableRooms: 12 },
  { name: 'Chatrium Hotel Riverside',        city: 'Bangkok',   country: 'Thailand',    address: '28 Charoenkrung 70, Bangkok',       starRating: 5, pricePerNight: 18000, roomType: 'Suite',    amenities: 'WiFi,River View,Pool,Gym,Restaurant',                  rating: 4.6, reviewCount: 5400,  availableRooms: 20 },
  { name: 'Novotel Bangkok Suvarnabhumi',    city: 'Bangkok',   country: 'Thailand',    address: 'Near Airport, Bangkok',             starRating: 4, pricePerNight: 8500,  roomType: 'Standard', amenities: 'WiFi,Pool,Gym,Restaurant,Airport Access',              rating: 4.3, reviewCount: 7200,  availableRooms: 35 },
  { name: 'Lub d Bangkok Silom',             city: 'Bangkok',   country: 'Thailand',    address: '4 Silom Road, Bangkok',             starRating: 2, pricePerNight: 2200,  roomType: 'Standard', amenities: 'WiFi,Rooftop,Social Space',                            rating: 4.2, reviewCount: 4100,  availableRooms: 45 },

  // ── PHUKET ────────────────────────────────────────────────────
  { name: 'Amanpuri Phuket',                 city: 'Phuket',    country: 'Thailand',    address: 'Pansea Beach, Phuket',              starRating: 5, pricePerNight: 95000, roomType: 'Villa',    amenities: 'WiFi,Private Beach,Pool,Spa,Butler,Fine Dining',        rating: 4.9, reviewCount: 2800,  availableRooms: 6  },
  { name: 'JW Marriott Khao Lak',            city: 'Phuket',    country: 'Thailand',    address: 'Khao Lak, Phang Nga',               starRating: 5, pricePerNight: 32000, roomType: 'Deluxe',   amenities: 'WiFi,Private Beach,Pool,Spa,Gym,Restaurant',            rating: 4.7, reviewCount: 4200,  availableRooms: 15 },
  { name: 'Baan Talay Resort Phuket',        city: 'Phuket',    country: 'Thailand',    address: 'Karon Beach, Phuket',               starRating: 3, pricePerNight: 5500,  roomType: 'Standard', amenities: 'WiFi,Pool,Beach,Restaurant',                            rating: 4.1, reviewCount: 2600,  availableRooms: 28 },

  // ── BALI ──────────────────────────────────────────────────────
  { name: 'Four Seasons Resort Bali',        city: 'Bali',      country: 'Indonesia',   address: 'Sayan, Ubud, Bali',                 starRating: 5, pricePerNight: 65000, roomType: 'Villa',    amenities: 'WiFi,Private Pool,Jungle View,Spa,Restaurant,Butler',  rating: 4.9, reviewCount: 6200,  availableRooms: 6  },
  { name: 'COMO Uma Ubud',                   city: 'Bali',      country: 'Indonesia',   address: 'Sanggingan, Ubud, Bali',            starRating: 5, pricePerNight: 45000, roomType: 'Suite',    amenities: 'WiFi,Pool,Spa,Yoga,Restaurant',                        rating: 4.8, reviewCount: 3400,  availableRooms: 10 },
  { name: 'Seminyak Beach Resort',           city: 'Bali',      country: 'Indonesia',   address: 'Seminyak Beach, Kuta',              starRating: 4, pricePerNight: 15000, roomType: 'Deluxe',   amenities: 'WiFi,Beach,Pool,Spa,Restaurant',                       rating: 4.5, reviewCount: 4800,  availableRooms: 22 },
  { name: 'The Layar Private Villas',        city: 'Bali',      country: 'Indonesia',   address: 'Jl Drupadi, Seminyak',              starRating: 5, pricePerNight: 38000, roomType: 'Villa',    amenities: 'WiFi,Private Pool,Butler,Restaurant,Spa',              rating: 4.8, reviewCount: 2100,  availableRooms: 8  },
  { name: 'Kuta Paradiso Hotel',             city: 'Bali',      country: 'Indonesia',   address: 'Kartika Plaza, Kuta',               starRating: 3, pricePerNight: 5500,  roomType: 'Standard', amenities: 'WiFi,Pool,Restaurant,Beach Access',                    rating: 3.9, reviewCount: 3200,  availableRooms: 35 },
  { name: 'Ubud Village Resort & Spa',       city: 'Bali',      country: 'Indonesia',   address: 'Jalan Monkey Forest, Ubud',         starRating: 4, pricePerNight: 9500,  roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Jungle View,Restaurant',                 rating: 4.4, reviewCount: 1800,  availableRooms: 20 },

  // ── SINGAPORE ─────────────────────────────────────────────────
  { name: 'Marina Bay Sands',                city: 'Singapore', country: 'Singapore',   address: '10 Bayfront Avenue',                starRating: 5, pricePerNight: 55000, roomType: 'Deluxe',   amenities: 'WiFi,Infinity Pool,Casino,Shops,Spa,Gym',              rating: 4.7, reviewCount: 28000, availableRooms: 20 },
  { name: 'Capella Singapore',               city: 'Singapore', country: 'Singapore',   address: 'Sentosa Island',                    starRating: 5, pricePerNight: 72000, roomType: 'Suite',    amenities: 'WiFi,Pool,Spa,Butler,Beach,Fine Dining',               rating: 4.9, reviewCount: 4200,  availableRooms: 8  },
  { name: 'The Fullerton Hotel',             city: 'Singapore', country: 'Singapore',   address: '1 Fullerton Square',                starRating: 5, pricePerNight: 38000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Gym,Restaurant,Bar',                     rating: 4.8, reviewCount: 8100,  availableRooms: 15 },
  { name: 'Hotel Jen Orchardgateway',        city: 'Singapore', country: 'Singapore',   address: '277 Orchard Road',                  starRating: 4, pricePerNight: 18500, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Gym,Restaurant,Orchard View',                rating: 4.4, reviewCount: 5200,  availableRooms: 28 },
  { name: 'ibis Singapore on Bencoolen',     city: 'Singapore', country: 'Singapore',   address: '170 Bencoolen Street',              starRating: 3, pricePerNight: 10500, roomType: 'Standard', amenities: 'WiFi,Restaurant,Gym',                                  rating: 4.0, reviewCount: 9200,  availableRooms: 45 },

  // ── KUALA LUMPUR ──────────────────────────────────────────────
  { name: 'Mandarin Oriental Kuala Lumpur',  city: 'Kuala Lumpur',country:'Malaysia',   address: 'KLCC, Kuala Lumpur',                starRating: 5, pricePerNight: 28000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Gym,KLCC View,Fine Dining',              rating: 4.8, reviewCount: 7200,  availableRooms: 12 },
  { name: 'Traders Hotel Kuala Lumpur',      city: 'Kuala Lumpur',country:'Malaysia',   address: 'KLCC, Kuala Lumpur',                starRating: 5, pricePerNight: 18000, roomType: 'Standard', amenities: 'WiFi,Pool,Gym,Petronas Tower View,Restaurant',         rating: 4.6, reviewCount: 9400,  availableRooms: 22 },
  { name: 'Hotel Malaysia',                  city: 'Kuala Lumpur',country:'Malaysia',   address: 'Jalan Bukit Bintang, KL',           starRating: 3, pricePerNight: 5500,  roomType: 'Standard', amenities: 'WiFi,Restaurant,AC',                                   rating: 3.9, reviewCount: 3200,  availableRooms: 40 },

  // ── MALE (MALDIVES) ───────────────────────────────────────────
  { name: 'Soneva Jani Maldives',            city: 'Male',      country: 'Maldives',    address: 'Noonu Atoll, Maldives',             starRating: 5, pricePerNight: 185000,roomType: 'Villa',    amenities: 'WiFi,Overwater Villa,Pool,Spa,Diving,Butler,Fine Dining',rating:5.0, reviewCount: 2100,  availableRooms: 4  },
  { name: 'Velaa Private Island',            city: 'Male',      country: 'Maldives',    address: 'Noonu Atoll, Maldives',             starRating: 5, pricePerNight: 145000,roomType: 'Villa',    amenities: 'WiFi,Overwater Pool,Spa,Diving,Private Chef',          rating: 4.9, reviewCount: 1400,  availableRooms: 4  },
  { name: 'Centara Grand Island Maldives',   city: 'Male',      country: 'Maldives',    address: 'South Ari Atoll, Maldives',         starRating: 5, pricePerNight: 65000, roomType: 'Suite',    amenities: 'WiFi,Beach,Pool,Spa,Diving,All Inclusive',             rating: 4.7, reviewCount: 3800,  availableRooms: 10 },
  { name: 'Kurumba Maldives',                city: 'Male',      country: 'Maldives',    address: 'North Male Atoll, Maldives',        starRating: 5, pricePerNight: 42000, roomType: 'Deluxe',   amenities: 'WiFi,Beach,Pool,Spa,Diving,Restaurant',                rating: 4.6, reviewCount: 5100,  availableRooms: 15 },

  // ══════════════════════════════════════════════════════════════
  // EUROPE
  // ══════════════════════════════════════════════════════════════

  // ── PARIS ─────────────────────────────────────────────────────
  { name: 'The Ritz Paris',                  city: 'Paris',     country: 'France',      address: '15 Place Vendôme, Paris',           starRating: 5, pricePerNight: 185000,roomType: 'Suite',    amenities: 'WiFi,Spa,Fine Dining,Bar,Butler,Concierge',            rating: 4.9, reviewCount: 5200,  availableRooms: 4  },
  { name: 'Four Seasons George V Paris',     city: 'Paris',     country: 'France',      address: '31 Avenue George V',                starRating: 5, pricePerNight: 145000,roomType: 'Deluxe',   amenities: 'WiFi,Spa,Pool,Fine Dining,Bar,Butler',                 rating: 4.9, reviewCount: 6800,  availableRooms: 6  },
  { name: 'Le Marais Boutique Hotel',        city: 'Paris',     country: 'France',      address: '29 Rue de Bretagne, Marais',         starRating: 4, pricePerNight: 22000, roomType: 'Deluxe',   amenities: 'WiFi,Bar,Breakfast',                                   rating: 4.5, reviewCount: 2100,  availableRooms: 18 },
  { name: 'Hotel du Louvre',                 city: 'Paris',     country: 'France',      address: 'Place André Malraux',               starRating: 4, pricePerNight: 18000, roomType: 'Standard', amenities: 'WiFi,Bar,Louvre View,Restaurant',                      rating: 4.4, reviewCount: 3400,  availableRooms: 25 },
  { name: 'Generator Paris Hostel',          city: 'Paris',     country: 'France',      address: '9-11 Place du Colonel Fabien',       starRating: 2, pricePerNight: 3500,  roomType: 'Standard', amenities: 'WiFi,Bar,Social Space,Terrace',                        rating: 4.1, reviewCount: 5800,  availableRooms: 40 },

  // ── LONDON ────────────────────────────────────────────────────
  { name: 'The Savoy',                       city: 'London',    country: 'UK',          address: 'Strand, London WC2R 0EU',           starRating: 5, pricePerNight: 145000,roomType: 'Suite',    amenities: 'WiFi,Thames View,Spa,Pool,Fine Dining,Bar,Butler',     rating: 4.9, reviewCount: 8200,  availableRooms: 6  },
  { name: 'Claridges',                       city: 'London',    country: 'UK',          address: 'Brook Street, Mayfair',             starRating: 5, pricePerNight: 135000,roomType: 'Suite',    amenities: 'WiFi,Spa,Fine Dining,Art Deco,Butler',                 rating: 4.9, reviewCount: 6400,  availableRooms: 6  },
  { name: 'The Langham London',              city: 'London',    country: 'UK',          address: 'Portland Place, London',            starRating: 5, pricePerNight: 55000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Gym,Fine Dining,Bar',                    rating: 4.8, reviewCount: 4100,  availableRooms: 15 },
  { name: 'Strand Palace Hotel',             city: 'London',    country: 'UK',          address: '372 Strand, London',                starRating: 3, pricePerNight: 16000, roomType: 'Standard', amenities: 'WiFi,Bar,Restaurant,Central Location',                 rating: 4.1, reviewCount: 12000, availableRooms: 40 },
  { name: "St Christopher's Inn",            city: 'London',    country: 'UK',          address: 'Borough High St, London',           starRating: 2, pricePerNight: 5500,  roomType: 'Standard', amenities: 'WiFi,Common Room,Bar',                                 rating: 3.9, reviewCount: 4200,  availableRooms: 35 },

  // ── AMSTERDAM ─────────────────────────────────────────────────
  { name: 'The Dylan Amsterdam',             city: 'Amsterdam', country: 'Netherlands', address: 'Keizersgracht 384',                  starRating: 5, pricePerNight: 38000, roomType: 'Suite',    amenities: 'WiFi,Canal View,Spa,Fine Dining',                      rating: 4.7, reviewCount: 2200,  availableRooms: 10 },
  { name: 'NH Amsterdam Grand Hotel',        city: 'Amsterdam', country: 'Netherlands', address: 'Oudezijds Voorburgwal 197',          starRating: 4, pricePerNight: 18000, roomType: 'Deluxe',   amenities: 'WiFi,Canal View,Restaurant,Bar',                       rating: 4.5, reviewCount: 4800,  availableRooms: 20 },
  { name: 'Stayokay Amsterdam Vondelpark',   city: 'Amsterdam', country: 'Netherlands', address: 'Zandpad 5, Vondelpark',              starRating: 2, pricePerNight: 4500,  roomType: 'Standard', amenities: 'WiFi,Bar,Bike Rental,Common Room',                     rating: 4.2, reviewCount: 6200,  availableRooms: 50 },

  // ── BARCELONA ─────────────────────────────────────────────────
  { name: 'Hotel Arts Barcelona',            city: 'Barcelona', country: 'Spain',       address: 'Carrer de la Marina 19-21',          starRating: 5, pricePerNight: 55000, roomType: 'Suite',    amenities: 'WiFi,Beach,Pool,Spa,Gym,Sea View,Fine Dining',         rating: 4.8, reviewCount: 6200,  availableRooms: 8  },
  { name: 'Hotel Casa Camper Barcelona',     city: 'Barcelona', country: 'Spain',       address: 'C/ Elisabets 11',                    starRating: 4, pricePerNight: 18000, roomType: 'Standard', amenities: 'WiFi,Rooftop,Gym,Restaurant',                          rating: 4.5, reviewCount: 3100,  availableRooms: 22 },
  { name: 'Be Good Hostel Barceloneta',      city: 'Barcelona', country: 'Spain',       address: 'Barceloneta Beach, Barcelona',        starRating: 2, pricePerNight: 3200,  roomType: 'Standard', amenities: 'WiFi,Beach,Bar,Common Room',                           rating: 4.1, reviewCount: 3800,  availableRooms: 45 },

  // ── ROME ──────────────────────────────────────────────────────
  { name: 'Hotel Hassler Roma',              city: 'Rome',      country: 'Italy',       address: 'Trinità dei Monti 6',                starRating: 5, pricePerNight: 55000, roomType: 'Suite',    amenities: 'WiFi,Spanish Steps View,Spa,Fine Dining,Bar',          rating: 4.8, reviewCount: 3800,  availableRooms: 8  },
  { name: 'JK Roma',                         city: 'Rome',      country: 'Italy',       address: 'Via Monti Parioli 20',               starRating: 5, pricePerNight: 38000, roomType: 'Deluxe',   amenities: 'WiFi,Rooftop Pool,Spa,Fine Dining',                    rating: 4.7, reviewCount: 2400,  availableRooms: 12 },
  { name: 'Hotel Artemide Rome',             city: 'Rome',      country: 'Italy',       address: 'Via Nazionale 22',                   starRating: 4, pricePerNight: 15000, roomType: 'Standard', amenities: 'WiFi,Restaurant,Gym,Central Location',                 rating: 4.4, reviewCount: 5200,  availableRooms: 28 },
  { name: 'Yellow Hostel Rome',              city: 'Rome',      country: 'Italy',       address: 'Via Palestro 44',                    starRating: 2, pricePerNight: 2800,  roomType: 'Standard', amenities: 'WiFi,Bar,Terrace,Common Room',                         rating: 4.3, reviewCount: 7400,  availableRooms: 55 },

  // ── PRAGUE ────────────────────────────────────────────────────
  { name: 'Four Seasons Prague',             city: 'Prague',    country: 'Czech Republic',address:'Veleslavinova 2a, Prague',          starRating: 5, pricePerNight: 42000, roomType: 'Suite',    amenities: 'WiFi,Vltava View,Pool,Spa,Fine Dining',                rating: 4.8, reviewCount: 3400,  availableRooms: 8  },
  { name: 'Hotel Pariz Prague',              city: 'Prague',    country: 'Czech Republic',address:'U Obecního domu 1, Prague',          starRating: 5, pricePerNight: 18000, roomType: 'Deluxe',   amenities: 'WiFi,Art Nouveau,Restaurant,Bar',                      rating: 4.6, reviewCount: 2800,  availableRooms: 15 },
  { name: 'Mosaic House Design Hotel',       city: 'Prague',    country: 'Czech Republic',address:'Odboru 4, Prague 2',                 starRating: 3, pricePerNight: 5500,  roomType: 'Standard', amenities: 'WiFi,Bar,Common Room,Design',                          rating: 4.3, reviewCount: 4200,  availableRooms: 35 },

  // ══════════════════════════════════════════════════════════════
  // EAST ASIA
  // ══════════════════════════════════════════════════════════════

  // ── TOKYO ─────────────────────────────────────────────────────
  { name: 'The Peninsula Tokyo',             city: 'Tokyo',     country: 'Japan',       address: '1-8-1 Yurakucho, Chiyoda',          starRating: 5, pricePerNight: 95000, roomType: 'Deluxe',   amenities: 'WiFi,Spa,Pool,Gym,Fine Dining,Imperial Palace View',  rating: 4.9, reviewCount: 7200,  availableRooms: 8  },
  { name: 'Park Hyatt Tokyo',                city: 'Tokyo',     country: 'Japan',       address: 'Shinjuku Park Tower, Tokyo',         starRating: 5, pricePerNight: 75000, roomType: 'Deluxe',   amenities: 'WiFi,City View,Pool,Spa,Gym,Fine Dining',             rating: 4.8, reviewCount: 5800,  availableRooms: 10 },
  { name: 'Shinjuku Granbell Hotel',         city: 'Tokyo',     country: 'Japan',       address: '2-14-5 Kabukicho, Shinjuku',         starRating: 4, pricePerNight: 22000, roomType: 'Standard', amenities: 'WiFi,City View,Restaurant',                            rating: 4.4, reviewCount: 5400,  availableRooms: 25 },
  { name: 'Dormy Inn Asakusa',               city: 'Tokyo',     country: 'Japan',       address: 'Asakusa, Taito, Tokyo',              starRating: 3, pricePerNight: 9500,  roomType: 'Standard', amenities: 'WiFi,Hot Spring Bath,Restaurant',                      rating: 4.5, reviewCount: 6200,  availableRooms: 30 },
  { name: 'Khaosan Tokyo Origami',           city: 'Tokyo',     country: 'Japan',       address: '2-16-8 Asakusa, Taito',              starRating: 2, pricePerNight: 4500,  roomType: 'Standard', amenities: 'WiFi,Common Room,Lockers,Temple View',                 rating: 4.3, reviewCount: 3200,  availableRooms: 40 },

  // ── OSAKA ─────────────────────────────────────────────────────
  { name: 'Conrad Osaka',                    city: 'Osaka',     country: 'Japan',       address: 'Nakanoshima 3-2-4, Osaka',           starRating: 5, pricePerNight: 55000, roomType: 'Suite',    amenities: 'WiFi,City View,Pool,Spa,Gym,Fine Dining',             rating: 4.8, reviewCount: 4200,  availableRooms: 8  },
  { name: 'Cross Hotel Osaka',               city: 'Osaka',     country: 'Japan',       address: 'Shinsaibashi, Osaka',                starRating: 4, pricePerNight: 18000, roomType: 'Standard', amenities: 'WiFi,Restaurant,Bar,Central Osaka',                   rating: 4.5, reviewCount: 5100,  availableRooms: 22 },
  { name: 'Imabari Hotel Osaka',             city: 'Osaka',     country: 'Japan',       address: 'Dotonbori Area, Osaka',              starRating: 3, pricePerNight: 9000,  roomType: 'Standard', amenities: 'WiFi,Restaurant,Dotonbori View',                       rating: 4.3, reviewCount: 3800,  availableRooms: 30 },

  // ── KYOTO ─────────────────────────────────────────────────────
  { name: 'The Ritz-Carlton Kyoto',          city: 'Kyoto',     country: 'Japan',       address: 'Kamogawa, Nakagyo, Kyoto',           starRating: 5, pricePerNight: 85000, roomType: 'Suite',    amenities: 'WiFi,Kamo River View,Pool,Spa,Fine Dining,Concierge', rating: 4.9, reviewCount: 3200,  availableRooms: 6  },
  { name: 'Hotel Granvia Kyoto',             city: 'Kyoto',     country: 'Japan',       address: 'JR Kyoto Station',                   starRating: 4, pricePerNight: 22000, roomType: 'Deluxe',   amenities: 'WiFi,Restaurant,Gym,Station Access',                  rating: 4.5, reviewCount: 4800,  availableRooms: 20 },
  { name: 'Piece Hostel Sanjo',              city: 'Kyoto',     country: 'Japan',       address: 'Sanjo-dori, Nakagyo, Kyoto',         starRating: 2, pricePerNight: 3500,  roomType: 'Standard', amenities: 'WiFi,Common Room,Locker,Temple Walks',                rating: 4.5, reviewCount: 5200,  availableRooms: 45 },

  // ── SEOUL ─────────────────────────────────────────────────────
  { name: 'The Shilla Seoul',                city: 'Seoul',     country: 'South Korea', address: '249 Dongho-ro, Jung-gu, Seoul',      starRating: 5, pricePerNight: 48000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Gym,Fine Dining,City View',             rating: 4.8, reviewCount: 5200,  availableRooms: 12 },
  { name: 'Lotte Hotel Seoul',               city: 'Seoul',     country: 'South Korea', address: '30 Eulji-ro, Jung-gu, Seoul',         starRating: 5, pricePerNight: 38000, roomType: 'Standard', amenities: 'WiFi,Pool,Spa,Gym,Shopping Mall,Restaurant',          rating: 4.7, reviewCount: 8100,  availableRooms: 20 },
  { name: 'Ryse Autograph Collection',       city: 'Seoul',     country: 'South Korea', address: 'Hongdae, Mapo-gu, Seoul',            starRating: 5, pricePerNight: 28000, roomType: 'Deluxe',   amenities: 'WiFi,Rooftop Bar,Pool,Restaurant,Hongdae Area',       rating: 4.6, reviewCount: 3800,  availableRooms: 18 },
  { name: 'Travelodge Myeongdong',           city: 'Seoul',     country: 'South Korea', address: 'Myeongdong, Jung-gu, Seoul',          starRating: 3, pricePerNight: 9500,  roomType: 'Standard', amenities: 'WiFi,Restaurant,Shopping District',                    rating: 4.2, reviewCount: 6400,  availableRooms: 40 },
  { name: 'Hongdae Guesthouse',              city: 'Seoul',     country: 'South Korea', address: 'Hongik University, Mapo-gu',          starRating: 2, pricePerNight: 3200,  roomType: 'Standard', amenities: 'WiFi,Common Room,Nightlife Access',                    rating: 4.1, reviewCount: 2800,  availableRooms: 30 },

  // ══════════════════════════════════════════════════════════════
  // OCEANIA
  // ══════════════════════════════════════════════════════════════

  // ── SYDNEY ────────────────────────────────────────────────────
  { name: 'Park Hyatt Sydney',               city: 'Sydney',    country: 'Australia',   address: '7 Hickson Road, The Rocks',          starRating: 5, pricePerNight: 85000, roomType: 'Suite',    amenities: 'WiFi,Opera House View,Pool,Spa,Gym,Fine Dining',      rating: 4.9, reviewCount: 5100,  availableRooms: 8  },
  { name: 'InterContinental Sydney',         city: 'Sydney',    country: 'Australia',   address: '117 Macquarie Street',              starRating: 5, pricePerNight: 55000, roomType: 'Deluxe',   amenities: 'WiFi,Harbour View,Pool,Spa,Gym,Restaurant',            rating: 4.7, reviewCount: 4200,  availableRooms: 15 },
  { name: 'ibis Sydney World Square',        city: 'Sydney',    country: 'Australia',   address: '382-384 Pitt Street',               starRating: 3, pricePerNight: 15000, roomType: 'Standard', amenities: 'WiFi,Restaurant,Central Location',                     rating: 4.0, reviewCount: 6800,  availableRooms: 45 },
  { name: 'Sydney Harbour YHA',              city: 'Sydney',    country: 'Australia',   address: 'Cumberland Street, The Rocks',       starRating: 2, pricePerNight: 5500,  roomType: 'Standard', amenities: 'WiFi,Harbour View,Common Room,Bar',                    rating: 4.3, reviewCount: 4100,  availableRooms: 55 },

  // ── MELBOURNE ─────────────────────────────────────────────────
  { name: 'Crown Towers Melbourne',          city: 'Melbourne', country: 'Australia',   address: '8 Whiteman St, Southbank',           starRating: 5, pricePerNight: 62000, roomType: 'Suite',    amenities: 'WiFi,Pool,Spa,Gym,Casino,Fine Dining',                rating: 4.8, reviewCount: 6200,  availableRooms: 10 },
  { name: 'The Adelphi Hotel',               city: 'Melbourne', country: 'Australia',   address: '187 Flinders Lane, Melbourne',        starRating: 4, pricePerNight: 22000, roomType: 'Deluxe',   amenities: 'WiFi,Rooftop Pool,Bar,Restaurant',                     rating: 4.5, reviewCount: 2800,  availableRooms: 18 },
  { name: 'Quest Melbourne',                 city: 'Melbourne', country: 'Australia',   address: 'Bourke Street, Melbourne',            starRating: 3, pricePerNight: 12000, roomType: 'Standard', amenities: 'WiFi,Kitchen,Gym,Central Location',                   rating: 4.2, reviewCount: 3400,  availableRooms: 35 },

  // ══════════════════════════════════════════════════════════════
  // AMERICAS
  // ══════════════════════════════════════════════════════════════

  // ── NEW YORK ──────────────────────────────────────────────────
  { name: 'The Plaza Hotel',                 city: 'New York',  country: 'USA',         address: '768 5th Ave, Central Park South',   starRating: 5, pricePerNight: 145000,roomType: 'Suite',    amenities: 'WiFi,Spa,Fine Dining,Bar,Central Park View,Butler',   rating: 4.8, reviewCount: 9200,  availableRooms: 6  },
  { name: 'Marriott Marquis Times Square',   city: 'New York',  country: 'USA',         address: '1535 Broadway, Times Square',        starRating: 4, pricePerNight: 45000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Gym,Restaurant,Bar,Times Sq View',           rating: 4.5, reviewCount: 21000, availableRooms: 30 },
  { name: 'Pod 51 Hotel',                    city: 'New York',  country: 'USA',         address: '230 East 51st Street',               starRating: 3, pricePerNight: 18000, roomType: 'Standard', amenities: 'WiFi,Gym,Rooftop Bar',                                 rating: 4.1, reviewCount: 8400,  availableRooms: 40 },
  { name: 'HI NYC Hostel',                   city: 'New York',  country: 'USA',         address: '891 Amsterdam Ave, Upper West Side', starRating: 2, pricePerNight: 8000,  roomType: 'Standard', amenities: 'WiFi,Common Room,Kitchen,Central Park Walks',          rating: 4.0, reviewCount: 5200,  availableRooms: 50 },

  // ── LAS VEGAS ─────────────────────────────────────────────────
  { name: 'Bellagio Hotel & Casino',         city: 'Las Vegas', country: 'USA',         address: '3600 S Las Vegas Blvd',             starRating: 5, pricePerNight: 55000, roomType: 'Deluxe',   amenities: 'WiFi,Casino,Fountain View,Pool,Spa,Fine Dining',       rating: 4.7, reviewCount: 42000, availableRooms: 30 },
  { name: 'The Venetian Resort',             city: 'Las Vegas', country: 'USA',         address: '3355 S Las Vegas Blvd',             starRating: 5, pricePerNight: 42000, roomType: 'Suite',    amenities: 'WiFi,Casino,Pool,Spa,Gondola Rides,Restaurant',        rating: 4.6, reviewCount: 38000, availableRooms: 35 },
  { name: 'Excalibur Hotel & Casino',        city: 'Las Vegas', country: 'USA',         address: '3850 S Las Vegas Blvd',             starRating: 3, pricePerNight: 9500,  roomType: 'Standard', amenities: 'WiFi,Casino,Pool,Restaurant,Entertainment',            rating: 3.9, reviewCount: 28000, availableRooms: 60 },

  // ── CANCUN ────────────────────────────────────────────────────
  { name: 'Nizuc Resort & Spa Cancun',       city: 'Cancun',    country: 'Mexico',      address: 'Punta Nizuc, Cancun',               starRating: 5, pricePerNight: 55000, roomType: 'Suite',    amenities: 'WiFi,Private Beach,Pool,Spa,All Inclusive,Butler',     rating: 4.8, reviewCount: 4200,  availableRooms: 10 },
  { name: 'Hard Rock Hotel Cancun',          city: 'Cancun',    country: 'Mexico',      address: 'Blvd Kukulcan KM 14.5',             starRating: 5, pricePerNight: 28000, roomType: 'Deluxe',   amenities: 'WiFi,Beach,Pool,Spa,All Inclusive,Live Music',         rating: 4.6, reviewCount: 8900,  availableRooms: 20 },
  { name: 'Hostel Mundo Joven Cancun',       city: 'Cancun',    country: 'Mexico',      address: 'Downtown Cancun',                   starRating: 2, pricePerNight: 3500,  roomType: 'Standard', amenities: 'WiFi,Bar,Pool,Common Room',                            rating: 4.0, reviewCount: 2800,  availableRooms: 40 },

  // ══════════════════════════════════════════════════════════════
  // SOUTH ASIA (Non-India)
  // ══════════════════════════════════════════════════════════════

  // ── KATHMANDU (NEPAL) ─────────────────────────────────────────
  { name: 'Hyatt Regency Kathmandu',         city: 'Kathmandu', country: 'Nepal',       address: 'Taragaon, Boudha, Kathmandu',        starRating: 5, pricePerNight: 18000, roomType: 'Deluxe',   amenities: 'WiFi,Pool,Spa,Gym,Himalayan View,Restaurant',          rating: 4.7, reviewCount: 2800,  availableRooms: 15 },
  { name: 'Hotel Yak & Yeti',                city: 'Kathmandu', country: 'Nepal',       address: 'Durbar Marg, Kathmandu',             starRating: 5, pricePerNight: 12000, roomType: 'Standard', amenities: 'WiFi,Pool,Spa,Restaurant,Casino',                      rating: 4.5, reviewCount: 3400,  availableRooms: 22 },
  { name: 'Thamel Eco Resort',               city: 'Kathmandu', country: 'Nepal',       address: 'Thamel, Kathmandu',                  starRating: 3, pricePerNight: 3500,  roomType: 'Standard', amenities: 'WiFi,Rooftop,Restaurant,Trekking Info',                rating: 4.3, reviewCount: 2100,  availableRooms: 30 },
  { name: 'Zostel Kathmandu',                city: 'Kathmandu', country: 'Nepal',       address: 'Thamel, Kathmandu',                  starRating: 2, pricePerNight: 1200,  roomType: 'Standard', amenities: 'WiFi,Common Room,Trekking Info',                       rating: 4.4, reviewCount: 1800,  availableRooms: 40 },

  // ── COLOMBO (SRI LANKA) ───────────────────────────────────────
  { name: 'Shangri-La Hotel Colombo',        city: 'Colombo',   country: 'Sri Lanka',   address: 'No.1 Galle Face, Colombo 02',        starRating: 5, pricePerNight: 28000, roomType: 'Deluxe',   amenities: 'WiFi,Ocean View,Pool,Spa,Gym,Fine Dining',             rating: 4.8, reviewCount: 3800,  availableRooms: 12 },
  { name: 'Cinnamon Grand Colombo',          city: 'Colombo',   country: 'Sri Lanka',   address: '77 Galle Rd, Colombo 03',            starRating: 5, pricePerNight: 18000, roomType: 'Standard', amenities: 'WiFi,Pool,Spa,Gym,Restaurant,Bar',                     rating: 4.6, reviewCount: 4200,  availableRooms: 20 },
  { name: 'Havelock Place Bungalow',         city: 'Colombo',   country: 'Sri Lanka',   address: 'Havelock Place, Colombo 05',          starRating: 3, pricePerNight: 5500,  roomType: 'Standard', amenities: 'WiFi,Garden,Restaurant,Heritage',                      rating: 4.4, reviewCount: 1200,  availableRooms: 12 },

  // ── CAIRO (EGYPT) ─────────────────────────────────────────────
  { name: 'Marriott Mena House Cairo',       city: 'Cairo',     country: 'Egypt',       address: '6 Pyramids Road, Giza',              starRating: 5, pricePerNight: 22000, roomType: 'Deluxe',   amenities: 'WiFi,Pyramid View,Pool,Spa,Gym,Fine Dining',           rating: 4.8, reviewCount: 5200,  availableRooms: 12 },
  { name: 'Fairmont Nile City Cairo',        city: 'Cairo',     country: 'Egypt',       address: 'Ramlet Beaulac, Nile Corniche',       starRating: 5, pricePerNight: 18000, roomType: 'Suite',    amenities: 'WiFi,Nile View,Pool,Spa,Gym,Restaurant',               rating: 4.7, reviewCount: 3800,  availableRooms: 15 },
  { name: 'Ibis Styles Cairo Downtown',      city: 'Cairo',     country: 'Egypt',       address: 'Talat Harb Square, Cairo',            starRating: 3, pricePerNight: 5500,  roomType: 'Standard', amenities: 'WiFi,Restaurant,AC',                                   rating: 4.0, reviewCount: 2400,  availableRooms: 35 },
];

// ─── Dynamic Pricing Engine ───────────────────────────────────────────────────
/**
 * Calculates a dynamic nightly rate based on:
 * 1. Check-in proximity (last-minute vs early booking)
 * 2. Weekend premium (Friday/Saturday nights)
 * 3. Peak season (October–January)
 * 4. Length-of-stay discount (more nights = cheaper per night)
 *
 * @param {number} basePrice    - Hotel's base price per night (INR)
 * @param {string} checkIn      - Check-in date (ISO string)
 * @param {string} checkOut     - Check-out date (ISO string)
 * @returns {object}            - { pricePerNight, totalPrice, nights }
 */
const applyDynamicPricing = (basePrice, checkIn, checkOut) => {
  const today    = new Date();
  const inDate   = checkIn  ? new Date(checkIn)  : new Date(today.getTime() + 7 * 86400000);
  const outDate  = checkOut ? new Date(checkOut) : new Date(inDate.getTime() + 2 * 86400000);

  const nights    = Math.max(1, Math.ceil((outDate - inDate) / 86400000));
  const daysAhead = Math.ceil((inDate - today)   / 86400000);

  let multiplier = 1.0;

  // Check-in proximity pricing (same as airlines)
  if      (daysAhead <= 1)   multiplier *= 1.9; // same-day / tomorrow
  else if (daysAhead <= 3)   multiplier *= 1.5;
  else if (daysAhead <= 7)   multiplier *= 1.25;
  else if (daysAhead <= 14)  multiplier *= 1.1;
  else if (daysAhead >= 90)  multiplier *= 0.85; // early-bird

  // Weekend check-in premium (Fri/Sat)
  const dayOfWeek = inDate.getDay();
  if (dayOfWeek === 5 || dayOfWeek === 6) multiplier *= 1.15;

  // Peak season (Oct–Jan) — popular travel months globally
  const month = inDate.getMonth() + 1; // 1–12
  if ([10, 11, 12, 1].includes(month)) multiplier *= 1.20;

  // Length-of-stay discount
  if      (nights >= 14) multiplier *= 0.75;
  else if (nights >= 7)  multiplier *= 0.85;
  else if (nights >= 3)  multiplier *= 0.92;

  const pricePerNight = Math.round((basePrice * multiplier) / 100) * 100;
  return { pricePerNight, totalPrice: pricePerNight * nights, nights, baseFare: basePrice };
};

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Seeds the Hotel table with our curated inventory.
 * Uses a version counter so new cities are added when SEED_VERSION is bumped.
 * Stores the version as a fake hotel record with name = 'SEED_VERSION_MARKER'.
 */
const ensureSeedData = async () => {
  // Check if the marker exists with the correct version
  const marker = await hotelRepository.findByName(`__SEED_V${SEED_VERSION}__`);
  if (marker) return; // already seeded with this version

  // Delete all existing hotels and re-seed
  await hotelRepository.deleteAll();

  // Insert all seed hotels
  await hotelRepository.createMany(SEED_HOTELS);

  // Insert the version marker so we don't re-seed next time
  await hotelRepository.createMany([{
    name:          `__SEED_V${SEED_VERSION}__`,
    city:          '__meta__',
    country:       '__meta__',
    address:       '__meta__',
    starRating:    1,
    pricePerNight: 0,
    roomType:      'Standard',
    amenities:     '',
    rating:        0,
    reviewCount:   0,
    availableRooms:0,
  }]);
};

/**
 * Search hotels with optional filters and dynamic pricing applied.
 *
 * @param {object} params - { city, checkIn, checkOut, minStar, maxPrice, roomType, sortBy, guests }
 */
const searchHotels = async ({ city, checkIn, checkOut, minStar, maxPrice, roomType, sortBy, guests = 1 }) => {
  await ensureSeedData();

  const hotels = await hotelRepository.findHotels({ city, minStar, maxPrice, roomType, sortBy });

  // Apply dynamic pricing to each hotel
  return hotels.map((hotel) => {
    const pricing = applyDynamicPricing(hotel.pricePerNight, checkIn, checkOut);
    return {
      ...hotel,
      ...pricing,              // adds pricePerNight (dynamic), totalPrice, nights, baseFare
      guestCount: Number(guests),
    };
  });
};

/**
 * Returns popular/featured hotels for the "Popular Destinations" section.
 */
const getPopularHotels = async () => {
  await ensureSeedData();
  // Return top-rated hotels from key cities
  return hotelRepository.findHotels({ sortBy: 'rating' });
};

/**
 * Book a hotel room and attach it to the user's trip.
 *
 * @param {string} userId  - Logged-in user's ID
 * @param {object} data    - { hotelId, tripId, checkIn, checkOut, rooms, guests, dynamicPrice }
 */
const bookHotel = async (userId, { hotelId, tripId, checkIn, checkOut, rooms = 1, guests = 1, dynamicPrice }) => {
  // Verify the trip exists and belongs to this user
  const trip = await tripRepository.findById(tripId);
  if (!trip) {
    const err = new Error('Trip not found.'); err.statusCode = 404; throw err;
  }
  if (trip.userId !== userId) {
    const err = new Error('You are not authorized to book for this trip.'); err.statusCode = 403; throw err;
  }

  // Get hotel details from DB (if it's in our inventory)
  let hotel = null;
  if (hotelId && !hotelId.startsWith('dyn-')) {
    hotel = await hotelRepository.findById(hotelId);
  }

  const hotelName    = hotel ? hotel.name        : 'Selected Hotel';
  const pricePerRoom = dynamicPrice || (hotel ? hotel.pricePerNight : 5000);

  // Calculate number of nights
  const inDate  = new Date(checkIn);
  const outDate = new Date(checkOut);
  const nights  = Math.max(1, Math.ceil((outDate - inDate) / 86400000));

  const totalAmount = pricePerRoom * Number(rooms) * nights;
  const confirmCode = `HTL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Save as a HOTEL type Booking record
  const booking = await bookingRepository.create({
    type:      'HOTEL',
    provider:  hotelName,
    reference: `${confirmCode} · ${rooms} Room(s) · ${nights} Night(s) · ${guests} Guest(s)`,
    amount:    totalAmount,
    status:    'CONFIRMED',
    userId,
    tripId,
  });

  return booking;
};

/**
 * Get a single hotel by ID with dynamic pricing applied.
 * Used by the hotel detail modal.
 */
const getHotelById = async (id) => {
  await ensureSeedData();
  const hotel = await hotelRepository.findById(id);
  if (!hotel) return null;
  const pricing = applyDynamicPricing(hotel.pricePerNight, null, null);
  return { ...hotel, ...pricing };
};

module.exports = { searchHotels, getPopularHotels, bookHotel, getHotelById, ensureSeedData };

