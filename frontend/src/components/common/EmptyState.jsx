// src/components/common/EmptyState.jsx
// Reusable empty state component — shown when a list has no items.
//
// Why extract this?
// Every page (Trips, Bookings, Expenses, Reviews, etc.) has the same pattern:
// a big emoji, a heading, a description, and an optional call-to-action button.
// Instead of repeating this in every file, we define it once here.
//
// Prompt 28 — Code Refactoring
//
// Usage:
//   <EmptyState
//     icon="🗺️"
//     title="No trips yet!"
//     description="Plan your first trip and start tracking bookings."
//     action={<button onClick={openModal} className="btn-primary">Plan a Trip</button>}
//   />

const EmptyState = ({ icon = '📭', title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      {/* Large decorative emoji/icon */}
      <p className="text-5xl sm:text-6xl mb-4">{icon}</p>

      {/* Heading */}
      <h2 className="text-white font-semibold text-lg sm:text-xl mb-2">
        {title}
      </h2>

      {/* Supporting description */}
      {description && (
        <p className="text-gray-400 text-sm max-w-sm mb-6">
          {description}
        </p>
      )}

      {/* Optional CTA — e.g. a button to create the first item */}
      {action && action}
    </div>
  );
};

export default EmptyState;
