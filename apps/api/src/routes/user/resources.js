import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { parseListQuery } from '../../utils/pagination.js';
import { logAudit } from '../../utils/audit.js';
import { Category } from '../../models/Category.js';
import { Shelf } from '../../models/Shelf.js';
import { Product } from '../../models/Product.js';
import { Customer } from '../../models/Customer.js';

function createCrudRoutes({ router, model, moduleName, createSchema, searchFields = ['name'], populate = '' }) {
  router.post(
    `/${moduleName}`,
    requireAuth,
    requirePermission(`${moduleName}:create`),
    asyncHandler(async (req, res) => {
      const payload = createSchema.parse(req.body);
      const item = await model.create(payload);
      await logAudit(req, { module: moduleName, action: 'create', entityId: item._id, after: item.toObject() });
      return res.status(201).json({ success: true, data: item });
    }),
  );

  router.get(
    `/${moduleName}`,
    requireAuth,
    requirePermission(`${moduleName}:view`),
    asyncHandler(async (req, res) => {
      const { page, limit, skip, sort, search } = parseListQuery(req.query);
      const filter =
        search && searchFields.length
          ? { $or: searchFields.map((f) => ({ [f]: { $regex: search, $options: 'i' } })) }
          : {};

      const query = model.find(filter).sort(sort).skip(skip).limit(limit);
      if (populate) query.populate(populate);

      const [items, total] = await Promise.all([query.lean(), model.countDocuments(filter)]);
      return res.json({ success: true, data: { items, pagination: { page, limit, total } } });
    }),
  );

  router.patch(
    `/${moduleName}/:id`,
    requireAuth,
    requirePermission(`${moduleName}:update`),
    asyncHandler(async (req, res) => {
      const payload = createSchema.partial().parse(req.body);
      const before = await model.findById(req.params.id).lean();
      if (!before) {
        return res.status(404).json({ success: false, code: 'NOT_FOUND', message: `${moduleName} not found` });
      }
      const query = model.findByIdAndUpdate(
        req.params.id,
        { $set: payload },
        { returnDocument: 'after' },
      );
      if (populate) query.populate(populate);
      const item = await query;
      await logAudit(req, { module: moduleName, action: 'update', entityId: item._id, before, after: item.toObject() });
      return res.json({ success: true, data: item });
    }),
  );

  router.delete(
    `/${moduleName}/:id`,
    requireAuth,
    requirePermission(`${moduleName}:delete`),
    asyncHandler(async (req, res) => {
      const item = await model.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ success: false, code: 'NOT_FOUND', message: `${moduleName} not found` });
      }
      await model.deleteOne({ _id: item._id });
      await logAudit(req, { module: moduleName, action: 'delete', entityId: item._id, before: item.toObject() });
      return res.json({ success: true, message: `${moduleName} deleted` });
    }),
  );
}

const router = Router();

createCrudRoutes({
  router,
  model: Category,
  moduleName: 'categories',
  createSchema: z.object({ name: z.string().min(2), description: z.string().optional(), isActive: z.boolean().optional() }),
  searchFields: ['name', 'description'],
});

createCrudRoutes({
  router,
  model: Shelf,
  moduleName: 'shelves',
  createSchema: z.object({ code: z.string().min(1), name: z.string().min(2), locationNote: z.string().optional(), isActive: z.boolean().optional() }),
  searchFields: ['code', 'name', 'locationNote'],
});

createCrudRoutes({
  router,
  model: Product,
  moduleName: 'products',
  createSchema: z.object({
    sku: z.string().min(1),
    name: z.string().min(2),
    categoryId: z.string().min(1),
    price: z.number().min(0),
    stock: z.number().min(0),
    shelfId: z.string().min(1),
    isActive: z.boolean().optional(),
  }),
  searchFields: ['sku', 'name'],
  populate: 'categoryId shelfId',
});

createCrudRoutes({
  router,
  model: Customer,
  moduleName: 'customers',
  createSchema: z.object({
    name: z.string().min(2),
    phone: z.string().min(3),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  searchFields: ['name', 'phone', 'email', 'address'],
});

export default router;
