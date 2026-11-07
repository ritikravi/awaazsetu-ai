"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const Incident_model_1 = require("../models/Incident.model");
class AnalyticsService {
    async getStats() {
        const [total, newToday, pendingVerification, highPriority, resolved] = await Promise.all([
            Incident_model_1.Incident.countDocuments(),
            Incident_model_1.Incident.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            }),
            Incident_model_1.Incident.countDocuments({ verificationStatus: 'pending' }),
            Incident_model_1.Incident.countDocuments({ severity: { $in: ['High', 'Critical'] }, status: { $ne: 'Resolved' } }),
            Incident_model_1.Incident.countDocuments({ status: 'Resolved' }),
        ]);
        return { totalIncidents: total, newIncidents: newToday, pendingVerification, highPriority, resolved };
    }
    async getAnalytics(startDate, endDate) {
        const matchStage = {};
        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate)
                matchStage.createdAt.$gte = new Date(startDate);
            if (endDate)
                matchStage.createdAt.$lte = new Date(endDate);
        }
        const [categoryDistribution, severityDistribution, statusDistribution, timeline] = await Promise.all([
            Incident_model_1.Incident.aggregate([
                { $match: matchStage },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $project: { category: '$_id', count: 1, _id: 0 } },
                { $sort: { count: -1 } },
            ]),
            Incident_model_1.Incident.aggregate([
                { $match: matchStage },
                { $group: { _id: '$severity', count: { $sum: 1 } } },
                { $project: { severity: '$_id', count: 1, _id: 0 } },
            ]),
            Incident_model_1.Incident.aggregate([
                { $match: matchStage },
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $project: { status: '$_id', count: 1, _id: 0 } },
            ]),
            Incident_model_1.Incident.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                        },
                        count: { $sum: 1 },
                    },
                },
                { $project: { date: '$_id', count: 1, _id: 0 } },
                { $sort: { date: 1 } },
            ]),
        ]);
        return { categoryDistribution, severityDistribution, statusDistribution, timeline };
    }
}
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
//# sourceMappingURL=analytics.service.js.map