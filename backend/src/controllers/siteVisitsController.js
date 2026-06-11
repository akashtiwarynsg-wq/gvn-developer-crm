const pool = require('../db/pool');
const { ok, created, paginate } = require('../utils/response');
const { pagParams } = require('../utils/queryHelper');

async function getAll(req, res, next) {
  try {
    const { page, limit, offset } = pagParams(req.query);
    const { status, assigned_to, date_from, date_to, search } = req.query;

    const conditions = []; const values = []; let idx = 1;
    if (search) {
      conditions.push(`(sv.customer_name ILIKE $${idx} OR sv.contact LIKE $${idx})`);
      values.push(`%${search}%`); idx++;
    }
    if (status)      { conditions.push(`sv.status = $${idx}`);           values.push(status);      idx++; }
    if (assigned_to) { conditions.push(`sv.assigned_to = $${idx}`);      values.push(assigned_to); idx++; }
    if (date_from)   { conditions.push(`sv.visit_date >= $${idx}`);       values.push(date_from);   idx++; }
    if (date_to)     { conditions.push(`sv.visit_date <= $${idx}`);       values.push(date_to);     idx++; }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const countQ = await pool.query(`SELECT COUNT(*) FROM site_visits sv ${where}`, values);
    const total  = parseInt(countQ.rows[0].count);

    const { rows } = await pool.query(
      `SELECT sv.*, u.name AS assigned_name, l.first_name, l.last_name
       FROM site_visits sv
       LEFT JOIN users u ON u.id = sv.assigned_to
       LEFT JOIN leads l ON l.id = sv.lead_id
       ${where}
       ORDER BY sv.visit_date DESC, sv.visit_time
       LIMIT $${idx} OFFSET $${idx+1}`,
      [...values, limit, offset]
    );
    return paginate(res, { data: rows, total, page, limit });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT sv.*, u.name AS assigned_name FROM site_visits sv
       LEFT JOIN users u ON u.id = sv.assigned_to WHERE sv.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Visit not found.' });
    return ok(res, rows[0]);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const {
      lead_id, customer_name, contact, visit_date, visit_time,
      family_count, pickup_required, pickup_location, assigned_to, remarks,
    } = req.body;
    if (!customer_name || !visit_date) {
      return res.status(400).json({ error: 'Customer name and visit date are required.' });
    }
    const { rows } = await pool.query(
      `INSERT INTO site_visits(lead_id, customer_name, contact, visit_date, visit_time,
         family_count, pickup_required, pickup_location, assigned_to, remarks, status, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'scheduled',$11) RETURNING *`,
      [lead_id || null, customer_name, contact || null, visit_date, visit_time || null,
       family_count || 1, pickup_required || false, pickup_location || null,
       assigned_to || null, remarks || null, req.user.id]
    );
    return created(res, rows[0]);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const fields = [
      'customer_name','contact','visit_date','visit_time','family_count',
      'pickup_required','pickup_location','assigned_to','remarks','feedback','status',
    ];
    const sets = []; const values = []; let idx = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) { sets.push(`${f} = $${idx}`); values.push(req.body[f]); idx++; }
    }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update.' });
    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE site_visits SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (!rows.length) return res.status(404).json({ error: 'Visit not found.' });
    return ok(res, rows[0]);
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update };
