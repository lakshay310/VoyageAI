// src/pages/AdminPage.jsx
// Admin Dashboard — only accessible by users with role = ADMIN.
// Tabs: Overview | Users
//
// IMPORTANT React rule: ALL hooks must be called BEFORE any conditional return.
// The access guard (role check) runs AFTER hooks are declared.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate }                       from 'react-router-dom';
import toast                                 from 'react-hot-toast';
import { useAuth }                           from '../context/AuthContext';
import Pagination                            from '../components/common/Pagination';
import {
  getAdminOverview, getAdminUsers, updateUserRole, deleteUser,
} from '../services/admin.service';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt    = (n) => (n ?? 0).toLocaleString('en-IN');
const fmtCur = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ── KPI card ──────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, borderColor }) => (
  <div className={`bg-gray-900 border rounded-2xl p-5 flex items-center gap-4 ${borderColor}`}>
    <span className="text-3xl">{icon}</span>
    <div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
    </div>
  </div>
);

// ── Booking status badge ──────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    CONFIRMED: 'bg-green-500/10 text-green-300 border-green-500/30',
    PENDING:   'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/30',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${map[status] || 'bg-gray-700 text-gray-400 border-gray-600'}`}>
      {status}
    </span>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const AdminPage = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  // ── ALL hooks BEFORE any conditional return (React rule) ──────────────────
  const [tab,         setTab]       = useState('overview');
  const [overview,    setOverview]  = useState(null);
  const [users,       setUsers]     = useState({ data: [], meta: null });
  const [loading,     setLoading]   = useState(true);
  const [userPage,    setUserPage]  = useState(1);
  const [roleLoading, setRoleLoad]  = useState(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminOverview();
      setOverview(res.data.data);
    } catch {
      toast.error('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getAdminUsers({ page, limit: 10 });
      setUsers(res.data.data);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'overview') loadOverview();
    if (tab === 'users')    loadUsers(userPage);
  }, [tab, userPage, loadOverview, loadUsers]);

  // ── Access guard (AFTER hooks) ────────────────────────────────────────────
  if (user && user.role !== 'ADMIN') {
    return (
      <div className="max-w-lg mx-auto mt-24 text-center px-4">
        <p className="text-6xl mb-4">🚫</p>
        <h1 className="text-2xl font-black text-white mb-2">Access Denied</h1>
        <p className="text-gray-400 text-sm mb-6">You need ADMIN privileges to view this page.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">Back to Dashboard</button>
      </div>
    );
  }

  // ── Role toggle ───────────────────────────────────────────────────────────
  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return;
    try {
      setRoleLoad(userId);
      await updateUserRole(userId, newRole);
      toast.success(`Role updated to ${newRole}`);
      loadUsers(userPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role.');
    } finally {
      setRoleLoad(null);
    }
  };

  // ── Delete user ───────────────────────────────────────────────────────────
  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}"?\n\nThis will permanently remove their account and all data.`)) return;
    try {
      await deleteUser(userId);
      toast.success(`${name} deleted.`);
      const newPage = users.data.length === 1 && userPage > 1 ? userPage - 1 : userPage;
      setUserPage(newPage);
      if (newPage === userPage) loadUsers(userPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const s = overview?.stats;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-xl">🛡️</div>
        <div>
          <h1 className="text-2xl font-black text-white">Admin Dashboard</h1>
          <p className="text-gray-500 text-xs">Platform management • ADMIN access only</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {[{ key: 'overview', label: '📊 Overview' }, { key: 'users', label: '👥 Users' }].map(t => (
          <button key={t.key} id={`admin-tab-${t.key}`} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all
              ${tab === t.key ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4,5,6].map(i => <div key={i} className="bg-gray-900 rounded-2xl h-24 animate-pulse border border-gray-800" />)}
          </div>
        ) : overview ? (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <StatCard label="Total Users"      value={fmt(s?.totalUsers)}       icon="👥" borderColor="border-blue-500/30" />
              <StatCard label="Total Trips"      value={fmt(s?.totalTrips)}        icon="🧳" borderColor="border-purple-500/30" />
              <StatCard label="Bookings"         value={fmt(s?.totalBookings)}     icon="🎫" borderColor="border-yellow-500/30" />
              <StatCard label="Confirmed"        value={fmt(s?.confirmedBookings)} icon="✅" borderColor="border-green-500/30" />
              <StatCard label="Revenue"          value={fmtCur(s?.totalRevenue)}   icon="💰" borderColor="border-emerald-500/30" />
              <StatCard label="Reviews"          value={fmt(s?.totalReviews)}      icon="⭐" borderColor="border-orange-500/30" />
            </div>

            {/* Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-4">🧳 Trips by Status</h3>
                {s?.tripsByStatus?.length === 0 && <p className="text-gray-500 text-sm">No trips yet.</p>}
                <div className="space-y-3">
                  {s?.tripsByStatus?.map(({ status, _count }) => {
                    const total = s.totalTrips || 1;
                    const pct   = Math.round((_count._all / total) * 100);
                    const colors = { PLANNED: 'bg-blue-500', ONGOING: 'bg-green-500', COMPLETED: 'bg-gray-500', CANCELLED: 'bg-red-500' };
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300">{status}</span>
                          <span className="text-gray-500">{_count._all} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${colors[status] || 'bg-gray-600'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-4">🎫 Bookings by Type</h3>
                {s?.bookingsByType?.length === 0 && <p className="text-gray-500 text-sm">No bookings yet.</p>}
                <div className="space-y-3">
                  {s?.bookingsByType?.map(({ type, _count }) => {
                    const total = s.totalBookings || 1;
                    const pct   = Math.round((_count._all / total) * 100);
                    const icons = { FLIGHT: '✈️', HOTEL: '🏨', CAR: '🚗', ACTIVITY: '🎡' };
                    return (
                      <div key={type}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300">{icons[type]} {type}</span>
                          <span className="text-gray-500">{_count._all} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent users + bookings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-4">🆕 Recent Signups</h3>
                {overview.recentUsers?.length === 0 && <p className="text-gray-500 text-sm">No users yet.</p>}
                <div className="space-y-3">
                  {overview.recentUsers?.map(u => (
                    <div key={u.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{u.name}</p>
                        <p className="text-gray-500 text-xs truncate">{u.email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${u.role === 'ADMIN' ? 'bg-red-500/10 text-red-300 border-red-500/30' : 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                          {u.role}
                        </span>
                        <p className="text-gray-600 text-[10px] mt-0.5">{fmtDate(u.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-4">🎫 Recent Bookings</h3>
                {overview.recentBookings?.length === 0 && <p className="text-gray-500 text-sm">No bookings yet.</p>}
                <div className="space-y-3">
                  {overview.recentBookings?.map(b => (
                    <div key={b.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-sm shrink-0">
                        {b.type === 'FLIGHT' ? '✈️' : b.type === 'HOTEL' ? '🏨' : '🎡'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{b.provider}</p>
                        <p className="text-gray-500 text-xs truncate">{b.user?.name} → {b.trip?.destination}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-blue-400 text-sm font-bold">{fmtCur(b.amount)}</p>
                        <StatusBadge status={b.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null
      )}

      {/* ── USERS TAB ────────────────────────────────────────────────────── */}
      {tab === 'users' && (
        loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="bg-gray-900 rounded-2xl h-16 animate-pulse border border-gray-800" />)}
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-xs mb-4">{users.meta?.totalCount ?? 0} total users on the platform</p>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_1fr_80px_90px_130px] gap-4 px-5 py-3 border-b border-gray-800 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <span>Name</span>
                <span className="hidden sm:block">Email</span>
                <span>Role</span>
                <span>Trips</span>
                <span>Actions</span>
              </div>

              {users.data?.length === 0 && <p className="text-center text-gray-500 py-10 text-sm">No users found.</p>}

              {users.data?.map(u => (
                <div key={u.id}
                  className="grid grid-cols-[1fr_1fr_80px_90px_130px] gap-4 px-5 py-3.5
                             border-b border-gray-800/50 last:border-0
                             hover:bg-gray-800/30 transition-colors items-center">

                  {/* Name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white text-sm font-medium truncate">{u.name}</span>
                    {u.id === user?.id && (
                      <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full shrink-0">you</span>
                    )}
                  </div>

                  {/* Email */}
                  <span className="hidden sm:block text-gray-400 text-xs truncate">{u.email}</span>

                  {/* Role */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit
                    ${u.role === 'ADMIN' ? 'bg-red-500/10 text-red-300 border-red-500/30' : 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                    {u.role}
                  </span>

                  {/* Trips */}
                  <span className="text-gray-500 text-xs">{u._count?.trips ?? 0} trip{u._count?.trips !== 1 ? 's' : ''}</span>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`toggle-role-${u.id}`}
                      onClick={() => handleRoleChange(u.id, u.role)}
                      disabled={roleLoading === u.id || u.id === user?.id}
                      title={u.id === user?.id ? 'Cannot change own role' : u.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all
                                 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer
                                 bg-gray-800 border-gray-700 text-gray-300 hover:border-blue-500 hover:text-blue-300"
                    >
                      {roleLoading === u.id
                        ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin inline-block" />
                        : u.role === 'ADMIN' ? '↓ User' : '↑ Admin'}
                    </button>

                    <button
                      id={`delete-user-${u.id}`}
                      onClick={() => handleDelete(u.id, u.name)}
                      disabled={u.id === user?.id}
                      title={u.id === user?.id ? 'Cannot delete own account' : `Delete ${u.name}`}
                      className="p-1.5 rounded-lg border border-transparent text-gray-600
                                 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30
                                 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination meta={users.meta} onPageChange={(p) => setUserPage(p)} />
          </>
        )
      )}
    </div>
  );
};

export default AdminPage;
