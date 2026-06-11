const pool = require('../db/pool');
const { ok, created, paginate } = require('../utils/response');
const { pagParams } = require('../utils/queryHelper');

async function getAll(req, res, next) {
  try {
    const { page, limit, offset } = pagParams(req.query);
    const { status, booking_id, customer_id, search } = req.query;

    const conditions = []; const values = []; let idx = 1;
    if (search) {
      conditions.push(`(c.name ILIKE $${idx} OR i.unit_number ILIKE $${idx})`);
      values.push(`%${search}%`); idx++;
    }
    if (status)      { conditions.push(`p.status = $${idx}`);      values.push(status);      idx++; }
    if (booking_id)  { conditions.push(`p.booking_id = $${idx}`);  values.push(booking_id);  idx++; }
    if (customer_id) { conditions.push(`p.customer_id = $${idx}`); values.push(customer_id); idx++; }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const countQ = await pool.query(
      `SELECT COUNT(*) FROM payments p
       LEFT JOIN customers c ON c.id = p.customer_id
       LEFT JOIN bookings b ON b.id = p.booking_id
       LEFT JOIN inventory i ON i.id = b.inventory_id
       ${where}`, values);
    const total = parseInt(countQ.rows[0].count);

    const { rows } = await pool.query(
      `SELECT p.*,
         c.name AS customer_name, c.mobile AS customer_mobile,
         i.unit_number, i.property_type
       FROM payments p
       LEFT JOIN customers c ON c.id = p.customer_id
       LEFT JOIN bookings b ON b.id = p.booking_id
       LEFT JOIN inventory i ON i.id = b.inventory_id
       ${where}
       ORDER BY p.due_date ASC NULLS LAST, p.created_at DESC
       LIMIT $${idx} OFFSET $${idx+1}`,
      [...values, limit, offset]
    );
    return paginate(res, { data: rows, total, page, limit });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, c.name AS customer_name, i.unit_number
       FROM payments p
       LEFT JOIN customers c ON c.id = p.customer_id
       LEFT JOIN bookings b ON b.id = p.booking_id
       LEFT JOIN inventory i ON i.id = b.inventory_id
       WHERE p.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Payment not found.' });
    return ok(res, rows[0]);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const {
      booking_id, customer_id, payment_type, amount, due_date,
      received_date, payment_mode, reference_no, status, notes,
    } = req.body;
    if (!booking_id || !customer_id || !payment_type || !amount) {
      return res.status(400).json({ error: 'Booking, customer, type and amount are required.' });
    }
    const { rows } = await pool.query(
      `INSERT INTO payments(booking_id, customer_id, payment_type, amount, due_date,
         received_date, payment_mode, reference_no, status, notes, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [booking_id, customer_id, payment_type, amount, due_date||null,
       received_date||null, payment_mode||null, reference_no||null,
       status||'pending', notes||null, req.user.id]
    );
    return created(res, rows[0]);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const fields = [
      'payment_type','amount','due_date','received_date',
      'payment_mode','reference_no','status','notes',
    ];
    const sets = []; const values = []; let idx = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) { sets.push(`${f} = $${idx}`); values.push(req.body[f]); idx++; }
    }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update.' });
    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE payments SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (!rows.length) return res.status(404).json({ error: 'Payment not found.' });
    return ok(res, rows[0]);
  } catch (err) { next(err); }
}

// Summary stats for dashboard
async function getSummary(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT
        SUM(amount) FILTER (WHERE status = 'paid')    AS total_collected,
        SUM(amount) FILTER (WHERE status = 'pending') AS total_pending,
        SUM(amount) FILTER (WHERE status = 'overdue') AS total_overdue,
        COUNT(*)    FILTER (WHERE status = 'pending') AS pending_count,
        COUNT(*)    FILTER (WHERE status = 'paid')    AS paid_count
      FROM payments
    `);
    return ok(res, rows[0]);
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update, getSummary };
