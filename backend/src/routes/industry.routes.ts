import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as industryController from '../controllers/industry.controller';

const router = Router();

router.use(authMiddleware);
router.get('/', industryController.getAll);
router.get('/:id', industryController.getById);

export default router;
