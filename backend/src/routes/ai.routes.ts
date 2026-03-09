import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import * as aiController from '../controllers/ai.controller';

const router = Router();

const generateSchema = z.object({
  clientCompany: z.string().min(1),
  clientContact: z.string().optional(),
  clientRole: z.string().optional(),
  industryName: z.string().min(1),
  selectedModules: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
      }),
    )
    .min(1),
  totalSetup: z.number(),
  totalMonthly: z.number(),
  totalYearly: z.number(),
  currency: z.enum(['JOD', 'USD']),
});

router.use(authMiddleware);
router.post('/generate', validate(generateSchema), aiController.generate);

export default router;
