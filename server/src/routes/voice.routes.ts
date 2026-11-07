import { Router } from 'express';
import { voiceController } from '../controllers/voice.controller';
import { authenticate } from '../middleware/auth.middleware';
import { audioUpload } from '../middleware/upload.middleware';
import { validate } from '../middleware/validate.middleware';
import { speakSchema } from '../validators/voice.validator';

const router = Router();

router.post('/transcribe', authenticate, audioUpload.single('audio'), voiceController.transcribe.bind(voiceController));
router.post('/speak', authenticate, validate(speakSchema), voiceController.speak.bind(voiceController));

export default router;
