// Safely build WHERE clauses from filter params
function buildWhere(conditions) {
  if (!conditions.length) return { clause: '', values: [] };
  return {
    clause: 'WHERE ' + conditions.map((c, i) => c.replace('?', `$${i + 1}`)).join(' AND '),
    values: [],  // caller passes actual values separately
  };
}

// Pagination helper
function pagParams(query) {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

module.exports = { buildWhere, pagParams };
