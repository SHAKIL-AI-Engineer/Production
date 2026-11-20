# Production Report REST API — System Design & Architecture

## 1. Overview

A production-reporting REST API built with **Go** and the **Gin** web framework. It tracks daily production, daily expenses, computes Profit & Loss (P&L), and exposes summary dashboards. It includes user registration, login, JWT-based authentication, and role-based access control (RBAC).

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│  (Web App / Mobile App / Postman / cURL / Dashboard)        │
└─────────────────────────────────────────────────────────────┘
                              │ HTTPS / JSON
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY (Gin)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ Middleware  │  │ Middleware  │  │ Middleware       │   │
│  │ Logger      │  │ Auth (JWT)  │  │ RBAC (roles)     │   │
│  │ Recovery    │  │ CORS        │  │ Validation       │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Auth Handler  │   │Production     │   │ Expense       │
│ Handler       │   │ Handler       │   │ Handler       │
└───────────────┘   └───────────────┘   └───────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER (Business Logic)             │
│  AuthService · ProductionService · ExpenseService            │
│  ReportService (P&L, Summary, Dashboard)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA ACCESS (GORM)                         │
│  User · DailyProduction · DailyExpense                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (PostgreSQL / SQLite)             │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Client** | Consumes JSON over HTTP; authenticates via Bearer JWT |
| **API Gateway (Gin)** | Routing, CORS, request logging, panic recovery, input validation |
| **Middleware** | JWT authentication, RBAC (admin/manager/user), rate-limiting hooks |
| **Handler** | HTTP request/response mapping, DTO binding, status codes |
| **Service** | Business rules: P&L calculation, date-range aggregation, access control |
| **Data Access** | GORM models, migrations, CRUD queries |
| **Database** | Persistent storage (PostgreSQL recommended for production) |

---

## 3. Technology Stack

| Component | Choice |
|-----------|--------|
| Language | Go 1.22+ |
| Web Framework | Gin (`github.com/gin-gonic/gin`) |
| ORM | GORM (`gorm.io/gorm`) |
| Database Driver | SQLite (`gorm.io/driver/sqlite` + `modernc.org/sqlite`, no CGO) — switch to PostgreSQL (`gorm.io/driver/postgres`) for production |
| Auth | JWT (`github.com/golang-jwt/jwt/v5`) |
| Config | `.env` via `github.com/joho/godotenv` |
| Container | Docker + Docker Compose |
| Migrations | SQL files (versioned) |

---

## 4. Entity Relationship Diagram (ERD)

```
users
├── id (PK, UUID)
├── email (unique)
├── password_hash
├── role (admin | manager | user)
├── created_at
└── updated_at

daily_productions
├── id (PK, UUID)
├── user_id (FK → users.id)
├── production_date (date)
├── items_produced (int)
├── units (string)
├── notes (string)
├── created_at
└── updated_at

daily_expenses
├── id (PK, UUID)
├── user_id (FK → users.id)
├── expense_date (date)
├── category (string)
├── amount (decimal)
├── description (string)
├── created_at
└── updated_at
```

Access rule: `user` role can only see/edit their own records. `admin`/`manager` can see all.

---

## 5. REST API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/auth/register` | Register a new user | Public |
| POST | `/api/v1/auth/login` | Login & receive JWT | Public |
| GET  | `/api/v1/auth/me` | Get current user profile | Authenticated |
| POST | `/api/v1/auth/logout` | Logout (client discards token) | Authenticated |

### Daily Production
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/productions` | Create a production record | Authenticated |
| GET | `/api/v1/productions` | List productions (filter by date range) | Authenticated |
| GET | `/api/v1/productions/:id` | Get a single production | Authenticated + owner/admin |
| PUT | `/api/v1/productions/:id` | Update a production | Authenticated + owner/admin |
| DELETE | `/api/v1/productions/:id` | Delete a production | Authenticated + owner/admin |

### Daily Expense
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/expenses` | Create an expense record | Authenticated |
| GET | `/api/v1/expenses` | List expenses (filter by date range) | Authenticated |
| GET | `/api/v1/expenses/:id` | Get a single expense | Authenticated + owner/admin |
| PUT | `/api/v1/expenses/:id` | Update an expense | Authenticated + owner/admin |
| DELETE | `/api/v1/expenses/:id` | Delete an expense | Authenticated + owner/admin |

### Profit & Loss
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/reports/pnl?start_date=&end_date=` | Revenue − Expense = Profit/Loss | Authenticated |

### Summary
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/reports/summary?start_date=&end_date=` | Totals per period | Authenticated |
| GET | `/api/v1/reports/dashboard` | KPI summary (today/this month) | Authenticated |

---

## 6. Request / Response Examples

### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "manager@factory.com",
  "password": "SecurePass123!",
  "role": "manager"
}
```

Response `201`:
```json
{ "id": "...", "email": "manager@factory.com", "role": "manager" }
```

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "manager@factory.com", "password": "SecurePass123!" }
```

Response `200`:
```json
{ "token": "eyJhbG...", "expires_in": 3600, "user": { ... } }
```

### Create Production
```http
POST /api/v1/productions
Authorization: Bearer <token>

{
  "production_date": "2026-11-20",
  "items_produced": 5000,
  "units": "pcs",
  "notes": "Morning shift"
}
```

### P&L Report
```http
GET /api/v1/reports/pnl?start_date=2026-11-01&end_date=2026-11-20
Authorization: Bearer <token>
```

Response:
```json
{
  "period": { "start": "2026-11-01", "end": "2026-11-20" },
  "total_production_value": 125000.00,
  "total_expense": 42000.00,
  "profit_loss": 83000.00,
  "status": "PROFIT"
}
```

---

## 7. Security Design

1. **Passwords**: bcrypt hashed (cost 12), never stored plaintext.
2. **Authentication**: JWT access tokens (15 min expiry) + optional refresh tokens. Tokens passed in `Authorization: Bearer <token>`.
3. **Authorization**: Role-based middleware (`admin`, `manager`, `user`). Owners can modify their own records; admins/managers can modify all.
4. **Input validation**: Gin binding with struct tags; SQL injection prevented by GORM parameterized queries.
5. **CORS**: Configured for allowed origins.
6. **Secrets**: `JWT_SECRET` and `DB_*` loaded from `.env`, never committed.

---

## 8. Deployment & Operations

- **Local**: `go run cmd/server/main.go`
- **Docker**: `docker-compose up --build`
- **Env**: Copy `.env.example` to `.env` and fill values.
- **Migrations**: Run `migrations/0001_init.sql` against the database.
- **Health**: `GET /health` returns `{ "status": "ok" }`.

---

## 9. Project Structure

```
production-report-api/
├── cmd/server/main.go              # Application entry point
├── internal/config/config.go       # Env-based configuration
├── internal/database/db.go         # GORM connection
├── internal/models/                # GORM models (user, production, expense)
├── internal/handlers/              # HTTP handlers (auth, production, expense, summary)
├── internal/services/              # Business logic (auth, reports, P&L)
├── internal/middleware/            # Auth, RBAC, logger, recovery
├── internal/routes/routes.go       # Route registration
├── pkg/jwt/jwt.go                  # JWT sign/verify helpers
├── migrations/0001_init.sql        # Database schema
├── docker-compose.yml              # DB + app containers
├── Dockerfile                      # Multi-stage build
├── .env.example                    # Environment variables template
├── go.mod / go.sum                 # Go module definition
└── docs/SYSTEM_DESIGN.md           # This document
```
