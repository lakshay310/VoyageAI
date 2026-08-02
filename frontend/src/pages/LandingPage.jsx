// src/pages/LandingPage.jsx
// Public home page — the first thing a visitor sees.
// Sections: Hero, Features, How It Works, Stats, Testimonials, CTA, Footer.
// No API calls needed here — it's a pure static marketing page.

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI Itinerary Generator',
    desc:  'Describe your dream trip and get a personalised day-by-day plan in seconds — no manual research needed.',
    color: 'from-blue-500/20 to-indigo-500/10',
    border: 'border-blue-500/20',
  },
  {
    icon: '✈️',
    title: 'Flight & Hotel Bookings',
    desc:  'Track all your bookings — flights, hotels, cars, and activities — in one clean dashboard.',
    color: 'from-purple-500/20 to-pink-500/10',
    border: 'border-purple-500/20',
  },
  {
    icon: '💰',
    title: 'Budget Tracker',
    desc:  'Set a budget, log expenses by category, and see exactly where your money is going with real-time charts.',
    color: 'from-green-500/20 to-emerald-500/10',
    border: 'border-green-500/20',
  },
  {
    icon: '🗺️',
    title: 'Trip Dashboard',
    desc:  'All your trips in one place — past, present and planned. Switch between them instantly.',
    color: 'from-orange-500/20 to-amber-500/10',
    border: 'border-orange-500/20',
  },
  {
    icon: '🔐',
    title: 'Secure Accounts',
    desc:  'JWT-based authentication keeps your data private. Each trip is visible only to you.',
    color: 'from-red-500/20 to-rose-500/10',
    border: 'border-red-500/20',
  },
  {
    icon: '📊',
    title: 'Expense Analytics',
    desc:  'Visual breakdowns by category — food, transport, accommodation — so you can plan smarter next time.',
    color: 'from-cyan-500/20 to-sky-500/10',
    border: 'border-cyan-500/20',
  },
];

const STEPS = [
  { step: '01', title: 'Create an Account',    desc: 'Sign up free in under 30 seconds. No credit card required.' },
  { step: '02', title: 'Add Your Trip',         desc: 'Enter your destination, dates and budget to get started.' },
  { step: '03', title: 'Track Everything',      desc: 'Log bookings and expenses as your trip progresses.' },
  { step: '04', title: 'Travel Stress-Free',    desc: 'Focus on the memories — we\'ll handle the planning chaos.' },
];

const STATS = [
  { value: '10K+', label: 'Trips Planned' },
  { value: '₹2Cr+', label: 'Budgets Tracked' },
  { value: '50+',  label: 'Countries' },
  { value: '4.9★', label: 'Average Rating' },
];

const TESTIMONIALS = [
  {
    name:   'Priya Sharma',
    role:   'Solo Traveller',
    avatar: 'P',
    color:  'from-pink-500 to-rose-600',
    quote:  '"I planned my entire Southeast Asia trip in one weekend using VoyageAI. The budget tracker saved me from overspending every single day."',
  },
  {
    name:   'Rahul Mehta',
    role:   'Family Trips',
    avatar: 'R',
    color:  'from-blue-500 to-indigo-600',
    quote:  '"Managing bookings for a family of 5 used to be a nightmare. Now everything is in one dashboard — flights, hotels, activities. Absolute game changer."',
  },
  {
    name:   'Ananya Gupta',
    role:   'Backpacker',
    avatar: 'A',
    color:  'from-emerald-500 to-teal-600',
    quote:  '"The AI itinerary feature blew my mind. I just typed \'10 days in Europe, ₹1.5L budget\' and got a complete plan instantly."',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** A single feature card with gradient background and hover lift */
const FeatureCard = ({ icon, title, desc, color, border, delay }) => (
  <div
    className={`animate-fade-in-up ${delay} group relative bg-gradient-to-br ${color} border ${border}
                rounded-2xl p-6 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10
                transition-all duration-300 cursor-default`}
  >
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

/** A numbered step in the "How it works" section */
const StepCard = ({ step, title, desc, delay }) => (
  <div className={`animate-fade-in-up ${delay} flex flex-col items-center text-center`}>
    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm mb-4 ring-4 ring-blue-600/20">
      {step}
    </div>
    <h3 className="text-white font-semibold mb-2">{title}</h3>
    <p className="text-gray-400 text-sm max-w-[200px]">{desc}</p>
  </div>
);

/** A stat block in the social-proof band */
const StatBlock = ({ value, label }) => (
  <div className="text-center">
    <p className="text-3xl sm:text-4xl font-bold text-white">{value}</p>
    <p className="text-gray-400 text-sm mt-1">{label}</p>
  </div>
);

/** Testimonial card */
const TestimonialCard = ({ name, role, avatar, color, quote, delay }) => (
  <div className={`animate-fade-in-up ${delay} bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4 hover:border-gray-700 transition-colors duration-200`}>
    <p className="text-gray-300 text-sm leading-relaxed flex-1">{quote}</p>
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
        {avatar}
      </div>
      <div>
        <p className="text-white text-sm font-medium">{name}</p>
        <p className="text-gray-500 text-xs">{role}</p>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const LandingPage = () => {
  // If the user is already logged in, change the CTA to go to Dashboard
  const { user } = useAuth();
  const ctaLink  = user ? '/dashboard' : '/register';
  const ctaLabel = user ? 'Go to Dashboard →' : 'Start Planning Free →';

  return (
    <div className="bg-gray-950 text-gray-100">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center">

        {/* Decorative radial glow blobs — pure CSS, no images */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="animate-float absolute top-20 left-1/4 w-72 h-72 rounded-full bg-blue-600/15 blur-3xl" />
          <div className="animate-float delay-300 absolute bottom-20 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center w-full">

          {/* Badge */}
          <div className="animate-fade-in-up flex justify-center mb-6">
            <span className="badge-gradient">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              ✨ Meet VoyageAI — Your AI Travel Companion
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up delay-100 text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6 tracking-tight">
            Plan Your Dream Trip <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              with the Power of AI
            </span>
          </h1>

          {/* Subheading */}
          <p className="animate-fade-in-up delay-200 text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Tell us where you want to go. We'll handle itineraries, bookings and
            budgets — all in one beautiful dashboard. No spreadsheets. No chaos.
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              to={ctaLink}
              className="animate-pulse-glow btn-primary px-8 py-4 text-base rounded-xl"
            >
              {ctaLabel}
            </Link>
            <a
              href="#how-it-works"
              className="btn-secondary px-8 py-4 text-base rounded-xl"
            >
              See how it works ↓
            </a>
          </div>

          {/* Social proof — small trust strip */}
          <p className="animate-fade-in-up delay-400 text-gray-500 text-sm">
            Trusted by{' '}
            <span className="text-gray-300 font-medium">10,000+ travellers</span>
            {' '}across India 🇮🇳
          </p>
        </div>
      </section>

      {/* ── STATS BAND ────────────────────────────────────────────────────── */}
      <section className="border-y border-gray-800 bg-gray-900/50 py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <StatBlock key={s.label} {...s} />
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Section header */}
          <div className="text-center mb-16 animate-fade-in-up">
            <span className="badge-gradient mb-4">Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-4">
              Everything you need for the perfect trip
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              From planning to packing lists, VoyageAI covers every step of your journey.
            </p>
          </div>

          {/* 3-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <FeatureCard
                key={f.title}
                {...f}
                delay={`delay-${(i % 3 + 1) * 100}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-900/40">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-16 animate-fade-in-up">
            <span className="badge-gradient mb-4">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-4">
              Up and running in minutes
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              No complicated setup. Just sign up and start planning.
            </p>
          </div>

          {/* Steps row — with connector lines between them on desktop */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
            {/* Horizontal connector line (desktop only) */}
            <div className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-blue-600/40 to-transparent" />
            {STEPS.map((s, i) => (
              <StepCard key={s.step} {...s} delay={`delay-${(i + 1) * 100}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-16 animate-fade-in-up">
            <span className="badge-gradient mb-4">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-4">
              Loved by travellers like you
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.name} {...t} delay={`delay-${(i + 1) * 100}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
          {/* Glowing card background */}
          <div className="relative bg-gradient-to-br from-blue-600/20 via-indigo-600/15 to-purple-600/10
                          border border-blue-500/20 rounded-3xl p-12 overflow-hidden">

            {/* Decorative blob inside card */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 rounded-full bg-blue-600/10 blur-3xl" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to travel smarter?
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-lg mx-auto">
                Join thousands of travellers who plan stress-free trips with VoyageAI.
                It's free to get started.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to={ctaLink}
                  className="animate-pulse-glow btn-primary px-10 py-4 text-base rounded-xl"
                >
                  {ctaLabel}
                </Link>
                {!user && (
                  <Link to="/login" className="btn-secondary px-10 py-4 text-base rounded-xl">
                    Sign In
                  </Link>
                )}
              </div>
              <p className="text-gray-500 text-xs mt-5">
                Free forever for personal use. No credit card required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-white hover:text-blue-400 transition-colors">
            ✈️ <span>VoyageAI</span>
          </Link>

          {/* Quick links */}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#how-it-works" className="hover:text-gray-300 transition-colors">How it works</a>
            <Link to="/login"    className="hover:text-gray-300 transition-colors">Login</Link>
            <Link to="/register" className="hover:text-gray-300 transition-colors">Sign Up</Link>
          </div>

          {/* Copyright */}
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} VoyageAI
          </p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
