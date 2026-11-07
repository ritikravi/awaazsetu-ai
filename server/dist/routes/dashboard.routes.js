"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/stats', auth_middleware_1.authenticate, dashboard_controller_1.dashboardController.getStats.bind(dashboard_controller_1.dashboardController));
router.get('/analytics', auth_middleware_1.authenticate, dashboard_controller_1.dashboardController.getAnalytics.bind(dashboard_controller_1.dashboardController));
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map