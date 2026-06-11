function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Postgres unique violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'A record with this value already exists.' });
  }
  // Postgres FK violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist.' });
  }
  // Validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(422).json({ error: 'Validation failed.', details: err.errors });
  }

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
