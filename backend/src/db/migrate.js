require('dotenv').config();
const pool = require('./pool');

const SQL = `
/* ─────────────────────────────────────────────────────────────────────────
   GVN Developer – Vandan Vihar CRM  |  Database Schema
   ───────────────────────────────────────────────────────────────────────── */

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/* ENUM TYPES */
DO $$ BEGIN CREATE TYPE user_role AS ENUM
  ('admin','sales_manager','sales_executive','accounts');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE lead_status AS ENUM
  ('new','contacted','interested','hot','warm','cold',
   'visit_scheduled','visit_completed','negotiation','booked','lost','not_interested');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE lead_source AS ENUM
  ('facebook','instagram','google_ads','website','justdial',
   'magicbricks','housing','referral','walk_in','hoarding','newspaper','broker','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE inventory_status AS ENUM
  ('available','blocked','booked','sold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE visit_status AS ENUM
  ('scheduled','completed','rescheduled','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE booking_status AS ENUM
  ('confirmed','cancelled','registered');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE payment_status AS ENUM
  ('pending','paid','overdue','partial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE task_priority AS ENUM
  ('low','medium','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE task_status AS ENUM
  ('pending','in_progress','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

/* USERS */
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  role          user_role NOT NULL DEFAULT 'sales_executive',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* LEADS */
CREATE TABLE IF NOT EXISTS leads (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_number      SERIAL UNIQUE,
  first_name       VARCHAR(80)  NOT NULL,
  last_name        VARCHAR(80),
  mobile           VARCHAR(20)  NOT NULL,
  alt_mobile       VARCHAR(20),
  whatsapp         VARCHAR(20),
  email            VARCHAR(200),
  dob              DATE,
  anniversary      DATE,
  occupation       VARCHAR(120),
  company_name     VARCHAR(200),
  annual_income    NUMERIC(14,2),
  address          TEXT,
  area             VARCHAR(120),
  city             VARCHAR(80),
  state            VARCHAR(80),
  pincode          VARCHAR(10),
  source           lead_source  NOT NULL DEFAULT 'other',
  status           lead_status  NOT NULL DEFAULT 'new',
  budget_min       NUMERIC(14,2),
  budget_max       NUMERIC(14,2),
  property_type    VARCHAR(80),
  preferred_floor  VARCHAR(40),
  preferred_facing VARCHAR(40),
  family_size      INT,
  loan_required    BOOLEAN DEFAULT false,
  assigned_to      UUID REFERENCES users(id) ON DELETE SET NULL,
  remarks          TEXT,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* FOLLOW-UPS */
CREATE TABLE IF NOT EXISTS followups (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id       UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  followup_date DATE NOT NULL,
  followup_time TIME,
  notes         TEXT,
  next_date     DATE,
  status        VARCHAR(30) DEFAULT 'pending',
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* INVENTORY */
CREATE TABLE IF NOT EXISTS inventory (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_number        VARCHAR(20) UNIQUE NOT NULL,
  wing               VARCHAR(10),
  floor              INT,
  property_type      VARCHAR(40),
  carpet_area        NUMERIC(8,2),
  builtup_area       NUMERIC(8,2),
  terrace_area       NUMERIC(8,2) DEFAULT 0,
  facing             VARCHAR(30),
  parking            VARCHAR(20),
  base_price         NUMERIC(14,2),
  floor_rise         NUMERIC(10,2) DEFAULT 0,
  gst_percent        NUMERIC(5,2)  DEFAULT 5,
  stamp_duty_percent NUMERIC(5,2)  DEFAULT 6,
  reg_charges        NUMERIC(10,2) DEFAULT 30000,
  status             inventory_status NOT NULL DEFAULT 'available',
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* SITE VISITS */
CREATE TABLE IF NOT EXISTS site_visits (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_number     SERIAL UNIQUE,
  lead_id          UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_name    VARCHAR(160) NOT NULL,
  contact          VARCHAR(20),
  visit_date       DATE NOT NULL,
  visit_time       TIME,
  family_count     INT DEFAULT 1,
  pickup_required  BOOLEAN DEFAULT false,
  pickup_location  VARCHAR(200),
  assigned_to      UUID REFERENCES users(id) ON DELETE SET NULL,
  remarks          TEXT,
  feedback         TEXT,
  status           visit_status NOT NULL DEFAULT 'scheduled',
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* CUSTOMERS */
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_number SERIAL UNIQUE,
  lead_id         UUID REFERENCES leads(id) ON DELETE SET NULL,
  name            VARCHAR(160) NOT NULL,
  email           VARCHAR(200),
  mobile          VARCHAR(20),
  pan_number      VARCHAR(12),
  aadhaar         VARCHAR(20),
  occupation      VARCHAR(120),
  address         TEXT,
  city            VARCHAR(80),
  state           VARCHAR(80),
  pincode         VARCHAR(10),
  nominee_name    VARCHAR(120),
  nominee_rel     VARCHAR(60),
  nominee_mobile  VARCHAR(20),
  emergency_name  VARCHAR(120),
  emergency_phone VARCHAR(20),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* BOOKINGS */
CREATE TABLE IF NOT EXISTS bookings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number   SERIAL UNIQUE,
  customer_id      UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  inventory_id     UUID NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
  booking_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  booking_amount   NUMERIC(14,2) NOT NULL,
  payment_mode     VARCHAR(40),
  agreement_status VARCHAR(40) DEFAULT 'pending',
  loan_required    BOOLEAN DEFAULT false,
  loan_bank        VARCHAR(120),
  loan_amount      NUMERIC(14,2),
  status           booking_status NOT NULL DEFAULT 'confirmed',
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* PAYMENTS */
CREATE TABLE IF NOT EXISTS payments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id   UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id  UUID NOT NULL REFERENCES customers(id),
  payment_type VARCHAR(60) NOT NULL,
  amount       NUMERIC(14,2) NOT NULL,
  due_date     DATE,
  received_date DATE,
  payment_mode VARCHAR(40),
  reference_no VARCHAR(80),
  status       payment_status NOT NULL DEFAULT 'pending',
  notes        TEXT,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* BROKERS */
CREATE TABLE IF NOT EXISTS brokers (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(120) NOT NULL,
  agency_name    VARCHAR(200),
  mobile         VARCHAR(20) NOT NULL,
  email          VARCHAR(200),
  rera_number    VARCHAR(60),
  commission_pct NUMERIC(5,2) DEFAULT 2.0,
  address        TEXT,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* TASKS */
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  priority    task_priority NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date    DATE,
  status      task_status NOT NULL DEFAULT 'pending',
  lead_id     UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* DOCUMENTS */
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(30)  NOT NULL,
  entity_id   UUID         NOT NULL,
  doc_type    VARCHAR(60)  NOT NULL,
  file_name   VARCHAR(255) NOT NULL,
  file_path   TEXT         NOT NULL,
  file_size   INT,
  mime_type   VARCHAR(80),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* NOTIFICATIONS */
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  message     TEXT,
  type        VARCHAR(40) DEFAULT 'info',
  is_read     BOOLEAN DEFAULT false,
  entity_type VARCHAR(40),
  entity_id   UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* INDEXES */
CREATE INDEX IF NOT EXISTS idx_leads_status    ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source    ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_assigned  ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_mobile    ON leads(mobile);
CREATE INDEX IF NOT EXISTS idx_leads_created   ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_followups_lead  ON followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_followups_date  ON followups(followup_date);
CREATE INDEX IF NOT EXISTS idx_inv_status      ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_visits_date     ON site_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_status   ON site_visits(status);
CREATE INDEX IF NOT EXISTS idx_bookings_cust   ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_book   ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned  ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status    ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_notif_user      ON notifications(user_id, is_read);

/* UPDATED_AT TRIGGER */
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['users','leads','inventory','site_visits',
                              'customers','bookings','payments','brokers','tasks']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_upd_%s ON %s;
       CREATE TRIGGER trg_upd_%s BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;
`;

async function migrate() {
  console.log('🔄  Running migrations...');
  try {
    await pool.query(SQL);
    console.log('✅  Migrations complete.');
  } catch (err) {
    console.error('❌  Migration error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
