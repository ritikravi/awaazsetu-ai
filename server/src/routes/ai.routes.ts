import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { analyzeSchema } from '../validators/voice.validator';

const router = Router();

router.post('/analyze', authenticate, validate(analyzeSchema), aiController.analyze.bind(aiController));
router.get('/health', aiController.health.bind(aiController));

export default router;
