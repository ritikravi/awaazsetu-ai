import mongoose, { Document, Schema } from 'mongoose';

export interface IIncidentHistory extends Document {
  incidentId: string;
  previousStatus: string;
  newStatus: string;
  changedBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
}

const incidentHistorySchema = new Schema<IIncidentHistory>(
  {
    incidentId: {
      type: String,
      required: true,
      index: true,
    },
    previousStatus: {
      type: String,
      required: true,
    },
    newStatus: {
      type: String,
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
incidentHistorySchema.index({ incidentId: 1, createdAt: -1 });

export const IncidentHistory = mongoose.model<IIncidentHistory>(
  'IncidentHistory',
  incidentHistorySchema
);
