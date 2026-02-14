export function parseListQuery(query) {
  // Why: Enforce sane bounds to protect DB from unbounded list queries.
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 10)));
  const skip = (page - 1) * limit;
  // Behavior: Default sort keeps newest records first for admin and user list screens.
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const search = String(query.search || '').trim();
  return { page, limit, skip, sort: { [sortBy]: sortOrder }, search };
}
