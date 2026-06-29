# Repository Guidelines

## Project Structure & Module Organization

This repository contains a Vite React frontend and an Express/PostgreSQL API. Frontend routes live in `src/pages/`, reusable UI in `src/components/`, and API/date helpers in `src/lib/`. The layered modular monolith is under `backend/src/`: common middleware, configuration, migrations, and modular booking/auth repositories, CRUD services, business services, controllers, validation, and routes. Local photography remains in `images/`.

## Build, Test, and Development Commands

Install dependencies and start the development server with:

```bash
npm install
npm --prefix backend install
npm run dev
```

Run `npm run dev:backend` separately for the API. After configuring database, JWT, admin seed, and SMTP values in `backend/.env`, run `npm run db:migrate` and `npm run db:seed`. Use `npm run build` for a frontend production bundle. Admin routes include `/admin/login`, `/admin/forgot-password`, `/admin/reset-password`, and `/admin`.

## Coding Style & Naming Conventions

Use ESM, functional React components, two-space indentation, and UTF-8 encoding. Name components in PascalCase, variables in camelCase, and route files with a `Page.jsx` suffix. Backend controllers must use `asyncHandler` and `sendSuccess`; keep persistence in repositories/CRUD services and business rules in business services. Validate route input with Zod.

## Testing Guidelines

There is no automated test suite. Before submitting, run `npm run build`, migrate a test database, and manually test public booking, availability, confirmation, admin editing, and date conflicts. Check API error responses, narrow mobile and wide desktop layouts, and both browser and server consoles.

## Commit & Pull Request Guidelines

No usable Git history is present, so no repository-specific commit pattern can be inferred. Use short, imperative subjects such as `Add responsive footer layout`, and keep unrelated changes in separate commits. Pull requests should summarize the user-visible result, list manual checks performed, and link related issues. Include before-and-after screenshots for layout or styling changes, with both mobile and desktop views when responsiveness is affected.

## External Resources

Font Awesome currently loads from a third-party CDN. Do not commit secrets or API keys into HTML, CSS, or client-side scripts. Document any new external service and explain why it is required.
