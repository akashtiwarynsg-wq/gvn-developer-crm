const pool = require('../db/pool');
const { ok, created, noContent, paginate } = require('../utils/response');
const { pagParams } = require('../utils/queryHelper');

async function getAll(req, res, next) {
  try {
    const { page, limit, offset } = pagParams(req.query);
    const { status, priority, assigned_to } = req.query;

    const conditions = []; const values = []; let idx = 1;
    if (status)      { conditions.push(`t.status = $${idx}`);      values.push(status);      idx++; }
    if (priority)    { conditions.push(`t.priority = $${idx}`);     values.push(priority);    idx++; }
    if (assigned_to) { conditions.push(`t.assigned_to = $${idx}`);  values.push(assigned_to); idx++; }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const countQ = await pool.query(`SELECT COUNT(*) FROM tasks t ${where}`, values);
    const total  = parseInt(countQ.rows[0].count);

    const { rows } = await pool.query(
      `SELECT t.*, u.name AS assigned_name, cb.name AS created_by_name
       FROM tasks t
       LEFT JOIN users u  ON u.id  = t.assigned_to
       LEFT JOIN users cb ON cb.id = t.created_by
       ${where}
       ORDER BY
         CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
         t.due_date ASC NULLS LAST
       LIMIT $${idx} OFFSET $${idx+1}`,
      [...values, limit, offset]
    );
    return paginate(res, { data: rows, total, page, limit });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { title, description, priority, assigned_to, due_date, lead_id } = req.body;
    if (!title) return res.status(400).json({ error: 'Task title is required.' });
    const { rows } = await pool.query(
      `INSERT INTO tasks(title, description, priority, assigned_to, due_date, lead_id, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, description||null, priority||'medium', assigned_to||null,
       due_date||null, lead_id||null, req.user.id]
    );
    return created(res, rows[0]);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const fields = ['title','description','priority','assigned_to','due_date','status'];
    const sets = []; const values = []; let idx = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) { sets.push(`${f} = $${idx}`); values.push(req.body[f]); idx++; }
    }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update.' });
    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE tasks SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (!rows.length) return res.status(404).json({ error: 'Task not found.' });
    return ok(res, rows[0]);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Task not found.' });
    return noContent(res);
  } catch (err) { next(err); }
}

module.exports = { getAll, create, update, remove };
