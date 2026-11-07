export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'citizen' | 'admin';
  preferredLanguage: string;
  createdAt: string;
}

export interface Location {
  name: string;
  verified: boolean;
}

export type IncidentCategory =
  | 'Water Leakage' | 'Road Damage' | 'Electrical Hazard'
  | 'Waste Management' | 'Drainage Problem' | 'Public Safety'
  | 'Infrastructure Damage' | 'Other' | string; // Allow dynamic categories

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type IncidentStatus =
  | 'Submitted' | 'Under Review' | 'Assigned'
  | 'In Progress' | 'Resolved' | 'Rejected';

export interface Incident {
  _id: string;
  incidentId: string;
  userId: string;
  category: IncidentCategory;
  description: string;
  location: Location;
  severity: SeverityLevel;
  urgencyReason: string;
  recommendedAction: string;
  missingInformation: string[];
  originalTranscript: string;
  correctedTranscript?: string;
  language: string;
  confidence?: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  userEdits: { field: string; originalValue: any; newValue: any; editedAt: string }[];
  status: IncidentStatus;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentExtraction {
  category: IncidentCategory;
  description: string;
  location: Location;
  severity: SeverityLevel;
  urgencyReason: string;
  recommendedAction: string;
  language: string;
  missingInformation: string[];
  confidence?: number;
}

export interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface DashboardStats {
  totalIncidents: number;
  newIncidents: number;
  pendingVerification: number;
  highPriority: number;
  resolved: number;
}

export interface AnalyticsData {
  categoryDistribution: { category: string; count: number }[];
  severityDistribution: { severity: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  timeline: { date: string; count: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  error: { message: string; code: string };
}
