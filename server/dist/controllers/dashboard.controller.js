"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = exports.DashboardController = void 0;
const analytics_service_1 = require("../services/analytics.service");
const helpers_1 = require("../utils/helpers");
class DashboardController {
    async getStats(_req, res, next) {
        try {
            const stats = await analytics_service_1.analyticsService.getStats();
            (0, helpers_1.sendSuccess)(res, stats);
        }
        catch (error) {
            next(error);
        }
    }
    async getAnalytics(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            const data = await analytics_service_1.analyticsService.getAnalytics(startDate, endDate);
            (0, helpers_1.sendSuccess)(res, data);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DashboardController = DashboardController;
exports.dashboardController = new DashboardController();
//# sourceMappingURL=dashboard.controller.js.map