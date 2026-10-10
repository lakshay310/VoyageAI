// src/services/map.service.js
// Business logic for Maps module.
// Generates map markers, calculates offsets, geocodes cities, and compiles trip map views.

const mapRepository = require('../repositories/map.repository');
const hotelService = require('./hotel.service');

// Sample points of interest (Sightseeing & Dining) offsets for popular cities
const ATTRACTIONS_BY_CITY = {
  'goa': [
    { name: 'Calangute Beach', category: 'ATTRACTION', lat: 15.5437, lng: 73.7553, rating: 4.6, desc: 'Famous beach with water sports & shacks' },
    { name: 'Aguada Fort', category: 'ATTRACTION', lat: 15.4920, lng: 73.7737, rating: 4.7, desc: '17th-century Portuguese fortress & lighthouse' },
    { name: 'Baga Beach Shacks', category: 'RESTAURANT', lat: 15.5553, lng: 73.7517, rating: 4.5, desc: 'Seafood and nightlife by the sea' },
    { name: 'Dudsagar Waterfalls', category: 'ATTRACTION', lat: 15.3144, lng: 74.3143, rating: 4.8, desc: 'Four-tiered scenic waterfall trekking' },
  ],
  'delhi': [
    { name: 'Red Fort (Lal Qila)', category: 'ATTRACTION', lat: 28.6562, lng: 77.2410, rating: 4.6, desc: 'Mughal empire historic citadel' },
    { name: 'Qutub Minar', category: 'ATTRACTION', lat: 28.5245, lng: 77.1855, rating: 4.7, desc: 'UNESCO World Heritage victory tower' },
    { name: 'Karim\'s Jama Masjid', category: 'RESTAURANT', lat: 28.6507, lng: 77.2334, rating: 4.4, desc: 'Legendary Mughlai kebabs & biryani' },
    { name: 'India Gate', category: 'ATTRACTION', lat: 28.6129, lng: 77.2295, rating: 4.8, desc: 'Iconic war memorial and boulevard' },
  ],
  'mumbai': [
    { name: 'Gateway of India', category: 'ATTRACTION', lat: 18.9220, lng: 72.8347, rating: 4.7, desc: 'Waterfront 20th-century monument' },
    { name: 'Marine Drive Promenade', category: 'ATTRACTION', lat: 18.9432, lng: 72.8230, rating: 4.8, desc: 'Queen\'s Necklace sunset view' },
    { name: 'Bademiya Colaba', category: 'RESTAURANT', lat: 18.9227, lng: 72.8315, rating: 4.3, desc: 'Famous late-night street food & seekh kebabs' },
  ],
  'paris': [
    { name: 'Eiffel Tower', category: 'ATTRACTION', lat: 48.8584, lng: 2.2945, rating: 4.8, desc: 'World famous iron lattice tower' },
    { name: 'Louvre Museum', category: 'ATTRACTION', lat: 48.8606, lng: 2.3376, rating: 4.9, desc: 'Art gallery featuring Mona Lisa' },
    { name: 'Le Relais de l\'Entrecôte', category: 'RESTAURANT', lat: 48.8679, lng: 2.3060, rating: 4.6, desc: 'Classic Parisian steak frites bistro' },
  ],
  'dubai': [
    { name: 'Burj Khalifa', category: 'ATTRACTION', lat: 25.1972, lng: 55.2744, rating: 4.9, desc: 'Tallest building in the world' },
    { name: 'Dubai Mall & Fountains', category: 'ATTRACTION', lat: 25.1988, lng: 55.2796, rating: 4.8, desc: 'Shopping, aquarium, and light show' },
    { name: 'Al Ustad Special Kabab', category: 'RESTAURANT', lat: 25.2605, lng: 55.2974, rating: 4.7, desc: 'Famous Iranian kebab restaurant since 1978' },
  ],
};

/**
 * Resolve city center coordinates.
 */
const resolveCityCoords = (cityName = 'Goa') => {
  const normalized = cityName.trim().toLowerCase();
  const foundKey = Object.keys(mapRepository.CITY_COORDINATES).find((k) => normalized.includes(k));
  if (foundKey) {
    return { name: cityName, ...mapRepository.CITY_COORDINATES[foundKey] };
  }
  // Fallback to Goa center
  return { name: cityName, lat: 15.2993, lng: 74.1240, zoom: 11, country: 'India' };
};

/**
 * Fetch map data for a specific city.
 */
const getCityMapData = async (cityName) => {
  if (hotelService.ensureSeedData) {
    try {
      await hotelService.ensureSeedData();
    } catch (err) {
      console.warn('Could not auto-seed hotels for map:', err.message);
    }
  }
  const cityInfo = resolveCityCoords(cityName);
  const dbHotels = await mapRepository.findHotelsByCity(cityName);

  // Generate markers with micro lat/lng offsets around city center for DB hotels
  const hotelMarkers = dbHotels.map((h, index) => {
    // Offset slightly for visual dispersion on the map
    const angle = (index / Math.max(dbHotels.length, 1)) * 2 * Math.PI;
    const radius = 0.02 + (index % 3) * 0.015;
    return {
      id: h.id,
      title: h.name,
      category: 'HOTEL',
      lat: cityInfo.lat + Math.sin(angle) * radius,
      lng: cityInfo.lng + Math.cos(angle) * radius,
      price: `₹${h.pricePerNight.toLocaleString('en-IN')}/night`,
      starRating: h.starRating,
      address: h.address,
      imageUrl: h.imageUrl,
      rating: h.rating || 4.5,
    };
  });

  // Get attractions/dining for city
  const normalized = cityName.trim().toLowerCase();
  const cityKey = Object.keys(ATTRACTIONS_BY_CITY).find((k) => normalized.includes(k));
  const rawAttractions = cityKey ? ATTRACTIONS_BY_CITY[cityKey] : [
    { name: `${cityName} City Center`, category: 'ATTRACTION', lat: cityInfo.lat + 0.008, lng: cityInfo.lng + 0.008, rating: 4.5, desc: 'Central historic square and market' },
    { name: `${cityName} Local Dining`, category: 'RESTAURANT', lat: cityInfo.lat - 0.008, lng: cityInfo.lng - 0.008, rating: 4.4, desc: 'Authentic local cuisine & cafes' },
  ];

  const attractionMarkers = rawAttractions.map((a, i) => ({
    id: `attr-${i}`,
    title: a.name,
    category: a.category,
    lat: a.lat,
    lng: a.lng,
    rating: a.rating,
    desc: a.desc,
  }));

  return {
    city: cityInfo,
    markers: [...hotelMarkers, ...attractionMarkers],
  };
};

/**
 * Fetch map data for a specific user trip.
 */
const getTripMapData = async (tripId, userId) => {
  const trip = await mapRepository.findTripWithBookings(tripId, userId);
  if (!trip) {
    const error = new Error('Trip not found or unauthorized.');
    error.statusCode = 404;
    throw error;
  }

  const cityData = await getCityMapData(trip.destination);

  // Map trip bookings to pins
  const bookingMarkers = (trip.bookings || []).map((b) => ({
    id: b.id,
    title: `${b.type}: ${b.provider}`,
    category: b.type === 'HOTEL' ? 'HOTEL' : b.type === 'FLIGHT' ? 'FLIGHT' : 'ATTRACTION',
    lat: cityData.city.lat + (Math.random() - 0.5) * 0.03,
    lng: cityData.city.lng + (Math.random() - 0.5) * 0.03,
    amount: `₹${b.amount.toLocaleString('en-IN')}`,
    status: b.status,
  }));

  return {
    trip: {
      id: trip.id,
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: trip.budget,
    },
    center: cityData.city,
    markers: [...cityData.markers, ...bookingMarkers],
  };
};

/**
 * Search places and geocode queries.
 * Accepts an optional userId to fetch user-specific trip markers.
 */
const searchPlaceMapData = async (query, userId) => {
  const cityData = await getCityMapData(query || 'Goa');

  // Only query trips if a userId is provided
  const userTrips = userId
    ? await mapRepository.findUserTrips(userId)
    : [];

  return {
    query: query || 'Goa',
    center: cityData.city,
    markers: cityData.markers,
    availableTrips: userTrips,
  };
};

module.exports = {
  getCityMapData,
  getTripMapData,
  searchPlaceMapData,
  resolveCityCoords,
};
