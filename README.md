# Village View

Village View is a Vite React booking site with an Express/PostgreSQL backend. The API is organized as a layered modular monolith and uses Sequelize for persistence.

## Local setup

Create the PostgreSQL database itself, but do not create tables manually:

```sql
CREATE DATABASE village_view;
```

Then configure and migrate the application:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
npm install
npm --prefix backend install
npm run db:migrate
```

Run the API and frontend in separate terminals:

```bash
npm run dev:backend
npm run dev
```

Open `http://localhost:5173`, with the admin portal at `http://localhost:5173/admin`. The API defaults to `http://localhost:4000/api/v1`.

## Backend structure

- `backend/src/common/`: response helpers, errors, async handling, validation, and security middleware.
- `backend/src/config/`: environment and Sequelize configuration.
- `backend/src/database/migrations/`: PostgreSQL schema migrations.
- `backend/src/modules/bookings/`: model, repository, CRUD service, business service, controller, validation, and routes.
- `backend/src/routes/`: API route composition.

Every successful controller response uses `sendSuccess()` and returns HTTP 200. Errors flow through the centralized error middleware. Confirmed bookings are protected against date overlap both in the business layer and by a PostgreSQL exclusion constraint.

## API routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/bookings/availability` | Confirmed dates within a range |
| POST | `/api/v1/bookings` | Submit a pending booking |
| GET | `/api/v1/bookings/:id/confirmation` | Retrieve confirmation details |
| GET | `/api/v1/admin/bookings` | List bookings |
| POST | `/api/v1/admin/bookings` | Create a booking |
| PATCH | `/api/v1/admin/bookings/:id` | Edit dates, details, or status |
| DELETE | `/api/v1/admin/bookings/:id` | Delete a booking |

Admin authentication is not implemented yet. Protect `/api/v1/admin/*` before exposing the API publicly.
