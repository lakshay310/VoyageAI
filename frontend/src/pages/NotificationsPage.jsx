// src/pages/NotificationsPage.jsx
// Full notifications page showing all notifications with filters,
// mark as read, and delete actions.

import useNotifications from '../hooks/useNotifications';
import { useNavigate }  from 'react-router-dom';
import toast            from 'react-hot-toast';

// Maps notification type to icon + colour
const TYPE_META = {
  TRIP_CREATED:      { icon: '🧳', color: 'text-blue-400',    bg: 'bg-blue-500/10'   },
  BOOKING_CONFIRMED: { icon: '🎫', color: 'text-green-400',   bg: 'bg-green-500/10'  },
  EXPENSE_ADDED:     { icon: '💰', color: 'text-yellow-400',  bg: 'bg-yellow-500/10' },
  TRIP_REMINDER:     { icon: '⏰', color: 'text-orange-400',  bg: 'bg-orange-500/10' },
  WELCOME:           { icon: '👋', color: 'text-purple-400',  bg: 'bg-purple-500/10' },
  SUCCESS:           { icon: '✅', color: 'text-emerald-400', bg: 'bg-emerald-500/10'},
  WARNING:           { icon: '⚠️', color: 'text-amber-400',   bg: 'bg-amber-500/10'  },
  INFO:              { icon: '🔔', color: 'text-gray-400',    bg: 'bg-gray-500/10'   },
};

/** Format a date like "12 Aug, 10:30 PM" */
const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markRead, markAll, remove, clearAll } =
    useNotifications();

  const handleMarkAll = async () => {
    await markAll();
    toast.success('All notifications marked as read');
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications? This cannot be undone.')) return;
    await clearAll();
    toast.success('All notifications cleared');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Notifications</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up! ✅'}
          </p>
        </div>

        {/* Action buttons — only show if there are notifications */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                id="mark-all-read-btn"
                onClick={handleMarkAll}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs
                           font-semibold transition-colors"
              >
                ✓ Mark all read
              </button>
            )}
            <button
              id="clear-all-btn"
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-red-900/40 border border-gray-700
                         hover:border-red-500/40 text-gray-400 hover:text-red-400 text-xs
                         font-semibold transition-all"
            >
              🗑 Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Notification List ────────────────────────────────────────────── */}
      {loading ? (
        // Loading skeleton cards
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 rounded-2xl p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        // Empty state
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔕</div>
          <h3 className="text-white font-bold text-lg mb-1">No notifications yet</h3>
          <p className="text-gray-500 text-sm">
            Create a trip or make a booking to receive notifications here.
          </p>
          <button
            onClick={() => navigate('/trips')}
            className="mt-6 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl
                       text-sm font-semibold transition-colors"
          >
            Plan a Trip →
          </button>
        </div>
      ) : (
        // Notification cards
        <ul className="space-y-3">
          {notifications.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.INFO;
            return (
              <li
                key={n.id}
                className={`relative bg-gray-900 rounded-2xl border transition-all
                  ${!n.isRead
                    ? 'border-blue-500/30 shadow-lg shadow-blue-500/5'
                    : 'border-gray-800'}`}
              >
                <div
                  className="flex items-start gap-4 p-4 cursor-pointer"
                  onClick={() => {
                    if (!n.isRead) markRead(n.id);
                    if (n.link) navigate(n.link);
                  }}
                >
                  {/* Type icon bubble */}
                  <div className={`${meta.bg} ${meta.color} p-2.5 rounded-xl text-xl shrink-0`}>
                    {meta.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold text-sm ${n.isRead ? 'text-gray-400' : 'text-white'}`}>
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">{n.message}</p>
                    <p className="text-gray-600 text-[11px] mt-2">{formatDate(n.createdAt)}</p>
                  </div>

                  {/* Delete button */}
                  <button
                    id={`delete-notif-${n.id}`}
                    onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10
                               transition-all shrink-0"
                    title="Delete notification"
                  >
                    ✕
                  </button>
                </div>

                {/* Unread left border accent */}
                {!n.isRead && (
                  <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-blue-500 rounded-r" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
