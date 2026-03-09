import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import * as userController from '../controllers/user.controller';

const router = Router();

const updateSchema = z.object({
  fullName: z.string().min(1).optional(),
  companyName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

router.use(authMiddleware);
router.get('/me', userController.getMe);
router.put('/me', validate(updateSchema), userController.updateMe);
router.put(
  '/me/password',
  validate(changePasswordSchema),
  userController.changePassword,
);

export default router;
