// Why: Central module list keeps permission key generation deterministic across API and UI.
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

// Why: Action list defines operation capabilities available per module.
export const ACTIONS = ['view', 'create', 'update', 'delete', 'assign'];

// Behavior: Permission keys are generated in "<module>:<action>" format.
export const PERMISSIONS = MODULES.flatMap((module) =>
  ACTIONS.map((action) => `${module}:${action}`),
);

export const SYSTEM_ROLES = {
  // Why: SuperAdmin role name is referenced in guard logic and seed routines.
  SUPERADMIN: 'SuperAdmin',
};
