"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("../controllers/ai.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const voice_validator_1 = require("../validators/voice.validator");
const router = (0, express_1.Router)();
router.post('/analyze', auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(voice_validator_1.analyzeSchema), ai_controller_1.aiController.analyze.bind(ai_controller_1.aiController));
router.get('/health', ai_controller_1.aiController.health.bind(ai_controller_1.aiController));
exports.default = router;
//# sourceMappingURL=ai.routes.js.map