// src/pages/ExpenseTrackerPage.jsx
// The Expense Tracker page — lets users:
//   1. Pick a trip from their trips list
//   2. View all expenses for that trip (with filters)
//   3. Add / Edit / Delete expenses
//   4. See a visual budget breakdown by category (pure CSS bar chart)
//   5. Track remaining budget vs total spent

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getMyTrips } from '../services/trip.service';
import {
  getExpenses,
  getExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../services/expense.service';

// ── Constants ─────────────────────────────────────────────────────────────────

// Must match the ExpenseCategory enum in schema.prisma
const CATEGORIES = ['FOOD', 'TRANSPORT', 'ACCOMMODATION', 'ACTIVITIES', 'SHOPPING', 'OTHER'];

// Visual config for each category (emoji, colour, label)
const CATEGORY_CONFIG = {
  FOOD:          { emoji: '🍔', label: 'Food & Dining',    color: 'bg-orange-500',  text: 'text-orange-400',  border: 'border-orange-500/40' },
  TRANSPORT:     { emoji: '🚗', label: 'Transport',         color: 'bg-blue-500',    text: 'text-blue-400',    border: 'border-blue-500/40' },
  ACCOMMODATION: { emoji: '🏨', label: 'Accommodation',     color: 'bg-purple-500',  text: 'text-purple-400',  border: 'border-purple-500/40' },
  ACTIVITIES:    { emoji: '🎯', label: 'Activities',         color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  SHOPPING:      { emoji: '🛍️', label: 'Shopping',          color: 'bg-pink-500',    text: 'text-pink-400',    border: 'border-pink-500/40' },
  OTHER:         { emoji: '📦', label: 'Other',              color: 'bg-gray-500',    text: 'text-gray-400',    border: 'border-gray-500/40' },
};

// ── Helper: format currency ───────────────────────────────────────────────────
const fmt = (n) => {
  if (!n && n !== 0) return '₹0';
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
};

// ── Helper: format date for display ──────────────────────────────────────────
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Helper: format date for <input type="date"> ───────────────────────────────
const toInputDate = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');

// ── Sub-component: Budget Progress Bar ────────────────────────────────────────
// Shows overall spent vs budget as a colour-coded bar.
const BudgetBar = ({ spent, budget }) => {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const over = spent > budget && budget > 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className={over ? 'text-red-400 font-semibold' : 'text-gray-400'}>
          {over ? '⚠️ Over budget!' : `${fmt(spent)} spent`}
        </span>
        <span className="text-gray-500">Budget: {fmt(budget)}</span>
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span>₹0</span>
        <span>{fmt(budget)}</span>
      </div>
    </div>
  );
};

// ── Sub-component: Category Bar Chart ────────────────────────────────────────
// Displays a horizontal bar for each expense category.
const CategoryChart = ({ summary, total }) => {
  if (!summary || summary.length === 0) return null;

  return (
    <div className="space-y-3">
      {summary.map(({ category, _sum }) => {
        const amount = _sum?.amount || 0;
        const pct = total > 0 ? (amount / total) * 100 : 0;
        const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.OTHER;
        return (
          <div key={category}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-300 flex items-center gap-2">
                <span>{cfg.emoji}</span>
                {cfg.label}
              </span>
              <span className={`text-sm font-semibold ${cfg.text}`}>{fmt(amount)}</span>
            </div>
            <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${cfg.color} transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Sub-component: Expense Form (Add / Edit) ─────────────────────────────────
const ExpenseForm = ({ tripId, expense, onSaved, onCancel }) => {
  // If "expense" is provided, we're editing; otherwise, we're adding.
  const isEdit = !!expense;

  const [form, setForm] = useState({
    title:    expense?.title    || '',
    amount:   expense?.amount   || '',
    category: expense?.category || 'FOOD',
    date:     toInputDate(expense?.date) || toInputDate(new Date()),
    notes:    expense?.notes    || '',
  });
  const [loading, setLoading] = useState(false);

  // Update a single field in the form state
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) {
      toast.error('Title and amount are required.');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        // Update existing expense via PUT /api/expenses/:id
        await updateExpense(expense.id, form);
        toast.success('Expense updated!');
      } else {
        // Create new expense via POST /api/trips/:tripId/expenses
        await createExpense(tripId, form);
        toast.success('Expense added!');
      }
      onSaved(); // Refresh the list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Expense Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. Dinner at Taj Restaurant"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
          required
        />
      </div>

      {/* Amount + Category (side by side on wider screens) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Amount (₹) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="e.g. 1500"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Category *</label>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_CONFIG[cat].emoji} {CATEGORY_CONFIG[cat].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Date</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Notes (optional)</label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Any extra details..."
          rows={2}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition resize-none"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition"
        >
          {loading ? 'Saving...' : isEdit ? 'Update Expense' : 'Add Expense'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2.5 rounded-xl transition border border-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// ── Sub-component: Expense Row Card ──────────────────────────────────────────
const ExpenseCard = ({ expense, onEdit, onDelete }) => {
  const cfg = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.OTHER;

  return (
    <div className={`flex items-center gap-4 p-4 bg-gray-900 border ${cfg.border} rounded-2xl hover:border-opacity-70 transition group`}>
      {/* Category emoji badge */}
      <div className={`w-11 h-11 rounded-xl ${cfg.color} bg-opacity-20 flex items-center justify-center text-xl shrink-0`}>
        {cfg.emoji}
      </div>

      {/* Title + date */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold truncate">{expense.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color} bg-opacity-20 ${cfg.text} font-medium`}>
            {cfg.label}
          </span>
          <span className="text-xs text-gray-500">{fmtDate(expense.date)}</span>
        </div>
        {expense.notes && (
          <p className="text-xs text-gray-500 mt-1 truncate">{expense.notes}</p>
        )}
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className={`text-lg font-bold ${cfg.text}`}>{fmt(expense.amount)}</p>
      </div>

      {/* Edit / Delete buttons (show on hover) */}
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition shrink-0">
        <button
          onClick={() => onEdit(expense)}
          className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition text-sm"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(expense)}
          className="w-8 h-8 bg-gray-800 hover:bg-red-900/60 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 transition text-sm"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

// ── Main Page Component ───────────────────────────────────────────────────────
const ExpenseTrackerPage = () => {
  const [trips,         setTrips]         = useState([]);
  const [selectedTrip,  setSelectedTrip]  = useState(null);  // currently chosen trip
  const [expenses,      setExpenses]      = useState([]);    // all expenses for selected trip
  const [summary,       setSummary]       = useState([]);    // grouped-by-category totals
  const [filterCat,     setFilterCat]     = useState('ALL'); // category filter
  const [showForm,      setShowForm]      = useState(false); // add form visible?
  const [editingExp,    setEditingExp]    = useState(null);  // expense being edited
  const [loadingData,   setLoadingData]   = useState(false);
  const [loadingTrips,  setLoadingTrips]  = useState(true);

  // ── Load user's trips on mount ─────────────────────────────────────────────
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await getMyTrips();
        const tripList = res.data?.data || [];
        setTrips(tripList);
        // Auto-select first trip if available
        if (tripList.length > 0) setSelectedTrip(tripList[0]);
      } catch {
        toast.error('Could not load your trips.');
      } finally {
        setLoadingTrips(false);
      }
    };
    fetchTrips();
  }, []);

  // ── Load expenses + summary whenever a trip is selected ───────────────────
  useEffect(() => {
    if (!selectedTrip) return;
    loadExpenses();
  }, [selectedTrip]);

  // Fetches both the expense list and the category summary
  const loadExpenses = async () => {
    if (!selectedTrip) return;
    setLoadingData(true);
    try {
      const [expRes, sumRes] = await Promise.all([
        getExpenses(selectedTrip.id),
        getExpenseSummary(selectedTrip.id),
      ]);
      setExpenses(expRes.data?.data || []);
      setSummary(sumRes.data?.data || []);
    } catch {
      toast.error('Could not load expenses.');
    } finally {
      setLoadingData(false);
    }
  };

  // ── Delete handler ─────────────────────────────────────────────────────────
  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete "${expense.title}"?`)) return;
    try {
      await deleteExpense(expense.id);
      toast.success('Expense deleted.');
      loadExpenses(); // Refresh list and summary
    } catch {
      toast.error('Could not delete expense.');
    }
  };

  // ── Computed totals ────────────────────────────────────────────────────────
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const tripBudget = selectedTrip?.budget || 0;
  const remaining  = tripBudget - totalSpent;

  // Filtered expense list (by category chip)
  const filtered = filterCat === 'ALL'
    ? expenses
    : expenses.filter((e) => e.category === filterCat);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loadingTrips) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Loading your trips...</p>
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <p className="text-5xl mb-4">✈️</p>
        <h2 className="text-2xl font-bold text-white mb-2">No Trips Yet</h2>
        <p className="text-gray-400 mb-6">Create a trip first to start tracking expenses.</p>
        <a href="/trips" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-semibold transition">
          Create a Trip →
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            💸 Expense Tracker
          </h1>
          <p className="text-gray-400 text-sm mt-1">Track every rupee you spend on your trips</p>
        </div>

        {/* Add Expense button (shown when a trip is selected) */}
        {selectedTrip && (
          <button
            onClick={() => { setEditingExp(null); setShowForm(true); }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-semibold transition flex items-center gap-2 text-sm"
          >
            <span className="text-base">+</span> Add Expense
          </button>
        )}
      </div>

      {/* ── Trip Selector ────────────────────────────────────────────────── */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4">
        <label className="block text-sm text-gray-400 mb-2 font-medium">Select Trip</label>
        <div className="flex flex-wrap gap-2">
          {trips.map((trip) => (
            <button
              key={trip.id}
              onClick={() => { setSelectedTrip(trip); setFilterCat('ALL'); setShowForm(false); setEditingExp(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${
                selectedTrip?.id === trip.id
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
              }`}
            >
              ✈️ {trip.title}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content (two-column layout on large screens) ─────────────── */}
      {selectedTrip && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Stats + Chart ───────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Budget Overview Card */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-5">
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                📊 Budget Overview
              </h2>

              {/* Budget bar */}
              <BudgetBar spent={totalSpent} budget={tripBudget} />

              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Total spent */}
                <div className="bg-gray-800/60 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Total Spent</p>
                  <p className="text-lg font-bold text-emerald-400">{fmt(totalSpent)}</p>
                </div>
                {/* Remaining */}
                <div className="bg-gray-800/60 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Remaining</p>
                  <p className={`text-lg font-bold ${remaining < 0 ? 'text-red-400' : 'text-white'}`}>
                    {remaining < 0 ? `-${fmt(Math.abs(remaining))}` : fmt(remaining)}
                  </p>
                </div>
                {/* Trip budget */}
                <div className="bg-gray-800/60 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Trip Budget</p>
                  <p className="text-lg font-bold text-gray-200">{fmt(tripBudget)}</p>
                </div>
                {/* Expense count */}
                <div className="bg-gray-800/60 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Entries</p>
                  <p className="text-lg font-bold text-gray-200">{expenses.length}</p>
                </div>
              </div>
            </div>

            {/* Category breakdown chart */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                🎯 Spending by Category
              </h2>
              {summary.length > 0 ? (
                <CategoryChart summary={summary} total={totalSpent} />
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No expenses yet.</p>
              )}
            </div>

            {/* Quick Tips Card */}
            <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/20 border border-emerald-800/40 rounded-2xl p-5">
              <h3 className="text-emerald-400 font-bold text-sm mb-3">💡 Budget Tips</h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>• Log expenses daily to stay accurate</li>
                <li>• Use categories to spot overspending</li>
                <li>• Keep receipts for large purchases</li>
                <li>• Set aside 10% for emergencies</li>
              </ul>
            </div>
          </div>

          {/* ── Right: Expense List + Form ───────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Add / Edit Form (slide-in panel) */}
            {(showForm || editingExp) && (
              <div className="bg-gray-900/80 border border-emerald-800/40 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  {editingExp ? '✏️ Edit Expense' : '➕ Add New Expense'}
                </h3>
                <ExpenseForm
                  tripId={selectedTrip.id}
                  expense={editingExp}
                  onSaved={() => {
                    setShowForm(false);
                    setEditingExp(null);
                    loadExpenses(); // Refresh after save
                  }}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingExp(null);
                  }}
                />
              </div>
            )}

            {/* Category filter chips */}
            <div className="flex flex-wrap gap-2">
              {/* "All" chip */}
              <button
                onClick={() => setFilterCat('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  filterCat === 'ALL'
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
                }`}
              >
                All ({expenses.length})
              </button>

              {/* One chip per category that has expenses */}
              {CATEGORIES.filter((cat) => expenses.some((e) => e.category === cat)).map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const count = expenses.filter((e) => e.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCat(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                      filterCat === cat
                        ? `${cfg.color} border-transparent text-white`
                        : `bg-gray-800 ${cfg.border} ${cfg.text} hover:bg-gray-700`
                    }`}
                  >
                    {cfg.emoji} {cfg.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Expense list */}
            {loadingData ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-10 text-center">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-gray-400">
                  {expenses.length === 0
                    ? 'No expenses added yet. Start tracking your spending!'
                    : 'No expenses in this category.'}
                </p>
                {expenses.length === 0 && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-semibold transition"
                  >
                    Add First Expense
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Total for current filter */}
                <div className="flex items-center justify-between px-1">
                  <p className="text-sm text-gray-400">
                    Showing <span className="text-white font-semibold">{filtered.length}</span> expense{filtered.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-400">
                    Total: <span className="text-emerald-400 font-bold">
                      {fmt(filtered.reduce((s, e) => s + e.amount, 0))}
                    </span>
                  </p>
                </div>

                {/* Expense cards */}
                {filtered.map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onEdit={(exp) => { setEditingExp(exp); setShowForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTrackerPage;
