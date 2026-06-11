const bcrypt = require('bcryptjs');
const pool   = require('../db/pool');
const { ok, created, paginate } = require('../utils/response');
const { pagParams } = require('../utils/queryHelper');

async function getAll(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, phone, role, is_active, created_at
       FROM users ORDER BY created_at DESC`
    );
    return ok(res, rows);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, phone, role, is_active, created_at
       FROM users WHERE id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    return ok(res, rows[0]);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users(name, email, password_hash, phone, role)
       VALUES($1,$2,$3,$4,$5)
       RETURNING id, name, email, phone, role, is_active, created_at`,
      [name, email.toLowerCase().trim(), hash, phone || null, role || 'sales_executive']
    );
    return created(res, rows[0]);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { name, phone, role, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET
         name      = COALESCE($1, name),
         phone     = COALESCE($2, phone),
         role      = COALESCE($3, role),
         is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING id, name, email, phone, role, is_active`,
      [name, phone, role, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    return ok(res, rows[0]);
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update };
