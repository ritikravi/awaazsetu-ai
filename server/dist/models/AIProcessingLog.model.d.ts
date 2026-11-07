import mongoose, { Document } from 'mongoose';
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
export declare const AIProcessingLog: mongoose.Model<IAIProcessingLog, {}, {}, {}, mongoose.Document<unknown, {}, IAIProcessingLog, {}, {}> & IAIProcessingLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=AIProcessingLog.model.d.ts.map