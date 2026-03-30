import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createTitleBodySchema,
  titleIdParamSchema,
  titlesQuerySchema,
  updateTitleBodySchema,
} from './titles.schemas';
import { TitlesController } from './titles.controller';

const router = Router();
const controller = new TitlesController();

router.get(
  '/',
  validate({ query: titlesQuerySchema }),
  asyncHandler((req, res) => controller.listTitles(req, res))
);
router.get(
  '/:id/aggregate',
  validate({ params: titleIdParamSchema }),
  asyncHandler((req, res) => controller.getAggregate(req, res))
);
router.get(
  '/:id',
  validate({ params: titleIdParamSchema }),
  asyncHandler((req, res) => controller.getTitle(req, res))
);

router.post(
  '/admin/titles',
  authMiddleware,
  requireRole('ADMIN'),
  validate({ body: createTitleBodySchema }),
  asyncHandler((req, res) => controller.create(req, res))
);

router.patch(
  '/admin/titles/:id',
  authMiddleware,
  requireRole('ADMIN'),
  validate({ params: titleIdParamSchema, body: updateTitleBodySchema }),
  asyncHandler((req, res) => controller.update(req, res))
);

router.delete(
  '/admin/titles/:id',
  authMiddleware,
  requireRole('ADMIN'),
  validate({ params: titleIdParamSchema }),
  asyncHandler((req, res) => controller.softDelete(req, res))
);

export default router;
