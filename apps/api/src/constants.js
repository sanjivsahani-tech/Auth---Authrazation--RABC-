export const MODULES = [
  'users',
  'roles',
  'permissions',
  'products',
  'categories',
  'customers',
  'shelves',
  'audit',
  'dashboard',
];

export const ACTIONS = ['view', 'create', 'update', 'delete', 'assign'];

export const PERMISSIONS = MODULES.flatMap((module) =>
  ACTIONS.map((action) => `${module}:${action}`),
);

export const SYSTEM_ROLES = {
  SUPERADMIN: 'SuperAdmin',
};