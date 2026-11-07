import { Incident } from '../models/Incident.model';

export class AnalyticsService {
  async getStats() {
    const [total, newToday, pendingVerification, highPriority, resolved] = await Promise.all([
      Incident.countDocuments(),
      Incident.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
      Incident.countDocuments({ verificationStatus: 'pending' }),
      Incident.countDocuments({ severity: { $in: ['High', 'Critical'] }, status: { $ne: 'Resolved' } }),
      Incident.countDocuments({ status: 'Resolved' }),
    ]);

    return { totalIncidents: total, newIncidents: newToday, pendingVerification, highPriority, resolved };
  }

  async getAnalytics(startDate?: string, endDate?: string) {
    const matchStage: Record<string, any> = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const [categoryDistribution, severityDistribution, statusDistribution, timeline] =
      await Promise.all([
        Incident.aggregate([
          { $match: matchStage },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $project: { category: '$_id', count: 1, _id: 0 } },
          { $sort: { count: -1 } },
        ]),
        Incident.aggregate([
          { $match: matchStage },
          { $group: { _id: '$severity', count: { $sum: 1 } } },
          { $project: { severity: '$_id', count: 1, _id: 0 } },
        ]),
        Incident.aggregate([
          { $match: matchStage },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $project: { status: '$_id', count: 1, _id: 0 } },
        ]),
        Incident.aggregate([
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

export const analyticsService = new AnalyticsService();
