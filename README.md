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
npm run db:seed
```

Run the API and frontend in separate terminals:

```bash
npm run dev:backend
npm run dev
```

Open `http://localhost:5173`, with the admin portal at `http://localhost:5173/admin`. The API defaults to `http://localhost:4000/api/v1`.

The seed command creates or updates the initial administrator using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `backend/.env`. The password must contain at least 12 characters. Admin JWTs are stored in browser session storage and expire according to `JWT_EXPIRES_IN`.

Password reset email requires these `backend/.env` values:

```env
PASSWORD_RESET_TTL_MINUTES=30
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
EMAIL_FROM=Village View <no-reply@villageview.mn>
```

Forgot-password requests always return the same response to prevent account enumeration. Reset links contain a one-time random token; only its SHA-256 hash is stored in PostgreSQL. Successful resets invalidate all previous admin JWTs.

Authenticated administrators can invite additional administrators from the admin dashboard. An invited account remains inactive until its owner follows the emailed one-time link and creates a password. Invitations can be resent or cancelled. Accepted accounts can be disabled and re-enabled; the API prevents self-deactivation and prevents disabling the last active administrator.

## Backend structure

- `backend/src/common/`: response helpers, errors, async handling, validation, and security middleware.
- `backend/src/config/`: environment and Sequelize configuration.
- `backend/src/database/migrations/`: PostgreSQL schema migrations.
- `backend/src/modules/bookings/`: model, repository, CRUD service, business service, controller, validation, and routes.
- `backend/src/modules/auth/`: admin model and layered authentication services, controllers, validation, and routes.
- `backend/src/routes/`: API route composition.

Every successful controller response uses `sendSuccess()` and returns HTTP 200. Errors flow through the centralized error middleware. Confirmed bookings are protected against date overlap both in the business layer and by a PostgreSQL exclusion constraint.

## API routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/auth/login` | Authenticate an administrator |
| GET | `/api/v1/auth/me` | Restore the authenticated admin session |
| POST | `/api/v1/auth/forgot-password` | Email a one-time reset link |
| POST | `/api/v1/auth/reset-password` | Validate the token and replace the password |
| GET | `/api/v1/admin/users` | List administrator accounts and invitations |
| POST | `/api/v1/admin/users/invitations` | Invite a new administrator |
| POST | `/api/v1/admin/users/:id/invitations` | Resend a pending invitation |
| PATCH | `/api/v1/admin/users/:id` | Enable or disable an accepted administrator |
| DELETE | `/api/v1/admin/users/:id/invitation` | Cancel a pending invitation |
| GET | `/api/v1/bookings/availability` | Confirmed dates within a range |
| POST | `/api/v1/bookings` | Submit a pending booking |
| GET | `/api/v1/bookings/:id/confirmation` | Retrieve confirmation details |
| GET | `/api/v1/admin/bookings` | List bookings |
| POST | `/api/v1/admin/bookings` | Create a booking |
| PATCH | `/api/v1/admin/bookings/:id` | Edit dates, details, or status |
| DELETE | `/api/v1/admin/bookings/:id` | Delete a booking |

All `/api/v1/admin/*` endpoints require a valid admin bearer token. Login attempts are rate-limited and passwords are stored only as bcrypt hashes.
