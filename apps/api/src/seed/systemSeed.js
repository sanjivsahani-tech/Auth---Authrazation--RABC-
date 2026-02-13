import { PERMISSIONS, SYSTEM_ROLES } from '../constants.js';
import { Role } from '../models/Role.js';

export async function seedSystemData() {
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
