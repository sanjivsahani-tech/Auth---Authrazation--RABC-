# API Architecture Guide

This document explains how the backend is built, in simple English.

## 1) Purpose
This backend serves both frontend apps:
- Admin app
- User app

Both apps call the same API base: `http://localhost:4000/api/v1`.

## 2) Tech Stack
- Node.js
- Express
- MongoDB + Mongoose
- Zod (request validation)
- JWT (access token)
- Refresh token rotation (httpOnly cookie)
- Role-Based Access Control (RBAC)
- Audit logging

## 3) Startup Flow
File: `src/server.js`

1. Connect MongoDB
2. Seed system role data (`SuperAdmin` role + all permissions)
3. Create Express app
4. Start server on configured port

## 4) Express App Setup
File: `src/app.js`

Middlewares used:
- `helmet` for security headers
- `cors` with allow-list from env
- `express.json` for JSON body parsing
- `cookie-parser` for refresh cookie
- `morgan` for request logs
- `express-rate-limit` for auth endpoints

Rate limit applied on:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`

## 5) Folder Structure (Current)
- `src/config` -> env, db, logger
- `src/models` -> MongoDB schema models
- `src/middleware` -> auth, permission check, error handler
- `src/routes/admin` -> admin auth + management + audit routes
- `src/routes/user` -> dashboard + business CRUD routes
- `src/seed` -> startup role seeding
- `src/utils` -> jwt, password, audit, pagination helpers

Note: Current code is route-centric (logic is mostly inside route files).

## 6) Routing Map
Main router file: `src/routes/index.js`

- Mounts admin routes
- Mounts user routes

### Admin route files
- `src/routes/admin/auth.js`
- `src/routes/admin/management.js`
- `src/routes/admin/audit.js`

### User route files
- `src/routes/user/dashboard.js`
- `src/routes/user/resources.js`

## 7) Authentication Design

### Access Token
- JWT token
- Sent in header: `Authorization: Bearer <token>`
- Verified by middleware: `src/middleware/auth.js`

### Refresh Token
- Opaque random token
- Sent in cookie: `refreshToken`
- Cookie: `httpOnly`, `sameSite=lax`, secure based on env
- Stored in DB as hash (`refresh_tokens` collection)
- Rotated on each refresh

### First Admin Signup Gate
- Before first admin exists, login is blocked.
- First admin must signup once.
- Then signup closes.

Codes used:
- `SIGNUP_REQUIRED`
- `SIGNUP_CLOSED`

## 8) RBAC (Roles and Permissions)
Permission format:
- `<module>:<action>`
- Example: `users:create`, `roles:assign`, `products:update`

Permission list source:
- `src/constants.js`

Request authorization flow:
1. `requireAuth` validates token and loads user with roles
2. Permissions are flattened from all user roles
3. `requirePermission('x:y')` checks route access

## 9) Special Protection Rules
Implemented in `src/routes/admin/management.js`:
- SuperAdmin role cannot be edited (`ROLE_PROTECTED`)
- SuperAdmin user role cannot be changed (`ROLE_PROTECTED`)
- User role assignment accepts exactly one role (`ROLE_ASSIGNMENT_INVALID`)
- On role change, active refresh tokens of that user are revoked

## 10) Business Modules
User/business CRUD modules:
- Categories
- Shelves
- Products
- Customers

Common list query support:
- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`

## 11) Dashboard Behavior
Endpoint: `GET /dashboard/summary`

Behavior depends on header `x-app-context`:
- `admin` -> returns admin summary (`userCount`, `roleCount`, `recentAudit`)
- `user` -> returns business summary (`products`, `categories`, `customers`, `shelves`)

## 12) Audit Logging
Audit entries are written for create/update/delete and auth events.

Stored fields include:
- actor user
- module
- action
- entity
- before/after
- request metadata

Audit read endpoint:
- `GET /audit-logs`

## 13) Error Handling
File: `src/middleware/error.js`

Common format:
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Message",
  "details": null
}
```

Examples:
- validation error -> `VALIDATION_ERROR`
- duplicate unique key -> `CONFLICT`
- not found -> `NOT_FOUND`
- unauthorized -> `UNAUTHORIZED`
- forbidden -> `FORBIDDEN`

## 14) Data Models (High-level)
- `User`
- `Role`
- `RefreshToken`
- `Category`
- `Shelf`
- `Product`
- `Customer`
- `AuditLog`

## 15) Environment Variables
Required:
- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Common optional:
- `PORT` (default 4000)
- `ACCESS_TOKEN_TTL` (default `15m`)
- `REFRESH_TOKEN_TTL_DAYS` (default `7`)
- `CORS_ORIGINS`
- `COOKIE_SECURE`

## 16) Testing
Main integration tests:
- `tests/api.integration.test.js`

Run:
```bash
cd apps/api
npm run test
```

## 17) Quick Mental Model
- Route receives request
- Validate input with Zod
- Check auth + permission
- Run DB logic
- Write audit (for mutating actions)
- Return standard JSON response
