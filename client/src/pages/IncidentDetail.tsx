import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Clock, User, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import api from '../services/api';
import { Incident } from '../types';

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<{ incident: Incident; history: any[] }>({
    queryKey: ['incident', id],
    queryFn: () => api.get(`/incidents/${id}`).then((r) => r.data.data),
  });

  if (isLoading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  if (error || !data) return (
    <DashboardLayout>
      <div className="text-center py-20">
        <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
        <p className="text-gray-500">Incident not found</p>
        <Link to="/incidents" className="text-blue-400 text-sm mt-2 inline-block">← Back to list</Link>
      </div>
    </DashboardLayout>
  );

  const { incident, history } = data;

  return (
    <DashboardLayout>
      {/* Back */}
      <Link to="/incidents" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to incidents
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="font-mono text-blue-400 text-sm mb-1">{incident.incidentId}</div>
          <h1 className="text-2xl font-bold text-white">{incident.category}</h1>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-6">
            <h2 className="text-sm text-gray-500 uppercase tracking-wider mb-3">Description</h2>
            <p className="text-gray-200">{incident.description}</p>
          </div>

          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-6">
            <h2 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Details</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <MapPin size={16} className="text-gray-600 mt-0.5" />
                <div>
                  <div className="text-gray-500 text-xs mb-0.5">Location</div>
                  <div className="text-gray-200">{incident.location.name}</div>
                  <div className={`text-xs mt-0.5 ${incident.location.verified ? 'text-green-500' : 'text-yellow-500'}`}>
                    {incident.location.verified ? 'User verified' : 'AI extracted — not verified'}
                  </div>
                </div>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-4 py-3">
                <div className="text-xs text-orange-500 mb-1">Urgency reason</div>
                <div className="text-sm text-orange-200">{incident.urgencyReason}</div>
              </div>

              <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg px-4 py-3">
                <div className="text-xs text-blue-500 mb-1">Recommended action</div>
                <div className="text-sm text-blue-200">{incident.recommendedAction}</div>
              </div>
            </div>
          </div>

          {/* Transcript */}
          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-6">
            <h2 className="text-sm text-gray-500 uppercase tracking-wider mb-3">Original Transcript</h2>
            <div className="bg-black/40 rounded-lg px-4 py-3 font-mono text-sm text-gray-400">
              "{incident.originalTranscript}"
            </div>
            {incident.correctedTranscript && incident.correctedTranscript !== incident.originalTranscript && (
              <div className="mt-3">
                <div className="text-xs text-yellow-500 mb-1">User-corrected transcript</div>
                <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-lg px-4 py-3 font-mono text-sm text-yellow-200">
                  "{incident.correctedTranscript}"
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5">
            <h2 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Info</h2>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Language', value: incident.language },
                { label: 'Confidence', value: incident.confidence ? `${(incident.confidence * 100).toFixed(0)}%` : 'N/A' },
                { label: 'Verification', value: incident.verificationStatus },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-200">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5">
            <h2 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Timeline</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <Clock size={14} className="text-gray-600 mt-0.5" />
                <div>
                  <div className="text-gray-400">{new Date(incident.createdAt).toLocaleString('en-IN')}</div>
                  <div className="text-xs text-gray-600">Submitted</div>
                </div>
              </div>
              {history.map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-sm border-t border-white/5 pt-3">
                  <User size={14} className="text-gray-600 mt-0.5" />
                  <div>
                    <div className="text-gray-400">{h.previousStatus} → {h.newStatus}</div>
                    <div className="text-xs text-gray-600">{new Date(h.createdAt).toLocaleString('en-IN')}</div>
                    {h.notes && <div className="text-xs text-gray-500 mt-1">{h.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {incident.resolutionNotes && (
            <div className="bg-green-600/10 border border-green-600/20 rounded-xl p-5">
              <h2 className="text-sm text-green-500 uppercase tracking-wider mb-2">Resolution</h2>
              <p className="text-sm text-green-200">{incident.resolutionNotes}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
