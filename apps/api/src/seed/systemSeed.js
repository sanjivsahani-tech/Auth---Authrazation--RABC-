import { PERMISSIONS, SYSTEM_ROLES } from '../constants.js';
import { Role } from '../models/Role.js';

export async function seedSystemData() {
  // Why: Idempotent upsert guarantees SuperAdmin role exists in every environment.
  // Risk: Missing system role would block first-admin signup and management workflows.
  await Role.findOneAndUpdate(
    { name: SYSTEM_ROLES.SUPERADMIN },
    {
      $set: {
        description: 'System super administrator',
        permissionKeys: PERMISSIONS,
        isSystem: true,
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
}
