// src/pages/SecurityPage.jsx
// Security Settings page — lets the user change their password.
// Sits at route /security inside the protected dashboard layout.

import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const SecurityPage = () => {
  // Form state for the three password fields
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Track loading state to disable the button during the API call
  const [loading, setLoading] = useState(false);

  // Update form state as user types
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit the change-password request
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side check: new passwords must match
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }

    // Client-side check: new password must be at least 6 chars
    if (form.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // PATCH /api/auth/password — already built in Prompt 3
      await api.patch('/auth/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Password changed successfully! 🔒');
      // Clear the form after success
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      // Show the server error message (e.g., "Current password is incorrect.")
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          🔒 Security Settings
        </h1>
        <p className="text-gray-400 mt-1">
          Manage your account security and change your password.
        </p>
      </div>

      {/* Security tips card */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <h3 className="text-blue-400 font-semibold mb-2">🛡️ Security Tips</h3>
        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
          <li>Use a strong password with at least 8 characters.</li>
          <li>Mix uppercase, lowercase, numbers, and symbols.</li>
          <li>Never share your password with anyone.</li>
          <li>Change your password regularly for best security.</li>
        </ul>
      </div>

      {/* Change password form */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-6">Change Password</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              required
              placeholder="Enter your current password"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5
                         text-white placeholder-gray-400 focus:outline-none focus:border-purple-500
                         transition"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              required
              placeholder="At least 6 characters"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5
                         text-white placeholder-gray-400 focus:outline-none focus:border-purple-500
                         transition"
            />
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter your new password"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5
                         text-white placeholder-gray-400 focus:outline-none focus:border-purple-500
                         transition"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50
                       text-white font-semibold py-2.5 rounded-lg transition"
          >
            {loading ? 'Updating Password...' : '🔑 Update Password'}
          </button>
        </form>
      </div>

      {/* Account security info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Account Protection</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Rate limiting info */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="text-green-400 text-2xl mb-2">🚦</div>
            <h3 className="text-white font-medium">Rate Limiting</h3>
            <p className="text-gray-400 text-sm mt-1">
              Login attempts are limited to 10 per 15 minutes to prevent brute-force attacks.
            </p>
          </div>

          {/* JWT security info */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="text-purple-400 text-2xl mb-2">🎫</div>
            <h3 className="text-white font-medium">Secure Tokens</h3>
            <p className="text-gray-400 text-sm mt-1">
              Your session uses JWT tokens. Log out to invalidate your current session.
            </p>
          </div>

          {/* Encrypted passwords */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="text-blue-400 text-2xl mb-2">🔐</div>
            <h3 className="text-white font-medium">Encrypted Password</h3>
            <p className="text-gray-400 text-sm mt-1">
              Your password is hashed with bcrypt before storage. It is never stored in plain text.
            </p>
          </div>

          {/* HTTPS info */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="text-yellow-400 text-2xl mb-2">🛡️</div>
            <h3 className="text-white font-medium">Security Headers</h3>
            <p className="text-gray-400 text-sm mt-1">
              All API responses include Helmet.js security headers (XSS, clickjacking protection).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
