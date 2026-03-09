import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import * as proposalController from '../controllers/proposal.controller';

const router = Router();

const createSchema = z.object({
  clientCompany: z.string().min(1, 'Client company is required'),
  clientContact: z.string().optional(),
  clientRole: z.string().optional(),
  clientNarrative: z.string().optional(),
  industryId: z.string().min(1, 'Industry is required'),
  moduleIds: z.array(z.string()).min(1, 'At least one module is required'),
  currency: z.enum(['JOD', 'USD']),
  isTaxEnabled: z.boolean(),
  infrastructureType: z
    .enum(['integration_only', 'system_creation'])
    .nullable(),
  hostingProvider: z
    .enum(['devorise', 'client_aws', 'client_gcp'])
    .nullable(),
  bulkMessaging: z.boolean(),
  channels: z.array(z.string()).default([]),
});

const updateSchema = z.object({
  clientCompany: z.string().min(1).optional(),
  clientContact: z.string().optional(),
  clientRole: z.string().optional(),
  clientNarrative: z.string().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'expired']).optional(),
  currency: z.enum(['JOD', 'USD']).optional(),
  isTaxEnabled: z.boolean().optional(),
  infrastructureType: z
    .enum(['integration_only', 'system_creation'])
    .nullable()
    .optional(),
  hostingProvider: z
    .enum(['devorise', 'client_aws', 'client_gcp'])
    .nullable()
    .optional(),
  bulkMessaging: z.boolean().optional(),
  channels: z.array(z.string()).optional(),
  moduleIds: z.array(z.string()).min(1).optional(),
  industryId: z.string().optional(),
});

const calculateSchema = z.object({
  moduleIds: z.array(z.string()).min(1, 'At least one module is required'),
  currency: z.enum(['JOD', 'USD']),
  isTaxEnabled: z.boolean(),
  infrastructureType: z
    .enum(['integration_only', 'system_creation'])
    .nullable(),
  bulkMessaging: z.boolean(),
});

router.use(authMiddleware);
router.get('/', proposalController.getAll);
router.get('/:id', proposalController.getById);
router.post('/', validate(createSchema), proposalController.create);
router.put('/:id', validate(updateSchema), proposalController.update);
router.delete('/:id', proposalController.remove);
router.post(
  '/calculate',
  validate(calculateSchema),
  proposalController.calculatePricing,
);

export default router;
