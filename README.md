# Production Report REST API

Go + Gin REST API for daily production, daily expense, Profit & Loss, and summary reporting with JWT authentication and role-based access control.

## Features

- User registration & login (JWT)
- Role-based access control (admin, manager, user)
- Daily production CRUD
- Daily expense CRUD
- Profit & Loss report
- Summary & dashboard KPIs
- SQLite (dev) / PostgreSQL (prod) via GORM
- Docker & Docker Compose ready

## Quick Start (Local)

```bash
# 1. Enter the project
cd production-report-api

# 2. Copy environment variables
copy .env.example .env   # Windows
# cp .env.example .env   # Linux/Mac

# 3. Install dependencies
go mod tidy

# 4. Run the server
go run cmd/server/main.go
```

Server starts on `http://localhost:8080`.

## API Examples

Register:
```bash
curl -X POST http://localhost:8080/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@factory.com\",\"password\":\"AdminPass123!\",\"role\":\"admin\"}"
```

Login:
```bash
curl -X POST http://localhost:8080/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@factory.com\",\"password\":\"AdminPass123!\"}"
```

Create production (replace `<TOKEN>`):
```bash
curl -X POST http://localhost:8080/api/v1/productions ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"production_date\":\"2026-11-20\",\"items_produced\":5000,\"units\":\"pcs\",\"notes\":\"Morning shift\"}"
```

P&L report:
```bash
curl "http://localhost:8080/api/v1/reports/pnl?start_date=2026-11-01&end_date=2026-11-20" ^
  -H "Authorization: Bearer <TOKEN>"
```

## Docker

```bash
docker-compose up --build
```

## Project Structure

See `docs/SYSTEM_DESIGN.md` for the full architecture and API contract.
