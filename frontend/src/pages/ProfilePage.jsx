// src/pages/ProfilePage.jsx
// Full user profile page — view info, update name, change password, upload avatar.

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword, uploadAvatar } from '../services/user.service';
import { formatDate } from '../utils/formatters';

// ─── Small reusable section card ─────────────────────────────────────────────
const SectionCard = ({ title, children }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
    <h3 className="text-white font-semibold text-base mb-5">{title}</h3>
    {children}
  </div>
);

const ProfilePage = () => {
  const { user, login } = useAuth();

  // ── Name update state ───────────────────────────────────────────────────────
  const [name, setName]           = useState(user?.name || '');
  const [nameLoading, setNameLoading] = useState(false);

  // ── Password form state ─────────────────────────────────────────────────────
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passLoading, setPassLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  // ── Avatar state ────────────────────────────────────────────────────────────
  const [avatarPreview, setAvatarPreview] = useState(null); // local preview URL
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef(null); // reference to the hidden file input

  // ─── Handlers ──────────────────────────────────────────────────────────────

  /** Sync auth context + localStorage after any profile update */
  const syncUser = (updatedUser) => {
    const token = localStorage.getItem('token');
    login(token, updatedUser);
  };

  /** Update display name */
  const handleNameUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name cannot be empty.'); return; }
    setNameLoading(true);
    try {
      const res = await updateProfile({ name });
      syncUser(res.data.data);
      toast.success('Name updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setNameLoading(false);
    }
  };

  /** Change password */
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setPassLoading(true);
    try {
      await changePassword({
        currentPassword: passForm.currentPassword,
        newPassword:     passForm.newPassword,
      });
      toast.success('Password changed successfully!');
      // Clear the form after success
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed.');
    } finally {
      setPassLoading(false);
    }
  };

  /**
   * When the user picks a file:
   * 1. Show a local preview instantly (good UX — no waiting for upload).
   * 2. Upload to Cloudinary and update the user's avatar in the DB.
   */
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show a local preview while uploading
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarLoading(true);
    try {
      const res = await uploadAvatar(file);
      syncUser(res.data.data); // update context with the new Cloudinary URL
      toast.success('Avatar updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Avatar upload failed.');
      setAvatarPreview(null); // revert preview on failure
    } finally {
      setAvatarLoading(false);
    }
  };

  // The avatar to display: local preview > Cloudinary URL > first letter fallback
  const avatarSrc = avatarPreview || user?.avatar;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ── Page heading ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account information and security.</p>
      </div>

      {/* ── Identity card ────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-5">
          {/* Avatar with click-to-upload */}
          <div className="relative flex-shrink-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-700"
              />
            ) : (
              // Fallback: first letter of name in a coloured circle
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white border-2 border-gray-700">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Upload button overlaid on avatar */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center border-2 border-gray-900 transition-colors"
              title="Change avatar"
            >
              {avatarLoading
                ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <span className="text-white text-xs">✏️</span>
              }
            </button>

            {/* Hidden file input — triggered by the button above */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Name, email, role */}
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold text-lg truncate">{user?.name}</h2>
            <p className="text-gray-400 text-sm truncate">{user?.email}</p>
            <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              user?.role === 'ADMIN'
                ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                : 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Account info rows */}
        <div className="mt-5 pt-5 border-t border-gray-800 space-y-3">
          {[
            { label: 'Email',        value: user?.email },
            { label: 'Role',         value: user?.role },
            { label: 'Member since', value: user?.createdAt ? formatDate(user.createdAt) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="text-gray-200">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Update name ───────────────────────────────────────────────────── */}
      <SectionCard title="Update Display Name">
        <form onSubmit={handleNameUpdate} className="flex flex-col sm:flex-row gap-3">
          <input
            id="profile-name"
            type="text"
            className="input flex-1"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button
            id="profile-name-save"
            type="submit"
            disabled={nameLoading}
            className="btn-primary whitespace-nowrap"
          >
            {nameLoading ? 'Saving...' : 'Save Name'}
          </button>
        </form>
      </SectionCard>

      {/* ── Change password ───────────────────────────────────────────────── */}
      <SectionCard title="Change Password">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* Current password */}
          <div>
            <label className="label">Current Password</label>
            <input
              id="profile-current-password"
              type={showPasswords ? 'text' : 'password'}
              className="input"
              placeholder="Enter current password"
              value={passForm.currentPassword}
              onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
              required
            />
          </div>

          {/* New password */}
          <div>
            <label className="label">New Password</label>
            <input
              id="profile-new-password"
              type={showPasswords ? 'text' : 'password'}
              className="input"
              placeholder="Min 6 characters"
              value={passForm.newPassword}
              onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
              required
              minLength={6}
            />
          </div>

          {/* Confirm new password */}
          <div>
            <label className="label">Confirm New Password</label>
            <input
              id="profile-confirm-password"
              type={showPasswords ? 'text' : 'password'}
              className="input"
              placeholder="Re-enter new password"
              value={passForm.confirmPassword}
              onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            {/* Show/hide toggle */}
            <label className="flex items-center gap-2 text-gray-400 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={() => setShowPasswords(!showPasswords)}
                className="accent-blue-500"
              />
              Show passwords
            </label>

            <button
              id="profile-password-save"
              type="submit"
              disabled={passLoading}
              className="btn-primary"
            >
              {passLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Security info ─────────────────────────────────────────────────── */}
      <SectionCard title="Security">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔐</span>
          <div>
            <p className="text-gray-200 text-sm font-medium">JWT-based Session</p>
            <p className="text-gray-500 text-xs mt-1">
              Your session is secured with a signed JWT token that expires in 7 days.
              Log in again on any device to get a fresh token.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default ProfilePage;
