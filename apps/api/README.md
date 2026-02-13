# API App

Node.js + Express + MongoDB backend for RBAC app.

## Install
`npm install`

## Env
Copy `.env.example` to `.env` and fill values.

Note: first admin user is **not auto-created** from env.

## Commands
- `npm run dev` start dev server
- `npm run start` start prod server
- `npm run lint` lint API code
- `npm run test` run integration tests
- `npm run test:watch` run tests in watch mode

## API Base URL
`http://localhost:4000/api/v1`

## Signup-First Auth Endpoints
- `GET /api/v1/auth/admin-signup-status`
- `POST /api/v1/auth/admin-signup`
- `POST /api/v1/auth/login` (blocked with `SIGNUP_REQUIRED` until first signup)