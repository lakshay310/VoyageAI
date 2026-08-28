// src/components/common/Pagination.jsx
// Reusable pagination controls — Previous / page numbers / Next.
// Used on SearchPage and any other paginated list.

const Pagination = ({ meta, onPageChange }) => {
  if (!meta || meta.totalPages <= 1) return null;

  const { page, totalPages, totalCount, hasNextPage, hasPrevPage } = meta;

  // Build page number list: always show current ± 1, plus first and last
  const pages = new Set([1, page - 1, page, page + 1, totalPages]);
  const pageList = [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
      {/* Total count info */}
      <p className="text-xs text-gray-500">
        {totalCount} result{totalCount !== 1 ? 's' : ''} — Page {page} of {totalPages}
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        {/* Prev button */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                     disabled:opacity-30 disabled:cursor-not-allowed
                     bg-gray-900 border-gray-700 text-gray-400
                     hover:bg-gray-800 hover:text-white"
        >
          ← Prev
        </button>

        {/* Page numbers */}
        {pageList.map((p, idx) => {
          const prevPage = pageList[idx - 1];
          const showEllipsis = prevPage && p - prevPage > 1;
          return (
            <span key={p} className="flex items-center gap-1">
              {/* Ellipsis gap */}
              {showEllipsis && (
                <span className="text-gray-600 px-1 text-xs">…</span>
              )}
              <button
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all
                  ${p === page
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
              >
                {p}
              </button>
            </span>
          );
        })}

        {/* Next button */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                     disabled:opacity-30 disabled:cursor-not-allowed
                     bg-gray-900 border-gray-700 text-gray-400
                     hover:bg-gray-800 hover:text-white"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Pagination;
