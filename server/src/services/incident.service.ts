import { Incident, IIncident } from '../models/Incident.model';
import { IncidentHistory } from '../models/IncidentHistory.model';
import { generateIncidentId, calculatePagination } from '../utils/helpers';
import { NotFoundError, AuthorizationError, ValidationError } from '../utils/errorTypes';
import { INCIDENT_STATUSES } from '../config/constants';

export interface CreateIncidentDTO {
  userId: string;
  category: string;
  description: string;
  location: { name: string; verified: boolean };
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

export class IncidentService {
  async create(dto: CreateIncidentDTO): Promise<IIncident> {
    const incidentId = generateIncidentId();
    const incident = await Incident.create({
      incidentId,
      userId: dto.userId,
      category: dto.category,
      description: dto.description,
      location: dto.location,
      severity: dto.severity,
      urgencyReason: dto.urgencyReason,
      recommendedAction: dto.recommendedAction,
      missingInformation: dto.missingInformation,
      originalTranscript: dto.originalTranscript,
      correctedTranscript: dto.correctedTranscript,
      language: dto.language,
      confidence: dto.confidence,
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      status: 'Submitted',
    });
    return incident;
  }

  async findMany(
    filters: IncidentFilters,
    requestingUserId: string,
    isAdmin: boolean
  ): Promise<{ incidents: IIncident[]; pagination: ReturnType<typeof calculatePagination> }> {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 10, 100);
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    // Non-admin users can only see their own incidents
    if (!isAdmin) {
      query.userId = requestingUserId;
    } else if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.severity) query.severity = filters.severity;

    const [incidents, total] = await Promise.all([
      Incident.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Incident.countDocuments(query),
    ]);

    return { incidents: incidents as unknown as IIncident[], pagination: calculatePagination(page, limit, total) };
  }

  async findById(incidentId: string, requestingUserId: string, isAdmin: boolean): Promise<IIncident> {
    const incident = await Incident.findOne({ incidentId }).populate('userId', 'name email');
    if (!incident) throw new NotFoundError(`Incident ${incidentId} not found`);

    if (!isAdmin && incident.userId.toString() !== requestingUserId) {
      throw new AuthorizationError('You do not have access to this incident');
    }

    return incident;
  }

  async update(
    incidentId: string,
    updates: Partial<Pick<IIncident, 'description' | 'location' | 'category' | 'severity'>>,
    requestingUserId: string
  ): Promise<IIncident> {
    const incident = await Incident.findOne({ incidentId });
    if (!incident) throw new NotFoundError(`Incident ${incidentId} not found`);

    if (incident.userId.toString() !== requestingUserId) {
      throw new AuthorizationError('You can only edit your own incidents');
    }

    if (!['Submitted', 'Under Review'].includes(incident.status)) {
      throw new ValidationError('Incident cannot be edited in its current status');
    }

    // Track user edits
    const editEntries = Object.entries(updates).map(([field, newValue]) => ({
      field,
      originalValue: (incident as any)[field],
      newValue,
      editedAt: new Date(),
    }));

    Object.assign(incident, updates);
    incident.userEdits.push(...editEntries);
    await incident.save();
    return incident;
  }

  async updateStatus(
    incidentId: string,
    newStatus: string,
    changedById: string,
    notes?: string
  ): Promise<IIncident> {
    if (!INCIDENT_STATUSES.includes(newStatus as any)) {
      throw new ValidationError(`Invalid status: ${newStatus}`);
    }

    const incident = await Incident.findOne({ incidentId });
    if (!incident) throw new NotFoundError(`Incident ${incidentId} not found`);

    const previousStatus = incident.status;

    // Create history entry
    await IncidentHistory.create({
      incidentId,
      previousStatus,
      newStatus,
      changedBy: changedById,
      notes,
    });

    incident.status = newStatus;
    if (newStatus === 'Resolved') incident.resolvedAt = new Date();
    await incident.save();

    return incident;
  }

  async getHistory(incidentId: string): Promise<any[]> {
    return IncidentHistory.find({ incidentId })
      .sort({ createdAt: -1 })
      .populate('changedBy', 'name email')
      .lean();
  }
}

export const incidentService = new IncidentService();
