import mongoose, { Document, Schema } from 'mongoose';
import { AI_PROVIDERS } from '../config/constants';

export interface IAIProcessingLog extends Document {
  incidentId?: string;
  provider: 'prisma' | 'evon' | 'timbre';
  modelName: string;
  operation: string;
  status: 'success' | 'error' | 'timeout';
  processingTimeMs: number;
  errorMessage?: string;
  requestId?: string;
  metadata?: any;
  createdAt: Date;
}

const aiProcessingLogSchema = new Schema<IAIProcessingLog>(
  {
    incidentId: {
      type: String,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: AI_PROVIDERS,
    },
    modelName: {
      type: String,
      required: true,
    },
    operation: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['success', 'error', 'timeout'],
    },
    processingTimeMs: {
      type: Number,
      required: true,
    },
    errorMessage: {
      type: String,
    },
    requestId: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for analytics queries
aiProcessingLogSchema.index({ incidentId: 1, createdAt: -1 });
aiProcessingLogSchema.index({ provider: 1, status: 1 });
aiProcessingLogSchema.index({ createdAt: -1 });

export const AIProcessingLog = mongoose.model<IAIProcessingLog>(
  'AIProcessingLog',
  aiProcessingLogSchema
);
