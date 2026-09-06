// src/pages/AnalyticsPage.jsx
// Personal Analytics Dashboard — shows the logged-in user's travel stats,
// spending patterns, trip breakdown, and budget performance.
// Uses recharts for interactive charts.

import { useState, useEffect }    from 'react';
import { Link }                    from 'react-router-dom';
import toast                       from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';
import { getFullAnalytics }        from '../services/analytics.service';

// ── Constants ──────────────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  FOOD:          '#f59e0b',
  TRANSPORT:     '#3b82f6',
  ACCOMMODATION: '#8b5cf6',
  ACTIVITIES:    '#10b981',
  SHOPPING:      '#ec4899',
  OTHER:         '#6b7280',
};

const STATUS_COLORS = {
  PLANNED:   '#3b82f6',
  ONGOING:   '#10b981',
  COMPLETED: '#6b7280',
  CANCELLED: '#ef4444',
};

const STATUS_ICONS = { PLANNED: '📅', ONGOING: '✈️', COMPLETED: '✅', CANCELLED: '❌' };

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtCur = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// Recharts custom tooltip
const ChartTooltip = ({ active, payload, label, prefix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-gray-400 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#60a5fa' }} className="font-semibold">
          {prefix}{p.name}: {prefix === '₹' ? fmtCur(p.value).replace('₹','') : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const AnalyticsPage = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getFullAnalytics();
        setData(res.data.data);
      } catch {
        toast.error('Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 bg-gray-900 rounded-xl w-48 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl h-24 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl h-64 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const { summary, spendingByCategory, monthlyTrend, tripAnalytics, budgetVsActual } = data || {};
  const s = summary || {};

  // Pie chart needs a "name" field
  const pieData = (spendingByCategory || []).map(c => ({
    name:  c.category,
    value: c.amount,
    pct:   c.percentage,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black text-white">📊 My Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Your personal travel insights and spending patterns</p>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total Trips',     value: s.totalTrips    ?? 0,            icon: '🧳', color: 'border-blue-500/30' },
          { label: 'Completed',       value: s.completedTrips ?? 0,           icon: '✅', color: 'border-green-500/30' },
          { label: 'Bookings',        value: s.totalBookings ?? 0,            icon: '🎫', color: 'border-yellow-500/30' },
          { label: 'Total Spent',     value: fmtCur(s.totalSpent),            icon: '💸', color: 'border-red-500/30' },
          { label: 'Reviews',         value: s.reviewCount   ?? 0,            icon: '⭐', color: 'border-orange-500/30' },
          { label: 'Wishlist',        value: s.wishlistCount ?? 0,            icon: '🌟', color: 'border-purple-500/30' },
          { label: 'Journal Entries', value: s.journalCount  ?? 0,            icon: '📔', color: 'border-indigo-500/30' },
        ].map(card => (
          <div key={card.label} className={`bg-gray-900 border rounded-2xl p-4 ${card.color}`}>
            <p className="text-xl mb-1">{card.icon}</p>
            <p className="text-white font-black text-lg leading-none">{card.value}</p>
            <p className="text-gray-500 text-[11px] mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* ── Row 1: Spending charts ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Spending by category — Pie chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-bold mb-4">💸 Spending by Category</h2>
          {pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-600">
              <p className="text-4xl mb-2">📂</p>
              <p className="text-sm">No expenses logged yet.</p>
              <Link to="/expenses" className="text-blue-400 text-xs mt-2 hover:text-blue-300">Add expenses →</Link>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={CATEGORY_COLORS[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip prefix="₹" />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
                {spendingByCategory.map(c => (
                  <div key={c.category} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: CATEGORY_COLORS[c.category] || '#6b7280' }} />
                    <span className="text-gray-400 text-xs truncate">{c.category}</span>
                    <span className="text-gray-600 text-xs ml-auto">{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Monthly spending trend — Area chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-bold mb-4">📈 Monthly Spending Trend</h2>
          {(monthlyTrend || []).every(m => m.amount === 0) ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-600">
              <p className="text-4xl mb-2">📉</p>
              <p className="text-sm">No spending data in the last 12 months.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyTrend} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false}
                       interval={2} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false}
                       tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip prefix="₹" />} />
                <Area type="monotone" dataKey="amount" name="Spent" stroke="#3b82f6"
                      strokeWidth={2} fill="url(#spendGrad)" dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Row 2: Trip analytics ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Trip status breakdown — Bar chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-bold mb-4">🧳 Trips by Status</h2>
          {(tripAnalytics?.byStatus || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-600">
              <p className="text-4xl mb-2">🗺️</p>
              <p className="text-sm">No trips yet.</p>
              <Link to="/trips" className="text-blue-400 text-xs mt-2 hover:text-blue-300">Plan your first trip →</Link>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tripAnalytics.byStatus} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="status" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Trips" radius={[6, 6, 0, 0]}>
                  {tripAnalytics.byStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top destinations */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-bold mb-4">📍 Top Destinations</h2>
          {(tripAnalytics?.destinations || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-600">
              <p className="text-4xl mb-2">🌍</p>
              <p className="text-sm">No destinations yet.</p>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {tripAnalytics.destinations.map((d, i) => {
                const maxCount = tripAnalytics.destinations[0]?.count || 1;
                const pct      = Math.round((d.count / maxCount) * 100);
                const medals   = ['🥇', '🥈', '🥉'];
                return (
                  <div key={d.destination}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{medals[i] || '📍'}</span>
                        <span className="text-white text-sm font-medium truncate max-w-[200px]">{d.destination}</span>
                      </div>
                      <span className="text-gray-500 text-xs shrink-0">{d.count} trip{d.count > 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all"
                           style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Budget vs actual ───────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-white font-bold mb-5">💰 Budget vs Actual Spending</h2>
        {(budgetVsActual || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-600">
            <p className="text-4xl mb-2">📊</p>
            <p className="text-sm">No trips with expenses yet.</p>
          </div>
        ) : (
          <>
            {/* Bar chart */}
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={budgetVsActual}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                barCategoryGap="25%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="destination" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false}
                       tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip prefix="₹" />} />
                <Bar dataKey="budget" name="Budget"  fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual"  fill="#10b981" radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
              </BarChart>
            </ResponsiveContainer>

            {/* Detail rows */}
            <div className="mt-4 space-y-2">
              {budgetVsActual.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{t.title}</p>
                    <p className="text-gray-500 text-xs">{t.destination} · {t.status}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">
                      Budget: <span className="text-blue-400 font-semibold">{fmtCur(t.budget)}</span>
                      {' '}&nbsp;Actual: <span className={`font-semibold ${t.overBudget ? 'text-red-400' : 'text-green-400'}`}>{fmtCur(t.actual)}</span>
                    </p>
                    {t.budget > 0 && (
                      <div className="mt-1 h-1.5 bg-gray-700 rounded-full w-32 overflow-hidden ml-auto">
                        <div
                          className={`h-full rounded-full transition-all ${t.overBudget ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(t.pct, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {t.overBudget && (
                    <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full shrink-0">
                      ⚠️ Over budget
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Upcoming trips ────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-white font-bold mb-4">🗓️ Upcoming Trips</h2>
        {(tripAnalytics?.upcoming || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-gray-600">
            <p className="text-sm">No upcoming trips planned.</p>
            <Link to="/trips" className="text-blue-400 text-xs mt-1 hover:text-blue-300">Plan a trip →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tripAnalytics.upcoming.map(t => (
              <Link key={t.id} to={`/trips/${t.id}`}
                className="block bg-gray-800 border border-gray-700 hover:border-blue-500/40
                           rounded-xl p-4 transition-all group">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-white font-semibold text-sm truncate group-hover:text-blue-300 transition-colors">{t.title}</p>
                  <span className="text-xs">{STATUS_ICONS[t.status]}</span>
                </div>
                <p className="text-gray-400 text-xs">📍 {t.destination}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {fmtDate(t.startDate)} → {fmtDate(t.endDate)}
                </p>
                {t.budget > 0 && (
                  <p className="text-blue-400 text-xs font-semibold mt-1">
                    Budget: {fmtCur(t.budget)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
