"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const voice_controller_1 = require("../controllers/voice.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const voice_validator_1 = require("../validators/voice.validator");
const router = (0, express_1.Router)();
router.post('/transcribe', auth_middleware_1.authenticate, upload_middleware_1.audioUpload.single('audio'), voice_controller_1.voiceController.transcribe.bind(voice_controller_1.voiceController));
router.post('/speak', auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(voice_validator_1.speakSchema), voice_controller_1.voiceController.speak.bind(voice_controller_1.voiceController));
exports.default = router;
//# sourceMappingURL=voice.routes.js.map