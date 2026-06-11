function ok(res, data, statusCode = 200) {
  return res.status(statusCode).json(data);
}

function created(res, data) {
  return ok(res, data, 201);
}

function noContent(res) {
  return res.status(204).send();
}

function paginate(res, { data, total, page, limit }) {
  return res.json({
    data,
    meta: {
      total,
      page:      parseInt(page)  || 1,
      limit:     parseInt(limit) || 20,
      totalPages: Math.ceil(total / (parseInt(limit) || 20)),
    },
  });
}

module.exports = { ok, created, noContent, paginate };
