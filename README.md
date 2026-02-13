# RBAC Project (Root Index)

Root folder only orchestration/index ke liye hai. Runtime configs app-level pe hain.

## Apps
- API: `apps/api` (docs: `apps/api/README.md`)
- Admin: `apps/admin` (docs: `apps/admin/README.md`)
- User: `apps/user` (docs: `apps/user/README.md`)

## Bootstrap Note
- First admin must signup from admin app before any admin login.

## Root Scripts
- `npm run dev:api`
- `npm run dev:admin`
- `npm run dev:user`
- `npm run build`
- `npm run test`

## Shared Non-runtime Assets
- Postman collection/environment in `postman/`