require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const authRoutes      = require('./routes/auth');
const usersRoutes     = require('./routes/users');
const leadsRoutes     = require('./routes/leads');
const inventoryRoutes = require('./routes/inventory');
const siteVisitRoutes = require('./routes/siteVisits');
const bookingsRoutes  = require('./routes/bookings');
const paymentsRoutes  = require('./routes/payments');
const customersRoutes = require('./routes/customers');
const brokersRoutes   = require('./routes/brokers');
const tasksRoutes     = require('./routes/tasks');
const reportsRoutes   = require('./routes/reports');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods:     ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts. Please try again in 15 minutes.' },
}));
app.use('/api', rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  message: { error: 'Rate limit exceeded.' },
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── Logger ────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status:  'ok',
  service: 'GVN Developer CRM API',
  project: 'Vandan Vihar',
  version: '1.0.0',
  env:     process.env.NODE_ENV,
}));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/users',       usersRoutes);
app.use('/api/leads',       leadsRoutes);
app.use('/api/inventory',   inventoryRoutes);
app.use('/api/site-visits', siteVisitRoutes);
app.use('/api/bookings',    bookingsRoutes);
app.use('/api/payments',    paymentsRoutes);
app.use('/api/customers',   customersRoutes);
app.use('/api/brokers',     brokersRoutes);
app.use('/api/tasks',       tasksRoutes);
app.use('/api/reports',     reportsRoutes);

// ── Error handlers ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  GVN CRM API running on port ${PORT}`);
  console.log(`    Project : Vandan Vihar`);
  console.log(`    Env     : ${process.env.NODE_ENV}`);
  console.log(`    Health  : http://localhost:${PORT}/health\n`);
});

module.exports = app;
