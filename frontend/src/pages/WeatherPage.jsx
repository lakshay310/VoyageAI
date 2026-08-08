// src/pages/WeatherPage.jsx
// Interactive Weather Dashboard for VoyageAI.
//
// Powered by Open-Meteo (https://open-meteo.com/) — 100% free, no API key.
//
// Features:
//   - Search any city worldwide (India 🇮🇳 + International 🌍)
//   - Quick destination chips for popular travel spots
//   - Current conditions: temperature, feels like, humidity, wind, UV, precipitation
//   - 7-day forecast cards with emoji icons, min/max temps, rain probability
//   - AI-style travel advice tips based on live weather
//   - Trip weather: select a saved trip to see destination weather

import { useState, useEffect } from 'react';
import { toast }               from 'react-hot-toast';
import { getCityWeather, getTripWeather } from '../services/weather.service';
import { getMyTrips }          from '../services/trip.service';

// Popular travel cities for quick access chips
const QUICK_CITIES_INDIA         = ['Goa', 'Delhi', 'Mumbai', 'Jaipur', 'Kerala', 'Shimla', 'Manali', 'Varanasi'];
const QUICK_CITIES_INTERNATIONAL = ['Paris', 'Dubai', 'Tokyo', 'London', 'Singapore', 'Bali', 'Bangkok', 'Sydney'];

// Severity → background style for travel advice tips
const SEVERITY_STYLE = {
  good:    'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  neutral: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
  caution: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  bad:     'bg-red-500/10 border-red-500/30 text-red-300',
};

const WeatherPage = () => {
  const [searchInput,    setSearchInput]    = useState('');
  const [activeCity,     setActiveCity]     = useState('');
  const [weatherData,    setWeatherData]    = useState(null);
  const [userTrips,      setUserTrips]      = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [loading,        setLoading]        = useState(false);

  // Load user trips for the trip selector dropdown
  useEffect(() => {
    getMyTrips()
      .then((res) => setUserTrips(res.data?.data || []))
      .catch(() => {});
    // Load default city on mount
    handleCitySearch('Goa');
  }, []);

  // ── Fetch city weather ────────────────────────────────────────────────────
  const handleCitySearch = async (city) => {
    const q = (city || searchInput).trim();
    if (!q) return;
    setLoading(true);
    setActiveCity(q);
    setSelectedTripId('');
    try {
      const res = await getCityWeather(q);
      setWeatherData(res.data?.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'City not found. Check spelling.');
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch weather for a saved trip ────────────────────────────────────────
  const handleTripSelect = async (tripId) => {
    setSelectedTripId(tripId);
    if (!tripId) return;
    setLoading(true);
    try {
      const res  = await getTripWeather(tripId);
      const data = res.data?.data;
      setWeatherData(data.weather);         // weather object is nested under .weather
      setActiveCity(data.trip.destination);
      toast.success(`🌤️ Weather for "${data.trip.title}"`);
    } catch {
      toast.error('Could not load trip weather.');
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  const { location, current, forecast, advice } = weatherData || {};

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900 border border-gray-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white">🌦️ Weather Dashboard</h1>
          <p className="text-gray-400 text-xs mt-0.5">
            Real-time weather for any destination worldwide · Powered by{' '}
            <a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
              Open-Meteo
            </a>{' '}
            (free, no API key)
          </p>
        </div>

        {/* Controls: Trip picker + City search */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={selectedTripId}
            onChange={(e) => handleTripSelect(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">🧳 Check Trip Weather...</option>
            {userTrips.map((t) => (
              <option key={t.id} value={t.id}>✈️ {t.title} — {t.destination}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCitySearch()}
              placeholder="Search any city..."
              className="bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-44"
            />
            <button
              onClick={() => handleCitySearch()}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick City Chips ───────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest shrink-0 font-semibold w-16">🇮🇳 India</span>
          {QUICK_CITIES_INDIA.map((city) => (
            <button key={city} onClick={() => { setSearchInput(city); handleCitySearch(city); }}
              className={`px-3 py-1 rounded-xl text-xs font-medium border shrink-0 transition ${
                activeCity.toLowerCase() === city.toLowerCase()
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/50'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-600'
              }`}>
              {city}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest shrink-0 font-semibold w-16">🌍 World</span>
          {QUICK_CITIES_INTERNATIONAL.map((city) => (
            <button key={city} onClick={() => { setSearchInput(city); handleCitySearch(city); }}
              className={`px-3 py-1 rounded-xl text-xs font-medium border shrink-0 transition ${
                activeCity.toLowerCase() === city.toLowerCase()
                  ? 'bg-purple-600/20 text-purple-400 border-purple-500/50'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-600'
              }`}>
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading State ─────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Fetching live weather data...</p>
          </div>
        </div>
      )}

      {/* ── Main Weather Content ───────────────────────────────────────────── */}
      {!loading && weatherData && (
        <>
          {/* Current Weather Hero Card */}
          <div className="bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-gray-900 border border-blue-800/40 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

              {/* Left: Location + main reading */}
              <div className="flex items-center gap-6">
                <div className="text-7xl leading-none select-none">{current?.weather?.emoji}</div>
                <div>
                  <h2 className="text-4xl font-black text-white">{current?.temperature}°C</h2>
                  <p className="text-blue-300 font-semibold mt-0.5">{current?.weather?.label}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    📍 {location?.name}, {location?.country}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">Feels like {current?.feelsLike}°C</p>
                </div>
              </div>

              {/* Right: Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { icon: '💧', label: 'Humidity',      value: `${current?.humidity}%`              },
                  { icon: '💨', label: 'Wind Speed',    value: `${current?.windSpeed} km/h`         },
                  { icon: '🌧️', label: 'Precipitation', value: `${current?.precipitation} mm`       },
                  { icon: '☀️', label: 'UV Index',      value: current?.uvIndex?.toFixed(1) ?? '–'  },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-center">
                    <p className="text-xl mb-1">{icon}</p>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* 7-Day Forecast */}
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                📅 7-Day Forecast
                <span className="text-xs font-normal text-gray-500 ml-1">for {location?.name}</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {forecast?.map((day, i) => (
                  <div
                    key={day.date}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center ${
                      i === 0
                        ? 'bg-blue-600/20 border-blue-500/40'
                        : 'bg-gray-800/40 border-gray-800 hover:bg-gray-800 transition'
                    }`}
                  >
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      {i === 0 ? 'Today' : day.day}
                    </p>
                    <span className="text-2xl">{day.weather.emoji}</span>
                    <p className="text-xs font-bold text-white">{day.tempMax}°</p>
                    <p className="text-xs text-gray-500">{day.tempMin}°</p>
                    <div className="flex items-center gap-0.5 text-blue-400 text-[10px]">
                      <span>💧</span>
                      <span>{day.rainChance}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Travel Advice Panel */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                🧠 Travel Advice
              </h3>
              <div className="space-y-2.5">
                {advice?.map((tip, i) => (
                  <div key={i} className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    tip.includes('⚠️') || tip.includes('🥵')
                      ? SEVERITY_STYLE.bad
                      : tip.includes('🌂') || tip.includes('💧') || tip.includes('🧥')
                        ? SEVERITY_STYLE.caution
                        : SEVERITY_STYLE.good
                  }`}>
                    {tip}
                  </div>
                ))}
              </div>

              {/* Extended details */}
              <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">More Details</h4>
                {[
                  { label: 'Timezone',   value: location?.timezone?.replace('_', ' ') },
                  { label: 'Latitude',   value: `${location?.lat?.toFixed(4)}°` },
                  { label: 'Longitude',  value: `${location?.lng?.toFixed(4)}°` },
                  { label: 'Updated',    value: weatherData.fetchedAt ? new Date(weatherData.fetchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '–' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-300 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Empty State ───────────────────────────────────────────────────── */}
      {!loading && !weatherData && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
          <p className="text-5xl mb-4">🌡️</p>
          <h3 className="text-lg font-bold text-white">Search Any Destination</h3>
          <p className="text-gray-400 text-sm mt-2">
            Type a city name above or pick one of the quick chips to see live weather data.
          </p>
        </div>
      )}
    </div>
  );
};

export default WeatherPage;
