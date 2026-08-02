// src/controllers/hotel.controller.js
// Handles HTTP requests for hotel search and booking.
// Validates input, calls the service, and sends the response.
// NO business logic here — that lives in hotel.service.js.

const hotelService = require('../services/hotel.service');

/**
 * POST /api/hotels/search
 * Body: { city, checkIn, checkOut, minStar, maxPrice, roomType, sortBy, guests }
 * Returns list of hotels with dynamic pricing applied.
 */
const searchHotels = async (req, res, next) => {
  try {
    const { city, checkIn, checkOut, minStar, maxPrice, roomType, sortBy, guests } = req.body;

    // Basic validation
    if (!city && !req.body.query) {
      return res.status(400).json({ success: false, message: 'Please provide a city or destination.' });
    }

    const hotels = await hotelService.searchHotels({
      city:     city || req.body.query,
      checkIn,
      checkOut,
      minStar:  minStar  ? Number(minStar)  : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      roomType,
      sortBy,
      guests,
    });

    res.json({ success: true, count: hotels.length, hotels });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/hotels/popular
 * Returns top-rated hotels for the featured section.
 */
const getPopularHotels = async (req, res, next) => {
  try {
    const hotels = await hotelService.getPopularHotels();
    res.json({ success: true, hotels });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/hotels/book   (Protected — requires auth)
 * Body: { hotelId, tripId, checkIn, checkOut, rooms, guests, dynamicPrice }
 * Books the hotel and creates a HOTEL booking record under the trip.
 */
const bookHotel = async (req, res, next) => {
  try {
    const userId = req.user.id; // injected by auth middleware
    const { hotelId, tripId, checkIn, checkOut, rooms, guests, dynamicPrice } = req.body;

    if (!tripId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'tripId, checkIn, and checkOut are required to book a hotel.',
      });
    }

    const booking = await hotelService.bookHotel(userId, {
      hotelId,
      tripId,
      checkIn,
      checkOut,
      rooms,
      guests,
      dynamicPrice,
    });

    res.status(201).json({ success: true, message: 'Hotel booked successfully!', booking });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/hotels/:id
 * Returns a single hotel's full details (used by the detail modal).
 */
const getHotelById = async (req, res, next) => {
  try {
    const hotel = await hotelService.getHotelById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found.' });
    res.json({ success: true, hotel });
  } catch (err) {
    next(err);
  }
};

module.exports = { searchHotels, getPopularHotels, bookHotel, getHotelById };
