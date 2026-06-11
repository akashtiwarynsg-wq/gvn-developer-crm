# GVN Developer – Vandan Vihar CRM

Production-ready Real Estate CRM for **GVN Developer** and the **Vandan Vihar** project in Wadki, Pune.

---

## 🏗️ Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS          |
| Backend   | Node.js + Express.js                    |
| Database  | PostgreSQL (Supabase)                   |
| Auth      | JWT + Role-Based Access Control         |
| Hosting   | Vercel (frontend) + Render (backend)    |

---

## 🚀 Quick Start (Local)

### 1. Clone & Install
```bash
git clone https://github.com/your-org/gvn-crm.git
cd gvn-crm
npm run install:all
```

### 2. Configure Environment
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL and JWT_SECRET

# Frontend
cp frontend/.env.example frontend/.env
# VITE_API_URL=http://localhost:5000/api
```

### 3. Setup Database
```bash
npm run db:migrate   # Creates all tables
npm run db:seed      # Inserts sample data
```

### 4. Start Development
```bash
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
# Health:   http://localhost:5000/health
```

---

## 🔐 Default Login Credentials

| Email                        | Password  | Role             |
|------------------------------|-----------|------------------|
| admin@gvndeveloper.com       | GVN@2024  | Admin            |
| amit@gvndeveloper.com        | GVN@2024  | Sales Manager    |
| priya@gvndeveloper.com       | GVN@2024  | Sales Executive  |
| rahul@gvndeveloper.com       | GVN@2024  | Sales Executive  |
| neha@gvndeveloper.com        | GVN@2024  | Accounts Team    |

> ⚠️ Change all passwords before going live.

---

## ☁️ Deployment

### Supabase (Database)
1. Create project at https://supabase.com
2. Go to **Settings → Database → Connection string**
3. Copy the `postgresql://...` URI
4. Set as `DATABASE_URL` in your backend environment

### Render (Backend)
1. Create **New Web Service** at https://render.com
2. Connect your GitHub repo, select `/backend` as root
3. Build: `npm install` | Start: `npm start`
4. Add environment variables from `backend/.env.example`
5. After first deploy, run migrations:
   ```
   DATABASE_URL=your_url node backend/src/db/migrate.js
   DATABASE_URL=your_url node backend/src/db/seed.js
   ```

### Vercel (Frontend)
1. Import repo at https://vercel.com
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   ```
   VITE_API_URL = https://your-render-app.onrender.com/api
   ```
4. Deploy — Vercel auto-detects Vite

---

## 📁 Project Structure

```
gvn-crm/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Business logic (11 controllers)
│   │   ├── routes/          # Express routes (11 route files)
│   │   ├── middleware/      # Auth, validation, upload, errors
│   │   ├── db/              # Pool, migrate, seed
│   │   └── utils/           # Response helpers
│   ├── uploads/             # Uploaded documents
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # 11 pages (Dashboard → Settings)
│   │   ├── components/
│   │   │   ├── ui/          # Badge, Button, Table, Modal, etc.
│   │   │   └── layout/      # Sidebar, Topbar, AppLayout
│   │   ├── hooks/           # useApi, useData
│   │   ├── store/           # Zustand (auth, theme)
│   │   ├── lib/             # api.js, constants.js, utils.js
│   │   └── styles/          # Tailwind globals
│   └── package.json
│
├── package.json             # Root workspace
├── .env.example
└── README.md
```

---

## 🧩 Modules

| Module         | Features                                                  |
|----------------|-----------------------------------------------------------|
| Dashboard      | KPIs, charts, lead trend, inventory status                |
| Lead Management| CRUD, source tracking, follow-ups, status pipeline        |
| Site Visits    | Schedule, pickup, feedback, status tracking               |
| Inventory      | Unit cards + table, status management, pricing            |
| Bookings       | Unit allocation, agreement status, loan tracking          |
| Payments       | Installments, overdue alerts, mark-paid, ledger           |
| Customers      | Profile, KYC, documents, timeline                         |
| Brokers        | RERA registration, commission, performance chart          |
| Tasks          | Assign, priority, due dates, one-click complete           |
| Reports        | 8 report types, charts, PDF/Excel export                  |
| Settings       | User management, role permissions, notifications          |

---

## 👥 User Roles & Permissions

| Role             | Leads | Inventory | Bookings | Payments | Reports | Users |
|------------------|-------|-----------|----------|----------|---------|-------|
| Admin            | Full  | Full      | Full     | Full     | Full    | Full  |
| Sales Manager    | Full  | Edit      | Full     | View     | Full    | View  |
| Sales Executive  | Full  | View      | Create   | View     | Own     | None  |
| Accounts Team    | View  | View      | View     | Full     | Payments| None  |

---

## 📡 API Endpoints

```
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/change-password

GET    /api/leads           POST /api/leads
GET    /api/leads/:id       PUT  /api/leads/:id      DELETE /api/leads/:id
GET    /api/leads/:id/followups                       POST /api/leads/:id/followups

GET    /api/inventory       POST /api/inventory
GET    /api/inventory/:id   PUT  /api/inventory/:id   DELETE /api/inventory/:id

GET    /api/site-visits     POST /api/site-visits
GET    /api/site-visits/:id PUT  /api/site-visits/:id

GET    /api/customers       POST /api/customers
GET    /api/customers/:id   PUT  /api/customers/:id

GET    /api/bookings        POST /api/bookings
GET    /api/bookings/:id    PUT  /api/bookings/:id

GET    /api/payments        POST /api/payments
GET    /api/payments/:id    PUT  /api/payments/:id
GET    /api/payments/summary

GET    /api/brokers         POST /api/brokers
GET    /api/brokers/:id     PUT  /api/brokers/:id     DELETE /api/brokers/:id

GET    /api/tasks           POST /api/tasks
PUT    /api/tasks/:id       DELETE /api/tasks/:id

GET    /api/users           POST /api/users
PUT    /api/users/:id

GET    /api/reports/dashboard
GET    /api/reports/monthly
GET    /api/reports/lead-sources
GET    /api/reports/lead-statuses
GET    /api/reports/sales
GET    /api/reports/inventory
GET    /api/reports/outstanding
GET    /api/reports/brokers
```

---

## 🔒 Security

- JWT tokens (7-day expiry, stored in localStorage)
- bcrypt password hashing (12 rounds)
- Role-based route protection (middleware)
- Helmet.js security headers
- CORS configured for frontend origin
- Rate limiting: 20 auth req/15min, 300 API req/min
- PostgreSQL parameterized queries (SQL injection safe)

---

*Built for GVN Developer — Vandan Vihar, Wadki, Pune*
