"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Incident = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../config/constants");
const incidentSchema = new mongoose_1.Schema({
    incidentId: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    // Incident Data
    category: {
        type: String,
        required: true,
        // Allow both fixed and dynamic categories
    },
    description: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 500,
    },
    location: {
        name: {
            type: String,
            required: true,
        },
        verified: {
            type: Boolean,
            default: false,
        },
        coordinates: {
            lat: Number,
            lng: Number,
        },
    },
    severity: {
        type: String,
        required: true,
        enum: constants_1.SEVERITY_LEVELS,
        index: true,
    },
    urgencyReason: {
        type: String,
        required: true,
        maxlength: 300,
    },
    recommendedAction: {
        type: String,
        required: true,
        maxlength: 300,
    },
    missingInformation: {
        type: [String],
        default: [],
    },
    // Processing Data
    originalTranscript: {
        type: String,
        required: true,
    },
    correctedTranscript: {
        type: String,
    },
    language: {
        type: String,
        required: true,
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1,
    },
    // Verification Data
    verificationStatus: {
        type: String,
        enum: constants_1.VERIFICATION_STATUSES,
        default: 'pending',
    },
    verifiedAt: {
        type: Date,
    },
    userEdits: [
        {
            field: String,
            originalValue: mongoose_1.Schema.Types.Mixed,
            newValue: mongoose_1.Schema.Types.Mixed,
            editedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    // Workflow
    status: {
        type: String,
        enum: constants_1.INCIDENT_STATUSES,
        default: 'Submitted',
        index: true,
    },
    assignedTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    resolutionNotes: {
        type: String,
    },
    resolvedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Indexes for better query performance
incidentSchema.index({ incidentId: 1 });
incidentSchema.index({ userId: 1, createdAt: -1 });
incidentSchema.index({ status: 1, severity: 1 });
incidentSchema.index({ createdAt: -1 });
exports.Incident = mongoose_1.default.model('Incident', incidentSchema);
//# sourceMappingURL=Incident.model.js.map