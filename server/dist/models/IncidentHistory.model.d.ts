import mongoose, { Document } from 'mongoose';
export interface IIncidentHistory extends Document {
    incidentId: string;
    previousStatus: string;
    newStatus: string;
    changedBy: mongoose.Types.ObjectId;
    notes?: string;
    createdAt: Date;
}
export declare const IncidentHistory: mongoose.Model<IIncidentHistory, {}, {}, {}, mongoose.Document<unknown, {}, IIncidentHistory, {}, {}> & IIncidentHistory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=IncidentHistory.model.d.ts.map