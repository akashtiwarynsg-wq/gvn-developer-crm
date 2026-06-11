const pool = require('../db/pool');
const { ok } = require('../utils/response');

/* Dashboard KPI snapshot */
async function dashboard(req, res, next) {
  try {
    const [leads, inventory, bookings, payments, visits, tasks] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)                                 AS total,
          COUNT(*) FILTER (WHERE status='new')     AS new_today,
          COUNT(*) FILTER (WHERE status='hot')     AS hot,
          COUNT(*) FILTER (WHERE status='booked')  AS booked,
          COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS added_today
        FROM leads`),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status='available') AS available,
          COUNT(*) FILTER (WHERE status='booked')    AS booked,
          COUNT(*) FILTER (WHERE status='sold')      AS sold,
          COUNT(*) FILTER (WHERE status='blocked')   AS blocked,
          COUNT(*)                                   AS total
        FROM inventory`),
      pool.query(`
        SELECT COUNT(*) AS total,
          COUNT(*) FILTER (WHERE booking_date >= date_trunc('month', CURRENT_DATE)) AS this_month
        FROM bookings WHERE status != 'cancelled'`),
      pool.query(`
        SELECT
          COALESCE(SUM(amount) FILTER (WHERE status='paid'),    0) AS collected,
          COALESCE(SUM(amount) FILTER (WHERE status='pending'), 0) AS pending,
          COUNT(*)              FILTER (WHERE status='pending')    AS pending_count
        FROM payments`),
      pool.query(`
        SELECT COUNT(*) FILTER (WHERE status='scheduled') AS scheduled,
               COUNT(*) FILTER (WHERE status='completed') AS completed
        FROM site_visits`),
      pool.query(`
        SELECT COUNT(*) FILTER (WHERE status='pending' AND due_date = CURRENT_DATE) AS due_today
        FROM tasks`),
    ]);

    return ok(res, {
      leads:     leads.rows[0],
      inventory: inventory.rows[0],
      bookings:  bookings.rows[0],
      payments:  payments.rows[0],
      visits:    visits.rows[0],
      tasks:     tasks.rows[0],
    });
  } catch (err) { next(err); }
}

/* Monthly trend – leads, bookings, revenue */
async function monthlyTrend(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT
        TO_CHAR(month, 'Mon YYYY') AS label,
        month,
        leads_count,
        bookings_count,
        revenue
      FROM (
        SELECT
          date_trunc('month', gs) AS month,
          COUNT(DISTINCT l.id)    AS leads_count,
          COUNT(DISTINCT b.id)    AS bookings_count,
          COALESCE(SUM(p.amount) FILTER (WHERE p.status='paid'), 0) AS revenue
        FROM generate_series(
          date_trunc('month', CURRENT_DATE - INTERVAL '5 months'),
          date_trunc('month', CURRENT_DATE),
          '1 month'
        ) gs
        LEFT JOIN leads l    ON date_trunc('month', l.created_at) = gs
        LEFT JOIN bookings b ON date_trunc('month', b.created_at) = gs
        LEFT JOIN payments p ON date_trunc('month', p.created_at) = gs
        GROUP BY gs
      ) t ORDER BY month ASC
    `);
    return ok(res, rows);
  } catch (err) { next(err); }
}

/* Lead source breakdown */
async function leadSources(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT source, COUNT(*) AS count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS percent
      FROM leads GROUP BY source ORDER BY count DESC
    `);
    return ok(res, rows);
  } catch (err) { next(err); }
}

/* Lead status breakdown */
async function leadStatuses(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT status, COUNT(*) AS count FROM leads GROUP BY status ORDER BY count DESC
    `);
    return ok(res, rows);
  } catch (err) { next(err); }
}

/* Sales executive performance */
async function salesPerformance(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.name,
        COUNT(DISTINCT l.id)                                          AS total_leads,
        COUNT(DISTINCT l.id) FILTER (WHERE l.status='hot')           AS hot_leads,
        COUNT(DISTINCT sv.id)                                         AS visits,
        COUNT(DISTINCT l.id) FILTER (WHERE l.status='booked')        AS bookings
      FROM users u
      LEFT JOIN leads l      ON l.assigned_to = u.id
      LEFT JOIN site_visits sv ON sv.assigned_to = u.id
      WHERE u.role IN ('sales_executive','sales_manager')
      GROUP BY u.id, u.name
      ORDER BY bookings DESC, total_leads DESC
    `);
    return ok(res, rows);
  } catch (err) { next(err); }
}

/* Inventory summary */
async function inventorySummary(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT
        property_type,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status='available') AS available,
        COUNT(*) FILTER (WHERE status='booked')    AS booked,
        COUNT(*) FILTER (WHERE status='sold')      AS sold,
        AVG(base_price) AS avg_price,
        SUM(base_price) FILTER (WHERE status='available') AS available_value
      FROM inventory
      GROUP BY property_type
      ORDER BY property_type
    `);
    return ok(res, rows);
  } catch (err) { next(err); }
}

/* Payment outstanding */
async function paymentOutstanding(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.name AS customer_name, c.mobile,
        i.unit_number,
        p.payment_type, p.amount, p.due_date, p.status,
        CASE WHEN p.due_date < CURRENT_DATE AND p.status='pending' THEN true ELSE false END AS is_overdue
      FROM payments p
      JOIN customers c ON c.id = p.customer_id
      JOIN bookings b  ON b.id = p.booking_id
      JOIN inventory i ON i.id = b.inventory_id
      WHERE p.status IN ('pending','overdue')
      ORDER BY p.due_date ASC NULLS LAST
    `);
    return ok(res, rows);
  } catch (err) { next(err); }
}

/* Broker performance */
async function brokerPerformance(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT
        b.name, b.agency_name, b.mobile, b.commission_pct, b.rera_number,
        COUNT(DISTINCT l.id) AS referred_leads
      FROM brokers b
      LEFT JOIN leads l ON l.source = 'broker'
      WHERE b.is_active = true
      GROUP BY b.id
      ORDER BY referred_leads DESC
    `);
    return ok(res, rows);
  } catch (err) { next(err); }
}

module.exports = {
  dashboard, monthlyTrend, leadSources, leadStatuses,
  salesPerformance, inventorySummary, paymentOutstanding, brokerPerformance,
};
