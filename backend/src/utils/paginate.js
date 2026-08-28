// src/utils/paginate.js
// Reusable pagination helper.
// Instead of fetching ALL records and slicing in JS (very inefficient),
// we use Prisma's `skip` and `take` to let the DATABASE do the limiting.
//
// Usage:
//   const { data, meta } = await paginate(prisma.hotel, where, orderBy, page, limit);

/**
 * Paginate any Prisma model.
 * @param {object} model      - e.g. prisma.hotel, prisma.trip
 * @param {object} where      - Prisma where clause (filters)
 * @param {object} orderBy    - Prisma orderBy clause
 * @param {number} page       - current page (1-indexed)
 * @param {number} limit      - items per page (default 10)
 * @param {object} include    - optional Prisma include (relations)
 * @param {object} select     - optional Prisma select (specific fields)
 * @returns {{ data, meta }} - data = array of items, meta = pagination info
 */
const paginate = async (model, where = {}, orderBy = {}, page = 1, limit = 10, include = undefined, select = undefined) => {
  // Clamp values — page must be >= 1, limit between 1 and 100
  const currentPage  = Math.max(1, parseInt(page)  || 1);
  const itemsPerPage = Math.min(100, Math.max(1, parseInt(limit) || 10));

  // `skip` = how many records to jump over
  // Example: page 3, limit 10 → skip 20 → records 21–30
  const skip = (currentPage - 1) * itemsPerPage;

  // Run both queries in parallel: fetch data + count total
  const queryOptions = { where, orderBy, skip, take: itemsPerPage };
  if (include) queryOptions.include = include;
  if (select)  queryOptions.select  = select;

  const [data, totalCount] = await Promise.all([
    model.findMany(queryOptions),
    model.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return {
    data,
    meta: {
      page:        currentPage,
      limit:       itemsPerPage,
      totalCount,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
  };
};

module.exports = paginate;
