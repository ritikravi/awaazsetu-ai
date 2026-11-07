"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const incident_controller_1 = require("../controllers/incident.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const incident_validator_1 = require("../validators/incident.validator");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(incident_validator_1.createIncidentSchema), incident_controller_1.incidentController.create.bind(incident_controller_1.incidentController));
router.get('/', auth_middleware_1.authenticate, incident_controller_1.incidentController.list.bind(incident_controller_1.incidentController));
router.get('/:id', auth_middleware_1.authenticate, incident_controller_1.incidentController.getOne.bind(incident_controller_1.incidentController));
router.patch('/:id', auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(incident_validator_1.updateIncidentSchema), incident_controller_1.incidentController.update.bind(incident_controller_1.incidentController));
router.patch('/:id/status', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), (0, validate_middleware_1.validate)(incident_validator_1.updateStatusSchema), incident_controller_1.incidentController.updateStatus.bind(incident_controller_1.incidentController));
router.get('/:id/history', auth_middleware_1.authenticate, incident_controller_1.incidentController.getHistory.bind(incident_controller_1.incidentController));
exports.default = router;
//# sourceMappingURL=incident.routes.js.map