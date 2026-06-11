const pool = require('../db/pool');
const { ok, created, noContent } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT b.*,
         COUNT(DISTINCT l.id) AS total_leads,
         COUNT(DISTINCT bk.id) AS total_bookings
       FROM brokers b
       LEFT JOIN leads l  ON l.source = 'broker'
       LEFT JOIN bookings bk ON bk.id IS NOT NULL
       WHERE b.is_active = true
       GROUP BY b.id
       ORDER BY b.name`
    );
    return ok(res, rows);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT * FROM brokers WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Broker not found.' });
    return ok(res, rows[0]);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name, agency_name, mobile, email, rera_number, commission_pct, address } = req.body;
    if (!name || !mobile) return res.status(400).json({ error: 'Name and mobile are required.' });
    const { rows } = await pool.query(
      `INSERT INTO brokers(name, agency_name, mobile, email, rera_number, commission_pct, address)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, agency_name||null, mobile, email||null,
       rera_number||null, commission_pct||2.0, address||null]
    );
    return created(res, rows[0]);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const fields = ['name','agency_name','mobile','email','rera_number','commission_pct','address','is_active'];
    const sets = []; const values = []; let idx = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) { sets.push(`${f} = $${idx}`); values.push(req.body[f]); idx++; }
    }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update.' });
    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE brokers SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (!rows.length) return res.status(404).json({ error: 'Broker not found.' });
    return ok(res, rows[0]);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await pool.query('UPDATE brokers SET is_active = false WHERE id = $1', [req.params.id]);
    return noContent(res);
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update, remove };
