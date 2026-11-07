export declare class AnalyticsService {
    getStats(): Promise<{
        totalIncidents: number;
        newIncidents: number;
        pendingVerification: number;
        highPriority: number;
        resolved: number;
    }>;
    getAnalytics(startDate?: string, endDate?: string): Promise<{
        categoryDistribution: any[];
        severityDistribution: any[];
        statusDistribution: any[];
        timeline: any[];
    }>;
}
export declare const analyticsService: AnalyticsService;
//# sourceMappingURL=analytics.service.d.ts.map