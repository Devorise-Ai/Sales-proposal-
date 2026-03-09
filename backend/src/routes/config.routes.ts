import { Router } from 'express';
import * as configController from '../controllers/config.controller';

const router = Router();

router.get('/', configController.getConfig);

export default router;
