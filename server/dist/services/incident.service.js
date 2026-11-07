"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incidentService = exports.IncidentService = void 0;
const Incident_model_1 = require("../models/Incident.model");
const IncidentHistory_model_1 = require("../models/IncidentHistory.model");
const helpers_1 = require("../utils/helpers");
const errorTypes_1 = require("../utils/errorTypes");
const constants_1 = require("../config/constants");
class IncidentService {
    async create(dto) {
        const incidentId = (0, helpers_1.generateIncidentId)();
        const incident = await Incident_model_1.Incident.create({
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
    async findMany(filters, requestingUserId, isAdmin) {
        const page = filters.page ?? 1;
        const limit = Math.min(filters.limit ?? 10, 100);
        const skip = (page - 1) * limit;
        const query = {};
        // Non-admin users can only see their own incidents
        if (!isAdmin) {
            query.userId = requestingUserId;
        }
        else if (filters.userId) {
            query.userId = filters.userId;
        }
        if (filters.status)
            query.status = filters.status;
        if (filters.category)
            query.category = filters.category;
        if (filters.severity)
            query.severity = filters.severity;
        const [incidents, total] = await Promise.all([
            Incident_model_1.Incident.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Incident_model_1.Incident.countDocuments(query),
        ]);
        return { incidents: incidents, pagination: (0, helpers_1.calculatePagination)(page, limit, total) };
    }
    async findById(incidentId, requestingUserId, isAdmin) {
        const incident = await Incident_model_1.Incident.findOne({ incidentId }).populate('userId', 'name email');
        if (!incident)
            throw new errorTypes_1.NotFoundError(`Incident ${incidentId} not found`);
        // Admins can see all, citizens can only see their own
        const ownerId = incident.userId?._id?.toString() ?? incident.userId.toString();
        if (!isAdmin && ownerId !== requestingUserId) {
            throw new errorTypes_1.AuthorizationError('You do not have access to this incident');
        }
        return incident;
    }
    async update(incidentId, updates, requestingUserId) {
        const incident = await Incident_model_1.Incident.findOne({ incidentId });
        if (!incident)
            throw new errorTypes_1.NotFoundError(`Incident ${incidentId} not found`);
        if (incident.userId.toString() !== requestingUserId) {
            throw new errorTypes_1.AuthorizationError('You can only edit your own incidents');
        }
        if (!['Submitted', 'Under Review'].includes(incident.status)) {
            throw new errorTypes_1.ValidationError('Incident cannot be edited in its current status');
        }
        // Track user edits
        const editEntries = Object.entries(updates).map(([field, newValue]) => ({
            field,
            originalValue: incident[field],
            newValue,
            editedAt: new Date(),
        }));
        Object.assign(incident, updates);
        incident.userEdits.push(...editEntries);
        await incident.save();
        return incident;
    }
    async updateStatus(incidentId, newStatus, changedById, notes) {
        if (!constants_1.INCIDENT_STATUSES.includes(newStatus)) {
            throw new errorTypes_1.ValidationError(`Invalid status: ${newStatus}`);
        }
        const incident = await Incident_model_1.Incident.findOne({ incidentId });
        if (!incident)
            throw new errorTypes_1.NotFoundError(`Incident ${incidentId} not found`);
        const previousStatus = incident.status;
        // Create history entry
        await IncidentHistory_model_1.IncidentHistory.create({
            incidentId,
            previousStatus,
            newStatus,
            changedBy: changedById,
            notes,
        });
        incident.status = newStatus;
        if (newStatus === 'Resolved')
            incident.resolvedAt = new Date();
        await incident.save();
        return incident;
    }
    async getHistory(incidentId) {
        return IncidentHistory_model_1.IncidentHistory.find({ incidentId })
            .sort({ createdAt: -1 })
            .populate('changedBy', 'name email')
            .lean();
    }
}
exports.IncidentService = IncidentService;
exports.incidentService = new IncidentService();
//# sourceMappingURL=incident.service.js.map