import mongoose, { Document, Schema } from 'mongoose';
import {
  INCIDENT_CATEGORIES,
  SEVERITY_LEVELS,
  INCIDENT_STATUSES,
  VERIFICATION_STATUSES,
} from '../config/constants';

interface ILocation {
  name: string;
  verified: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface IUserEdit {
  field: string;
  originalValue: any;
  newValue: any;
  editedAt: Date;
}

export interface IIncident extends Document {
  incidentId: string;
  userId: mongoose.Types.ObjectId;

  // Incident Data
  category: string;
  description: string;
  location: ILocation;
  severity: string;
  urgencyReason: string;
  recommendedAction: string;
  missingInformation: string[];

  // Processing Data
  originalTranscript: string;
  correctedTranscript?: string;
  language: string;
  confidence?: number;

  // Verification Data
  verificationStatus: string;
  verifiedAt?: Date;
  userEdits: IUserEdit[];

  // Workflow
  status: string;
  assignedTo?: mongoose.Types.ObjectId;
  resolutionNotes?: string;
  resolvedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const incidentSchema = new Schema<IIncident>(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
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
      enum: SEVERITY_LEVELS,
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
      enum: VERIFICATION_STATUSES,
      default: 'pending',
    },
    verifiedAt: {
      type: Date,
    },
    userEdits: [
      {
        field: String,
        originalValue: Schema.Types.Mixed,
        newValue: Schema.Types.Mixed,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Workflow
    status: {
      type: String,
      enum: INCIDENT_STATUSES,
      default: 'Submitted',
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolutionNotes: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
incidentSchema.index({ incidentId: 1 });
incidentSchema.index({ userId: 1, createdAt: -1 });
incidentSchema.index({ status: 1, severity: 1 });
incidentSchema.index({ createdAt: -1 });

export const Incident = mongoose.model<IIncident>('Incident', incidentSchema);
