// src/components/common/PageHeader.jsx
// Reusable page header — title + subtitle + optional right-side action button.
//
// Why a shared component?
// Every page has the same header pattern: a big title, a grey subtitle,
// and sometimes an action button (like "+ New Trip"). Instead of copy-pasting
// this into every page, we extract it once here.
//
// Prompt 27 — Responsive UI / Prompt 28 — Code Refactoring
//
// Usage:
//   <PageHeader
//     title="My Trips"
//     subtitle="3 trips planned"
//     action={<button className="btn-primary">+ New Trip</button>}
//   />

const PageHeader = ({ title, subtitle, action }) => {
  return (
    // flex-wrap so the action button drops below on very small screens
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6 sm:mb-8">
      <div>
        {/* Main page title */}
        <h1 className="text-xl sm:text-2xl font-bold text-white">{title}</h1>

        {/* Subtitle / description — only rendered if provided */}
        {subtitle && (
          <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
        )}
      </div>

      {/* Optional action slot — right-aligned (e.g. a button) */}
      {action && (
        <div className="shrink-0">{action}</div>
      )}
    </div>
  );
};

export default PageHeader;
