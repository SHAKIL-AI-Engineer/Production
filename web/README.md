# FactoryOps web

Responsive production and expense reporting built with Next.js, React, Tailwind, and Radix UI. The dashboard uses the Go API in the repository root; displayed reports contain persisted records rather than template data.

## Run locally

Use Node.js 22+ and Go 1.25+. From the repository root, start the API (SQLite is convenient for local development):

```sh
DB_DRIVER=sqlite DB_PATH=./data/production.db go run ./cmd/server
```

For PostgreSQL, configure the root `.env` using the root `.env.example` instead. Keep your existing database configuration when working with production data.

In a second terminal:

```sh
cd web
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The web app proxies `/api/v1/*` to the Go API at `http://127.0.0.1:8080`, so it works when opened from another device as well. Set `API_PROXY_URL` in `.env.local` to change the backend address and restart Next.js. `NEXT_PUBLIC_API_URL` is an optional direct-API alternative that requires matching CORS configuration.

Sign in with an existing API account. For a new local database, create a standard account through the API:

```sh
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"operator@example.com","password":"replace-with-your-own-password"}'
```

The web UI does not offer role changes or team editing because the API does not provide those endpoints. Old `/dashboard/users` bookmarks redirect to account settings.

## Pages and behavior

- `/dashboard`: monthly overview, production/expense trends, category breakdown, and recent activity.
- `/dashboard/production`: date-filtered daily production, search, quantities grouped by unit, sorting, pagination, CSV export, and record creation/editing/deletion.
- `/dashboard/expenses`: date and category filters, search, expense totals, CSV export, and record creation/editing/deletion.
- `/dashboard/monthly-expenses`: calendar-month totals, daily spending chart, category breakdown, daily ledger, and transaction/ledger exports.
- `/dashboard/summary`: monthly production and expense statement, estimated net, and category totals.
- `/dashboard/settings`: persistent light/dark/system appearance and current account information.

The mobile sidebar closes after navigation. Search pages with the search button or Ctrl/Cmd+K; toggle the sidebar with Ctrl/Cmd+B. Keyboard focus, dialog labels, empty/loading/error states, delete confirmation, and reduced motion are supported. Tables scroll within their panels on narrow screens.

Sessions remain in the current browser tab via `sessionStorage`. The API checks the token on reload; signing out removes both the token and displayed private records. Expired tokens return the workspace to the sign-in state.

Reports use your device’s calendar for date selection and USD for amounts. The existing API estimates production value at **$25 per recorded item**, including records with different units. Estimated net equals that estimate minus expenses; it is not realized sales or accounting profit. Mixed-unit periods display an additional note, and daily production keeps quantities separated by unit.

## Checks

```sh
npm run lint
npm test
npm run build
```

From the repository root, run `go test ./...` for the API checks. Frontend regression tests cover the Go response format, authentication headers, cancellation, 204 deletion responses, date boundaries, DST, aggregation, and formatting.

Browser verification should cover sign-in, create/edit/delete, exports, date/category/search filters, changing months, API-error retry, sign-out, and all pages at 320px, 375px, 768px, 1024px, and desktop widths in both themes.

## Vercel deployment

The repository-root `vercel.json` deploys the Next.js frontend and Go backend together with Vercel Services (beta). Deploy from the repository root. Public `/api/v1/*` and `/health` requests go to the Go service; other routes go to Next.js.

Connect a PostgreSQL database and set `DATABASE_URL` (or `POSTGRES_URL`) and an encrypted `JWT_SECRET` in the Vercel project. Set `APP_ENV=production`. The API honors Vercel's assigned `PORT`, and PostgreSQL URLs preserve SSL settings. SQLite files are for local development only.

For the first login, open **Sign in → New here? Create an account**. Self-registration creates a standard user account. Existing API accounts can sign in directly.
