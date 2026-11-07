import mongoose, { Document } from 'mongoose';
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
    category: string;
    description: string;
    location: ILocation;
    severity: string;
    urgencyReason: string;
    recommendedAction: string;
    missingInformation: string[];
    originalTranscript: string;
    correctedTranscript?: string;
    language: string;
    confidence?: number;
    verificationStatus: string;
    verifiedAt?: Date;
    userEdits: IUserEdit[];
    status: string;
    assignedTo?: mongoose.Types.ObjectId;
    resolutionNotes?: string;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Incident: mongoose.Model<IIncident, {}, {}, {}, mongoose.Document<unknown, {}, IIncident, {}, {}> & IIncident & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export {};
//# sourceMappingURL=Incident.model.d.ts.map