import request from 'supertest';
import mongoose from 'mongoose';

import { createApp } from '../src/app.js';
import { connectDb } from '../src/config/db.js';
import { seedSystemData } from '../src/seed/systemSeed.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { Role } from '../src/models/Role.js';
import { User } from '../src/models/User.js';
import { SYSTEM_ROLES } from '../src/constants.js';

const app = createApp();

const firstAdminPayload = {
  name: 'First Admin',
  email: 'admin@example.com',
  phone: '9999999999',
  password: 'Admin@123456',
};

async function signupFirstAdmin() {
  const res = await request(app).post('/api/v1/auth/admin-signup').send(firstAdminPayload);
  return {
    token: res.body?.data?.accessToken,
    cookie: res.headers['set-cookie'],
    user: res.body?.data?.user,
  };
}

beforeAll(async () => {
  await connectDb();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
  await seedSystemData();
});

describe('Auth + first admin signup gate', () => {
  it('returns canSignup=true when no admin exists', async () => {
    const res = await request(app).get('/api/v1/auth/admin-signup-status');
    expect(res.status).toBe(200);
    expect(res.body.data.canSignup).toBe(true);
  });

  it('blocks login before first signup with SIGNUP_REQUIRED', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: firstAdminPayload.email,
      password: firstAdminPayload.password,
    });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('SIGNUP_REQUIRED');
  });

  it('creates first admin via signup and returns token', async () => {
    const signupRes = await request(app).post('/api/v1/auth/admin-signup').send(firstAdminPayload);

    expect(signupRes.status).toBe(201);
    expect(signupRes.body.data.accessToken).toBeTruthy();
    expect(signupRes.body.data.user.email).toBe(firstAdminPayload.email);

    const statusRes = await request(app).get('/api/v1/auth/admin-signup-status');
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.canSignup).toBe(false);
  });

  it('rejects second signup with SIGNUP_CLOSED', async () => {
    await request(app).post('/api/v1/auth/admin-signup').send(firstAdminPayload);

    const second = await request(app).post('/api/v1/auth/admin-signup').send({
      name: 'Second Admin',
      email: 'another@example.com',
      phone: '8888888888',
      password: 'Admin@654321',
    });

    expect(second.status).toBe(409);
    expect(second.body.code).toBe('SIGNUP_CLOSED');
  });

  it('allows login after signup and records signup audit', async () => {
    await request(app).post('/api/v1/auth/admin-signup').send(firstAdminPayload);

    const login = await request(app).post('/api/v1/auth/login').send({
      email: firstAdminPayload.email,
      password: firstAdminPayload.password,
    });

    expect(login.status).toBe(200);
    expect(login.body.data.accessToken).toBeTruthy();

    const logs = await AuditLog.find({}).lean();
    const hasSignupAudit = logs.some((l) => l.module === 'auth' && l.action === 'signup');
    expect(hasSignupAudit).toBe(true);
  });

  it('does not allow editing SuperAdmin role', async () => {
    const signup = await request(app).post('/api/v1/auth/admin-signup').send(firstAdminPayload);
    const token = signup.body.data.accessToken;
    const superAdminRole = await Role.findOne({ name: SYSTEM_ROLES.SUPERADMIN }).lean();

    const res = await request(app)
      .patch(`/api/v1/roles/${superAdminRole._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Updated should fail' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('ROLE_PROTECTED');
  });
});

describe('RBAC + CRUD after admin signup', () => {
  it('returns 403 when user lacks permission', async () => {
    const admin = await signupFirstAdmin();

    const roleRes = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'LimitedRole',
        description: 'Limited',
        permissionKeys: ['dashboard:view'],
      });

    expect(roleRes.status).toBe(201);

    const userRes = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'Limited User',
        email: 'limited@example.com',
        password: 'Password@123',
        phone: '1234567890',
        roleIds: [roleRes.body.data._id],
      });

    expect(userRes.status).toBe(201);

    const limitedLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'limited@example.com',
      password: 'Password@123',
    });

    const createCategory = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${limitedLogin.body.data.accessToken}`)
      .send({ name: 'Forbidden Category', description: 'x' });

    expect(createCategory.status).toBe(403);
    expect(createCategory.body.code).toBe('FORBIDDEN');
  });

  it('returns 409 conflict for duplicate unique fields', async () => {
    const admin = await signupFirstAdmin();

    const one = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'Electronics', description: 'A' });

    expect(one.status).toBe(201);

    const two = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'Electronics', description: 'B' });

    expect(two.status).toBe(409);
    expect(two.body.code).toBe('CONFLICT');
  });

  it('writes audit log entries for role assignment and resource creation', async () => {
    const admin = await signupFirstAdmin();

    const role = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'ManagerRole',
        description: 'Manager',
        permissionKeys: ['dashboard:view', 'categories:view', 'categories:create'],
      });

    const user = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'Manager User',
        email: 'manager@example.com',
        password: 'Password@123',
        phone: '1234509876',
        roleIds: [role.body.data._id],
      });

    const assign = await request(app)
      .patch(`/api/v1/users/${user.body.data._id}/roles`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ roleIds: [role.body.data._id] });

    expect(assign.status).toBe(200);

    const createCategory = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'AuditCategory', description: 'Tracked' });

    expect(createCategory.status).toBe(201);

    const logs = await AuditLog.find({}).lean();
    const hasRoleAssign = logs.some((l) => l.module === 'roles' && l.action === 'assign');
    const hasCategoryCreate = logs.some((l) => l.module === 'categories' && l.action === 'create');

    expect(hasRoleAssign).toBe(true);
    expect(hasCategoryCreate).toBe(true);
  });

  it('refresh rotates token and logout revokes session', async () => {
    const signup = await signupFirstAdmin();
    const cookie = signup.cookie;
    expect(cookie).toBeTruthy();

    const refreshRes = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie);
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeTruthy();

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', refreshRes.headers['set-cookie'] || cookie);
    expect(logoutRes.status).toBe(200);

    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshRes.headers['set-cookie'] || cookie);
    expect(reuseRes.status).toBe(401);
  });

  it('returns ROLE_ASSIGNMENT_INVALID when assigning more than one role', async () => {
    const admin = await signupFirstAdmin();

    const role1 = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'RoleOne',
        description: 'Role one',
        permissionKeys: ['dashboard:view'],
      });
    const role2 = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'RoleTwo',
        description: 'Role two',
        permissionKeys: ['dashboard:view'],
      });

    const targetUser = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'Role Target',
        email: 'role-target@example.com',
        password: 'Password@123',
        phone: '9876543210',
        roleIds: [role1.body.data._id],
      });

    const assign = await request(app)
      .patch(`/api/v1/users/${targetUser.body.data._id}/roles`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ roleIds: [role1.body.data._id, role2.body.data._id] });

    expect(assign.status).toBe(400);
    expect(assign.body.code).toBe('ROLE_ASSIGNMENT_INVALID');
  });

  it('returns ROLE_PROTECTED when changing SuperAdmin user roles', async () => {
    const admin = await signupFirstAdmin();
    const superAdminUser = await User.findOne({ email: firstAdminPayload.email }).lean();

    const role = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'StaffRole',
        description: 'Staff',
        permissionKeys: ['dashboard:view'],
      });

    const assign = await request(app)
      .patch(`/api/v1/users/${superAdminUser._id}/roles`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ roleIds: [role.body.data._id] });

    expect(assign.status).toBe(400);
    expect(assign.body.code).toBe('ROLE_PROTECTED');
  });
});
