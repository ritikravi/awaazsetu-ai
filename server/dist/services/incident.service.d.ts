import { IIncident } from '../models/Incident.model';
import { calculatePagination } from '../utils/helpers';
export interface CreateIncidentDTO {
    userId: string;
    category: string;
    description: string;
    location: {
        name: string;
        verified: boolean;
    };
    severity: string;
    urgencyReason: string;
    recommendedAction: string;
    missingInformation: string[];
    originalTranscript: string;
    correctedTranscript?: string;
    language: string;
    confidence?: number;
}
export interface IncidentFilters {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    severity?: string;
    userId?: string;
}
export declare class IncidentService {
    create(dto: CreateIncidentDTO): Promise<IIncident>;
    findMany(filters: IncidentFilters, requestingUserId: string, isAdmin: boolean): Promise<{
        incidents: IIncident[];
        pagination: ReturnType<typeof calculatePagination>;
    }>;
    findById(incidentId: string, requestingUserId: string, isAdmin: boolean): Promise<IIncident>;
    update(incidentId: string, updates: Partial<Pick<IIncident, 'description' | 'location' | 'category' | 'severity'>>, requestingUserId: string): Promise<IIncident>;
    updateStatus(incidentId: string, newStatus: string, changedById: string, notes?: string): Promise<IIncident>;
    getHistory(incidentId: string): Promise<any[]>;
}
export declare const incidentService: IncidentService;
//# sourceMappingURL=incident.service.d.ts.map