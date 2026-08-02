// src/pages/LoginPage.jsx
// Login form — calls the auth API and stores the JWT token on success.
// Uses the AuthContext to update global user state.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginUser } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  // Form state: tracks email and password input values
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false); // toggle password visibility

  const { login }  = useAuth();   // from AuthContext — saves token + user
  const navigate   = useNavigate();

  // Generic handler: updates whichever field changed
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser(form);
      const { token, user } = res.data.data;

      // Save to localStorage + update React context
      login(token, user);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! ✈️`);
      navigate('/dashboard');
    } catch (error) {
      // Show the server's error message, or a fallback
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* ── Left panel: branding (hidden on mobile) ────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12">
        <div>
          <span className="text-3xl font-bold text-white tracking-tight">✈️ VoyageAI</span>
        </div>
        <div>
          <blockquote className="text-white text-2xl font-light leading-relaxed italic">
            "The world is a book, and those who do not travel read only one page."
          </blockquote>
          <p className="text-blue-200 mt-4 text-sm">— Saint Augustine</p>
        </div>
        {/* Decorative circles */}
        <div className="flex gap-3">
          {['🏖️ Beaches', '🏔️ Mountains', '🏙️ Cities', '🌿 Nature'].map((tag) => (
            <span key={tag} className="bg-white/10 text-white text-xs px-3 py-1.5 rounded-full border border-white/20">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ── Right panel: login form ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <span className="text-2xl font-bold text-white">✈️ VoyageAI</span>
        </div>

        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Welcome back</h1>
            <p className="text-gray-400 mt-2 text-sm">
              Sign in to continue planning your trips.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field */}
              <div>
                <label className="label">Email address</label>
                <input
                  id="login-email"
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

              {/* Password field with show/hide toggle */}
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
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-gray-600 text-xs">OR</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            {/* Demo credentials hint */}
            <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-4">
              <p className="text-blue-400 text-xs font-semibold mb-2">🧪 Demo credentials</p>
              <p className="text-gray-400 text-xs">Email: <span className="text-gray-200 font-mono">demo@tripplanner.com</span></p>
              <p className="text-gray-400 text-xs mt-1">Password: <span className="text-gray-200 font-mono">Demo@123</span></p>
            </div>
          </div>

          {/* Link to register */}
          <p className="text-center text-gray-400 mt-6 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Create one free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
