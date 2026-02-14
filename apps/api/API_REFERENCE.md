# API Reference

Base URL: `http://localhost:4000/api/v1`

Auth style:
- Access token: `Authorization: Bearer {{accessToken}}`
- Refresh token: `refreshToken` httpOnly cookie

Common success shape:
```json
{ "success": true, "data": { } }
```

Common error shape:
```json
{ "success": false, "code": "ERROR_CODE", "message": "...", "details": null }
```

## 1) Auth Endpoints

### GET `/auth/admin-signup-status`
Returns if first admin signup is allowed.

Response:
```json
{ "success": true, "data": { "canSignup": true } }
```

### POST `/auth/admin-signup`
Creates first admin only.

Body:
```json
{
  "name": "First Admin",
  "email": "admin@example.com",
  "phone": "9999999999",
  "password": "Admin@123456"
}
```

Responses:
- `201` success + access token + user
- `409 SIGNUP_CLOSED` if admin already exists
- `500 ROLE_NOT_READY` if SuperAdmin role missing

### POST `/auth/login`
Login with email/password.

Body:
```json
{ "email": "admin@example.com", "password": "Admin@123456" }
```

Responses:
- `200` success + access token + user
- `403 SIGNUP_REQUIRED` if first signup not done yet
- `401 INVALID_CREDENTIALS`

### POST `/auth/refresh`
Uses refresh cookie, rotates refresh token, returns new access token.

Response:
```json
{ "success": true, "data": { "accessToken": "..." } }
```

### POST `/auth/logout`
Revokes current refresh token and clears cookie.

### GET `/auth/me`
Requires access token. Returns authenticated user profile + permissions.

### POST `/auth/force-logout/:userId`
Revokes all active refresh sessions for target user.

## 2) Dashboard

### GET `/dashboard/summary`
Permission required: `dashboard:view`

Header required:
- `x-app-context: admin` or `x-app-context: user`

Admin response data:
- `userCount`
- `roleCount`
- `recentAudit`

User response data:
- `products`
- `categories`
- `customers`
- `shelves`

## 3) Permissions

### GET `/permissions`
Permission required: `permissions:view`

Returns all system permission keys.

## 4) Roles

### POST `/roles`
Permission required: `roles:create`

Body:
```json
{
  "name": "Manager",
  "description": "Manager role",
  "permissionKeys": ["dashboard:view", "categories:view", "categories:create"]
}
```

### GET `/roles`
Permission required: `roles:view`

Query params:
- `page`, `limit`, `search`, `sortBy`, `sortOrder`

### PATCH `/roles/:id`
Permission required: `roles:update`

Body can include:
- `name`
- `description`
- `permissionKeys`

Special rule:
- SuperAdmin role cannot be edited -> `400 ROLE_PROTECTED`

### DELETE `/roles/:id`
Permission required: `roles:delete`

Special rule:
- System role cannot be deleted -> `400 BAD_REQUEST`

## 5) Users

### POST `/users`
Permission required: `users:create`

Body:
```json
{
  "name": "User One",
  "email": "user1@example.com",
  "phone": "9876543210",
  "password": "Password@123",
  "roleIds": ["<roleId>"]
}
```

### GET `/users`
Permission required: `users:view`

Query params:
- `page`, `limit`, `search`, `sortBy`, `sortOrder`

### PATCH `/users/:id`
Permission required: `users:update`

Body fields (optional):
- `name`
- `phone`
- `isActive`

### PATCH `/users/:id/roles`
Permission required: `roles:assign`

Body:
```json
{ "roleIds": ["<roleId>"] }
```

Special rules:
- Exactly one role required -> `400 ROLE_ASSIGNMENT_INVALID`
- SuperAdmin user role cannot be changed -> `400 ROLE_PROTECTED`
- On success, target user refresh sessions are revoked

## 6) Categories

### POST `/categories`
Permission required: `categories:create`

Body:
```json
{ "name": "Electronics", "description": "Devices", "isActive": true }
```

### GET `/categories`
Permission required: `categories:view`

### PATCH `/categories/:id`
Permission required: `categories:update`

### DELETE `/categories/:id`
Permission required: `categories:delete`

## 7) Shelves

### POST `/shelves`
Permission required: `shelves:create`

Body:
```json
{ "code": "A-1", "name": "Shelf A", "locationNote": "Near gate", "isActive": true }
```

### GET `/shelves`
Permission required: `shelves:view`

### PATCH `/shelves/:id`
Permission required: `shelves:update`

### DELETE `/shelves/:id`
Permission required: `shelves:delete`

## 8) Products

### POST `/products`
Permission required: `products:create`

Body:
```json
{
  "sku": "SKU-100",
  "name": "Phone",
  "categoryId": "<categoryId>",
  "price": 12000,
  "stock": 5,
  "shelfId": "<shelfId>",
  "isActive": true
}
```

### GET `/products`
Permission required: `products:view`

### PATCH `/products/:id`
Permission required: `products:update`

### DELETE `/products/:id`
Permission required: `products:delete`

## 9) Customers

### POST `/customers`
Permission required: `customers:create`

Body:
```json
{
  "name": "Customer One",
  "phone": "9999999999",
  "email": "customer@example.com",
  "address": "Delhi",
  "isActive": true
}
```

### GET `/customers`
Permission required: `customers:view`

### PATCH `/customers/:id`
Permission required: `customers:update`

### DELETE `/customers/:id`
Permission required: `customers:delete`

## 10) Audit Logs

### GET `/audit-logs`
Permission required: `audit:view`

Query params:
- `page`, `limit`, `search`, `sortBy`, `sortOrder`

Returns logs with actor user info (`name`, `email`).

## 11) Pagination Query Standard (all list APIs)
Use these query params where list endpoints support it:
- `page` default `1`
- `limit` default `10`
- `search` optional text
- `sortBy` default `createdAt`
- `sortOrder` `asc` or `desc`

Example:
```http
GET /products?page=1&limit=10&search=phone&sortBy=createdAt&sortOrder=desc
```

## 12) Important Error Codes
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `VALIDATION_ERROR`
- `INVALID_CREDENTIALS`
- `INVALID_REFRESH`
- `SIGNUP_REQUIRED`
- `SIGNUP_CLOSED`
- `ROLE_PROTECTED`
- `ROLE_ASSIGNMENT_INVALID`

## 13) Testing and Postman
- Integration tests: `apps/api/tests/api.integration.test.js`
- Postman collection: `postman/rbac-app.postman_collection.json`
- Postman local env: `postman/rbac-app-local.postman_environment.json`
