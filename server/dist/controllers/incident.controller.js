"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incidentController = exports.IncidentController = void 0;
const incident_service_1 = require("../services/incident.service");
const helpers_1 = require("../utils/helpers");
const constants_1 = require("../config/constants");
class IncidentController {
    async create(req, res, next) {
        try {
            const authReq = req;
            const incident = await incident_service_1.incidentService.create({
                userId: authReq.user.id,
                ...req.body,
            });
            (0, helpers_1.sendSuccess)(res, { incident }, constants_1.HTTP_STATUS.CREATED);
        }
        catch (error) {
            next(error);
        }
    }
    async list(req, res, next) {
        try {
            const authReq = req;
            const { page, limit, status, category, severity, userId } = req.query;
            const result = await incident_service_1.incidentService.findMany({
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                status: status,
                category: category,
                severity: severity,
                userId: userId,
            }, authReq.user.id, authReq.user.role === 'admin');
            (0, helpers_1.sendSuccess)(res, result);
        }
        catch (error) {
            next(error);
        }
    }
    async getOne(req, res, next) {
        try {
            const authReq = req;
            const incident = await incident_service_1.incidentService.findById(req.params.id, authReq.user.id, authReq.user.role === 'admin');
            const history = await incident_service_1.incidentService.getHistory(req.params.id);
            (0, helpers_1.sendSuccess)(res, { incident, history });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const authReq = req;
            const incident = await incident_service_1.incidentService.update(req.params.id, req.body, authReq.user.id);
            (0, helpers_1.sendSuccess)(res, { incident });
        }
        catch (error) {
            next(error);
        }
    }
    async updateStatus(req, res, next) {
        try {
            const authReq = req;
            const { status, notes } = req.body;
            const incident = await incident_service_1.incidentService.updateStatus(req.params.id, status, authReq.user.id, notes);
            (0, helpers_1.sendSuccess)(res, { incident });
        }
        catch (error) {
            next(error);
        }
    }
    async getHistory(req, res, next) {
        try {
            const history = await incident_service_1.incidentService.getHistory(req.params.id);
            (0, helpers_1.sendSuccess)(res, { history });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.IncidentController = IncidentController;
exports.incidentController = new IncidentController();
//# sourceMappingURL=incident.controller.js.map