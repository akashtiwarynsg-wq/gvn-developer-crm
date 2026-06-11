const pool   = require('../db/pool');
const { ok, created, noContent, paginate } = require('../utils/response');
const { pagParams } = require('../utils/queryHelper');

/* ─── GET /leads ─────────────────────────────────────────────────────────── */
async function getAll(req, res, next) {
  try {
    const { page, limit, offset } = pagParams(req.query);
    const { search, status, source, assigned_to, date_from, date_to } = req.query;

    const conditions = [];
    const values     = [];
    let   idx        = 1;

    if (search) {
      conditions.push(`(
        l.first_name ILIKE $${idx} OR l.last_name ILIKE $${idx} OR
        l.mobile LIKE $${idx} OR l.email ILIKE $${idx} OR
        CAST(l.lead_number AS TEXT) LIKE $${idx}
      )`);
      values.push(`%${search}%`); idx++;
    }
    if (status)      { conditions.push(`l.status = $${idx}`);          values.push(status);      idx++; }
    if (source)      { conditions.push(`l.source = $${idx}`);          values.push(source);      idx++; }
    if (assigned_to) { conditions.push(`l.assigned_to = $${idx}`);     values.push(assigned_to); idx++; }
    if (date_from)   { conditions.push(`l.created_at >= $${idx}`);     values.push(date_from);   idx++; }
    if (date_to)     { conditions.push(`l.created_at <= $${idx}::date + 1`); values.push(date_to); idx++; }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const countQ = await pool.query(
      `SELECT COUNT(*) FROM leads l ${where}`, values);
    const total = parseInt(countQ.rows[0].count);

    const { rows } = await pool.query(
      `SELECT
         l.id, l.lead_number, l.first_name, l.last_name,
         l.mobile, l.alt_mobile, l.whatsapp, l.email,
         l.source, l.status, l.budget_min, l.budget_max,
         l.property_type, l.preferred_floor, l.preferred_facing,
         l.family_size, l.loan_required,
         l.city, l.area, l.state, l.pincode,
         l.occupation, l.remarks,
         l.created_at, l.updated_at,
         u.name AS assigned_name, u.id AS assigned_to,
         cb.name AS created_by_name
       FROM leads l
       LEFT JOIN users u  ON u.id  = l.assigned_to
       LEFT JOIN users cb ON cb.id = l.created_by
       ${where}
       ORDER BY l.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );

    return paginate(res, { data: rows, total, page, limit });
  } catch (err) { next(err); }
}

/* ─── GET /leads/:id ─────────────────────────────────────────────────────── */
async function getOne(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT l.*, u.name AS assigned_name, cb.name AS created_by_name
       FROM leads l
       LEFT JOIN users u  ON u.id  = l.assigned_to
       LEFT JOIN users cb ON cb.id = l.created_by
       WHERE l.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Lead not found.' });
    return ok(res, rows[0]);
  } catch (err) { next(err); }
}

/* ─── POST /leads ────────────────────────────────────────────────────────── */
async function create(req, res, next) {
  try {
    const {
      first_name, last_name, mobile, alt_mobile, whatsapp, email,
      dob, anniversary, occupation, company_name, annual_income,
      address, area, city, state, pincode,
      source, status, budget_min, budget_max,
      property_type, preferred_floor, preferred_facing,
      family_size, loan_required, assigned_to, remarks,
    } = req.body;

    if (!first_name || !mobile) {
      return res.status(400).json({ error: 'First name and mobile are required.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO leads(
         first_name, last_name, mobile, alt_mobile, whatsapp, email,
         dob, anniversary, occupation, company_name, annual_income,
         address, area, city, state, pincode,
         source, status, budget_min, budget_max,
         property_type, preferred_floor, preferred_facing,
         family_size, loan_required, assigned_to, remarks, created_by
       ) VALUES(
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
         $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28
       ) RETURNING *`,
      [
        first_name, last_name || null, mobile, alt_mobile || null,
        whatsapp || null, email || null, dob || null, anniversary || null,
        occupation || null, company_name || null, annual_income || null,
        address || null, area || null, city || null, state || null, pincode || null,
        source || 'other', status || 'new',
        budget_min || null, budget_max || null,
        property_type || null, preferred_floor || null, preferred_facing || null,
        family_size || null, loan_required || false,
        assigned_to || null, remarks || null, req.user.id,
      ]
    );
    return created(res, rows[0]);
  } catch (err) { next(err); }
}

/* ─── PUT /leads/:id ─────────────────────────────────────────────────────── */
async function update(req, res, next) {
  try {
    const fields = [
      'first_name','last_name','mobile','alt_mobile','whatsapp','email',
      'dob','anniversary','occupation','company_name','annual_income',
      'address','area','city','state','pincode',
      'source','status','budget_min','budget_max',
      'property_type','preferred_floor','preferred_facing',
      'family_size','loan_required','assigned_to','remarks',
    ];
    const sets   = [];
    const values = [];
    let   idx    = 1;

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        sets.push(`${f} = $${idx}`);
        values.push(req.body[f]);
        idx++;
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update.' });
    values.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE leads SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (!rows.length) return res.status(404).json({ error: 'Lead not found.' });
    return ok(res, rows[0]);
  } catch (err) { next(err); }
}

/* ─── DELETE /leads/:id ──────────────────────────────────────────────────── */
async function remove(req, res, next) {
  try {
    const { rowCount } = await pool.query('DELETE FROM leads WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Lead not found.' });
    return noContent(res);
  } catch (err) { next(err); }
}

/* ─── GET /leads/:id/followups ───────────────────────────────────────────── */
async function getFollowups(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT f.*, u.name AS created_by_name
       FROM followups f
       LEFT JOIN users u ON u.id = f.created_by
       WHERE f.lead_id = $1 ORDER BY f.followup_date DESC`,
      [req.params.id]);
    return ok(res, rows);
  } catch (err) { next(err); }
}

/* ─── POST /leads/:id/followups ──────────────────────────────────────────── */
async function addFollowup(req, res, next) {
  try {
    const { followup_date, followup_time, notes, next_date, status } = req.body;
    if (!followup_date) return res.status(400).json({ error: 'Followup date is required.' });

    const { rows } = await pool.query(
      `INSERT INTO followups(lead_id, followup_date, followup_time, notes, next_date, status, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, followup_date, followup_time || null, notes || null,
       next_date || null, status || 'pending', req.user.id]
    );
    return created(res, rows[0]);
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update, remove, getFollowups, addFollowup };
