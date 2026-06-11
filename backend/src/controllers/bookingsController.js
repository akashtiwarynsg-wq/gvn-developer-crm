const pool = require('../db/pool');
const { ok, created, paginate } = require('../utils/response');
const { pagParams } = require('../utils/queryHelper');

async function getAll(req, res, next) {
  try {
    const { page, limit, offset } = pagParams(req.query);
    const { status, search } = req.query;
    const conditions = []; const values = []; let idx = 1;

    if (search) {
      conditions.push(`(c.name ILIKE $${idx} OR i.unit_number ILIKE $${idx} OR CAST(b.booking_number AS TEXT) LIKE $${idx})`);
      values.push(`%${search}%`); idx++;
    }
    if (status) { conditions.push(`b.status = $${idx}`); values.push(status); idx++; }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const countQ = await pool.query(
      `SELECT COUNT(*) FROM bookings b
       LEFT JOIN customers c ON c.id = b.customer_id
       LEFT JOIN inventory i ON i.id = b.inventory_id
       ${where}`, values);
    const total = parseInt(countQ.rows[0].count);

    const { rows } = await pool.query(
      `SELECT b.*, c.name AS customer_name, c.mobile AS customer_mobile,
         i.unit_number, i.property_type, i.wing, i.floor, i.facing,
         u.name AS created_by_name
       FROM bookings b
       LEFT JOIN customers c ON c.id = b.customer_id
       LEFT JOIN inventory i ON i.id = b.inventory_id
       LEFT JOIN users u ON u.id = b.created_by
       ${where}
       ORDER BY b.created_at DESC
       LIMIT $${idx} OFFSET $${idx+1}`,
      [...values, limit, offset]
    );
    return paginate(res, { data: rows, total, page, limit });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, c.name AS customer_name, c.mobile AS customer_mobile, c.pan_number,
         i.unit_number, i.property_type, i.wing, i.floor, i.base_price,
         i.gst_percent, i.stamp_duty_percent, i.reg_charges
       FROM bookings b
       LEFT JOIN customers c ON c.id = b.customer_id
       LEFT JOIN inventory i ON i.id = b.inventory_id
       WHERE b.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Booking not found.' });

    // Also fetch payments
    const { rows: payments } = await pool.query(
      'SELECT * FROM payments WHERE booking_id = $1 ORDER BY due_date', [req.params.id]);

    return ok(res, { ...rows[0], payments });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      customer_id, inventory_id, booking_date, booking_amount, payment_mode,
      agreement_status, loan_required, loan_bank, loan_amount, notes,
    } = req.body;

    if (!customer_id || !inventory_id || !booking_amount) {
      return res.status(400).json({ error: 'Customer, unit and booking amount are required.' });
    }

    // Check unit is available
    const { rows: inv } = await client.query(
      'SELECT status FROM inventory WHERE id = $1 FOR UPDATE', [inventory_id]);
    if (!inv.length) return res.status(404).json({ error: 'Unit not found.' });
    if (inv[0].status !== 'available') {
      return res.status(409).json({ error: `Unit is ${inv[0].status} and cannot be booked.` });
    }

    // Create booking
    const { rows } = await client.query(
      `INSERT INTO bookings(customer_id, inventory_id, booking_date, booking_amount,
         payment_mode, agreement_status, loan_required, loan_bank, loan_amount, notes, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [customer_id, inventory_id, booking_date || new Date(),
       booking_amount, payment_mode || null,
       agreement_status || 'pending', loan_required || false,
       loan_bank || null, loan_amount || null, notes || null, req.user.id]
    );

    // Mark unit as booked
    await client.query(
      "UPDATE inventory SET status = 'booked' WHERE id = $1", [inventory_id]);

    // Create first payment record
    await client.query(
      `INSERT INTO payments(booking_id, customer_id, payment_type, amount,
         due_date, received_date, payment_mode, status, created_by)
       VALUES($1,$2,'Booking Amount',$3,$4,$4,$5,'paid',$6)`,
      [rows[0].id, customer_id, booking_amount,
       booking_date || new Date(), payment_mode || null, req.user.id]
    );

    await client.query('COMMIT');
    return created(res, rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
}

async function update(req, res, next) {
  try {
    const fields = [
      'booking_date','booking_amount','payment_mode','agreement_status',
      'loan_required','loan_bank','loan_amount','status','notes',
    ];
    const sets = []; const values = []; let idx = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) { sets.push(`${f} = $${idx}`); values.push(req.body[f]); idx++; }
    }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update.' });
    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE bookings SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (!rows.length) return res.status(404).json({ error: 'Booking not found.' });
    return ok(res, rows[0]);
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update };
