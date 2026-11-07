import { Router } from 'express';
import { incidentController } from '../controllers/incident.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createIncidentSchema,
  updateIncidentSchema,
  updateStatusSchema,
} from '../validators/incident.validator';

const router = Router();

router.post('/', authenticate, validate(createIncidentSchema), incidentController.create.bind(incidentController));
router.get('/', authenticate, incidentController.list.bind(incidentController));
router.get('/:id', authenticate, incidentController.getOne.bind(incidentController));
router.patch('/:id', authenticate, validate(updateIncidentSchema), incidentController.update.bind(incidentController));
router.patch('/:id/status', authenticate, authorize('admin'), validate(updateStatusSchema), incidentController.updateStatus.bind(incidentController));
router.get('/:id/history', authenticate, incidentController.getHistory.bind(incidentController));

export default router;
