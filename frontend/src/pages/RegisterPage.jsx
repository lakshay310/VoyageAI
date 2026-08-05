// src/pages/RegisterPage.jsx
// Sign-up form — creates a new account and logs the user in immediately.
// On success, the user gets a JWT and is redirected to the dashboard.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { registerUser } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await registerUser(form);
      const { token, user } = res.data.data;

      // Login immediately after successful registration
      login(token, user);
      toast.success('Account created! Welcome aboard 🎉');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (password.length === 0) return null;
    if (password.length < 6)  return { label: 'Too short', color: 'bg-red-500',    width: 'w-1/4' };
    if (password.length < 8)  return { label: 'Weak',      color: 'bg-orange-500', width: 'w-2/4' };
    if (password.length < 12) return { label: 'Good',      color: 'bg-yellow-500', width: 'w-3/4' };
    return                           { label: 'Strong',    color: 'bg-green-500',  width: 'w-full' };
  };

  const strength = getPasswordStrength(form.password);

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* ── Left panel: branding (hidden on mobile) ────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-800 p-12">
        <div>
          <span className="text-3xl font-bold text-white tracking-tight">✈️ VoyageAI</span>
        </div>

        {/* Feature highlights */}
        <div className="space-y-6">
          <h2 className="text-white text-2xl font-bold">Everything you need for your perfect trip</h2>
          {[
            { icon: '🤖', title: 'AI Itinerary',   desc: 'Get a personalised day-by-day plan instantly.' },
            { icon: '🎫', title: 'All Bookings',   desc: 'Manage flights, hotels and activities in one place.' },
            { icon: '💰', title: 'Budget Tracker', desc: 'Track expenses and never go over budget.' },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-blue-200 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-blue-300 text-xs">Free to use. No credit card required.</p>
      </div>

      {/* ── Right panel: registration form ────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <span className="text-2xl font-bold text-white">✈️ VoyageAI</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Create your account</h1>
            <p className="text-gray-400 mt-2 text-sm">
              Start planning your dream trips today. It's free.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full name */}
              <div>
                <label className="label">Full Name</label>
                <input
                  id="register-name"
                  type="text"
                  name="name"
                  className="input"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="label">Email address</label>
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  className="input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password with strength bar */}
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    className="input pr-12"
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-xs font-medium transition-colors"
                  >
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>

                {/* Password strength bar — only shown when user starts typing */}
                {strength && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{strength.label}</p>
                  </div>
                )}
              </div>

              <button
                id="register-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-gray-400 mt-6 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
