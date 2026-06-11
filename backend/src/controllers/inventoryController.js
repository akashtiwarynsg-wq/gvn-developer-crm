const pool = require('../db/pool');
const { ok, created, noContent } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const { status, wing, property_type } = req.query;
    const conditions = []; const values = []; let idx = 1;

    if (status)        { conditions.push(`status = $${idx}`);        values.push(status);        idx++; }
    if (wing)          { conditions.push(`wing = $${idx}`);           values.push(wing);          idx++; }
    if (property_type) { conditions.push(`property_type = $${idx}`); values.push(property_type); idx++; }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const { rows } = await pool.query(
      `SELECT * FROM inventory ${where} ORDER BY wing, floor, unit_number`, values);
    return ok(res, rows);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT * FROM inventory WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Unit not found.' });
    return ok(res, rows[0]);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const {
      unit_number, wing, floor, property_type, carpet_area, builtup_area,
      terrace_area, facing, parking, base_price, floor_rise,
      gst_percent, stamp_duty_percent, reg_charges, status, notes,
    } = req.body;
    if (!unit_number || !base_price) {
      return res.status(400).json({ error: 'Unit number and base price are required.' });
    }
    const { rows } = await pool.query(
      `INSERT INTO inventory(
         unit_number, wing, floor, property_type, carpet_area, builtup_area,
         terrace_area, facing, parking, base_price, floor_rise,
         gst_percent, stamp_duty_percent, reg_charges, status, notes
       ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [unit_number, wing, floor, property_type, carpet_area, builtup_area,
       terrace_area || 0, facing, parking, base_price, floor_rise || 0,
       gst_percent || 5, stamp_duty_percent || 6, reg_charges || 30000,
       status || 'available', notes || null]
    );
    return created(res, rows[0]);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const fields = [
      'unit_number','wing','floor','property_type','carpet_area','builtup_area',
      'terrace_area','facing','parking','base_price','floor_rise',
      'gst_percent','stamp_duty_percent','reg_charges','status','notes',
    ];
    const sets = []; const values = []; let idx = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) { sets.push(`${f} = $${idx}`); values.push(req.body[f]); idx++; }
    }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update.' });
    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE inventory SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (!rows.length) return res.status(404).json({ error: 'Unit not found.' });
    return ok(res, rows[0]);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { rowCount } = await pool.query('DELETE FROM inventory WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Unit not found.' });
    return noContent(res);
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update, remove };
