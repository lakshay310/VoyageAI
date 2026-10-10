// src/pages/LoginPage.jsx
// Login form — supports two modes: User Login and Admin Login.
// Both modes communicate with /api/auth/login.
//
// Mode behaviors:
//   - User mode  → logs in and redirects to /dashboard.
//   - Admin mode → verifies role === 'ADMIN'.
//                  If not an ADMIN, blocks login and alerts the user.
//                  If ADMIN, logs in and redirects directly to /admin.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginUser } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  // 'user' or 'admin'
  const [mode, setMode]         = useState('user');
  const [form, setForm]         = useState({ email: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  const isAdmin = mode === 'admin';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Quick-fill demo credentials
  const fillDemo = (email, password) => {
    setForm({ email, password });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await loginUser(form);
      const { token, user } = res.data.data;

      // ── Admin mode role verification ─────────────────────────────────────
      if (mode === 'admin' && user.role !== 'ADMIN') {
        toast.error('⛔ Access Denied: This account does not have Admin privileges.');
        setLoading(false);
        return; // Halt: do not set auth context or redirect
      }

      // Save token and user object to Context & localStorage
      login(token, user);

      if (mode === 'admin') {
        toast.success(`Welcome, Administrator ${user.name.split(' ')[0]}! 🛡️`);
        navigate('/admin');
      } else {
        toast.success(`Welcome back, ${user.name.split(' ')[0]}! ✈️`);
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* ── Left branding panel (adapts color to mode) ──────────────────────── */}
      <div
        className={`hidden lg:flex flex-col justify-between w-1/2 p-12 transition-all duration-500 ${
          isAdmin
            ? 'bg-gradient-to-br from-red-800 via-rose-950 to-gray-950'
            : 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800'
        }`}
      >
        <div>
          <span className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            {isAdmin ? '🛡️ VoyageAI Admin Portal' : '✈️ VoyageAI'}
          </span>
        </div>

        <div>
          {isAdmin ? (
            <>
              <blockquote className="text-white text-2xl font-light leading-relaxed italic">
                "Real-time governance, comprehensive metrics, and platform-wide observability."
              </blockquote>
              <p className="text-red-300 mt-4 text-sm font-medium">— Platform Management Console</p>
            </>
          ) : (
            <>
              <blockquote className="text-white text-2xl font-light leading-relaxed italic">
                "The world is a book, and those who do not travel read only one page."
              </blockquote>
              <p className="text-blue-200 mt-4 text-sm font-medium">— Saint Augustine</p>
            </>
          )}
        </div>

        {/* Feature tags */}
        <div className="flex flex-wrap gap-2.5">
          {isAdmin
            ? ['👥 User Management', '📊 Platform Stats', '🎫 Global Bookings', '🛡️ Role Control'].map((tag) => (
                <span
                  key={tag}
                  className="bg-white/10 text-white text-xs px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))
            : ['🏖️ Beaches', '🏔️ Mountains', '🏙️ Cities', '🌿 Nature', '🤖 AI Planning'].map((tag) => (
                <span
                  key={tag}
                  className="bg-white/10 text-white text-xs px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
        </div>
      </div>

      {/* ── Right panel: Login form ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-6 text-center">
          <span className="text-2xl font-bold text-white">
            {isAdmin ? '🛡️ VoyageAI Admin' : '✈️ VoyageAI'}
          </span>
        </div>

        <div className="w-full max-w-md">
          {/* ── Mode selector tabs ──────────────────────────────────────────── */}
          <div className="flex bg-gray-900 border border-gray-800 rounded-2xl p-1 mb-8 gap-1">
            <button
              id="tab-user-login"
              type="button"
              onClick={() => {
                setMode('user');
                setForm({ email: '', password: '' });
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                !isAdmin
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              👤 User Login
            </button>

            <button
              id="tab-admin-login"
              type="button"
              onClick={() => {
                setMode('admin');
                setForm({ email: '', password: '' });
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isAdmin
                  ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              🛡️ Admin Login
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white">
              {isAdmin ? 'Admin Console' : 'Welcome back'}
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              {isAdmin
                ? 'Sign in with your administrator account to manage users and platform metrics.'
                : 'Sign in to continue planning and exploring your journeys.'}
            </p>
          </div>

          {/* ── Form Card ─────────────────────────────────────────────────── */}
          <div
            className={`border rounded-2xl p-8 shadow-xl bg-gray-900 transition-all duration-300 ${
              isAdmin ? 'border-red-500/30 ring-1 ring-red-500/20' : 'border-gray-800'
            }`}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field */}
              <div>
                <label className="label">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  className="input"
                  placeholder={isAdmin ? 'admin@voyage.ai' : 'you@example.com'}
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password field */}
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    className="input pr-12"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-xs font-medium transition-colors"
                  >
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className={`w-full py-3 text-base rounded-xl font-semibold text-white inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 shadow-lg ${
                  isAdmin
                    ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                }`}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  isAdmin ? '🛡️ Sign in to Admin Console' : 'Sign In ✈️'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-gray-600 text-xs tracking-wider uppercase">Demo Accounts</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            {/* Interactive Demo credentials card */}
            {isAdmin ? (
              <div
                onClick={() => fillDemo('admin@tripplanner.com', 'Admin@123')}
                className="bg-red-950/30 border border-red-800/40 rounded-xl p-3.5 cursor-pointer hover:bg-red-900/30 transition-all group"
                title="Click to autofill"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-red-400 text-xs font-semibold flex items-center gap-1.5">
                    🛡️ Admin Credentials
                  </p>
                  <span className="text-[10px] text-red-300/70 group-hover:text-red-200 underline">
                    Click to autofill
                  </span>
                </div>
                <p className="text-gray-400 text-xs">
                  Email: <span className="text-gray-200 font-mono">admin@tripplanner.com</span>
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Password: <span className="text-gray-200 font-mono">Admin@123</span>
                </p>
              </div>
            ) : (
              <div
                onClick={() => fillDemo('demo@tripplanner.com', 'Demo@123')}
                className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-3.5 cursor-pointer hover:bg-blue-900/30 transition-all group"
                title="Click to autofill"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-blue-400 text-xs font-semibold flex items-center gap-1.5">
                    👤 User Credentials
                  </p>
                  <span className="text-[10px] text-blue-300/70 group-hover:text-blue-200 underline">
                    Click to autofill
                  </span>
                </div>
                <p className="text-gray-400 text-xs">
                  Email: <span className="text-gray-200 font-mono">demo@tripplanner.com</span>
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Password: <span className="text-gray-200 font-mono">Demo@123</span>
                </p>
              </div>
            )}
          </div>

          {/* Registration link (only in User mode) */}
          {!isAdmin && (
            <p className="text-center text-gray-400 mt-6 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Create one free →
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
