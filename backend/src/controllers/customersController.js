const pool = require('../db/pool');
const { ok, created, paginate } = require('../utils/response');
const { pagParams } = require('../utils/queryHelper');

async function getAll(req, res, next) {
  try {
    const { page, limit, offset } = pagParams(req.query);
    const { search } = req.query;

    const conditions = []; const values = []; let idx = 1;
    if (search) {
      conditions.push(`(c.name ILIKE $${idx} OR c.mobile LIKE $${idx} OR c.pan_number ILIKE $${idx})`);
      values.push(`%${search}%`); idx++;
    }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const countQ = await pool.query(`SELECT COUNT(*) FROM customers c ${where}`, values);
    const total  = parseInt(countQ.rows[0].count);

    const { rows } = await pool.query(
      `SELECT c.*, b.id AS booking_id, i.unit_number
       FROM customers c
       LEFT JOIN bookings b ON b.customer_id = c.id
       LEFT JOIN inventory i ON i.id = b.inventory_id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT $${idx} OFFSET $${idx+1}`,
      [...values, limit, offset]
    );
    return paginate(res, { data: rows, total, page, limit });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT c.*,
         b.id AS booking_id, b.booking_number, b.booking_amount, b.booking_date, b.status AS booking_status,
         i.unit_number, i.property_type, i.wing, i.floor
       FROM customers c
       LEFT JOIN bookings b ON b.customer_id = c.id
       LEFT JOIN inventory i ON i.id = b.inventory_id
       WHERE c.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Customer not found.' });
    return ok(res, rows[0]);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const {
      lead_id, name, email, mobile, pan_number, aadhaar, occupation,
      address, city, state, pincode,
      nominee_name, nominee_rel, nominee_mobile,
      emergency_name, emergency_phone,
    } = req.body;
    if (!name || !mobile) return res.status(400).json({ error: 'Name and mobile are required.' });

    const { rows } = await pool.query(
      `INSERT INTO customers(lead_id, name, email, mobile, pan_number, aadhaar, occupation,
         address, city, state, pincode, nominee_name, nominee_rel, nominee_mobile,
         emergency_name, emergency_phone)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [lead_id||null, name, email||null, mobile, pan_number||null, aadhaar||null,
       occupation||null, address||null, city||null, state||null, pincode||null,
       nominee_name||null, nominee_rel||null, nominee_mobile||null,
       emergency_name||null, emergency_phone||null]
    );
    return created(res, rows[0]);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const fields = [
      'name','email','mobile','pan_number','aadhaar','occupation',
      'address','city','state','pincode',
      'nominee_name','nominee_rel','nominee_mobile',
      'emergency_name','emergency_phone',
    ];
    const sets = []; const values = []; let idx = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) { sets.push(`${f} = $${idx}`); values.push(req.body[f]); idx++; }
    }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update.' });
    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE customers SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (!rows.length) return res.status(404).json({ error: 'Customer not found.' });
    return ok(res, rows[0]);
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update };
