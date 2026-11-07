import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Mic, FileText, CheckCircle, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { DashboardStats, Incident, Pagination } from '../types';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="text-3xl font-bold text-white">{value.toLocaleString()}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: statsData } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data.data),
  });

  const { data: incidentsData } = useQuery<{ incidents: Incident[]; pagination: Pagination }>({
    queryKey: ['my-incidents'],
    queryFn: () => api.get('/incidents?limit=5').then((r) => r.data.data),
  });

  const stats = statsData;
  const incidents = incidentsData?.incidents ?? [];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {user?.role === 'admin' ? 'Platform overview' : 'Your incident dashboard'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Incidents" value={stats?.totalIncidents ?? 0} icon={FileText} color="bg-blue-600/20 text-blue-400" />
        <StatCard label="New Today" value={stats?.newIncidents ?? 0} icon={TrendingUp} color="bg-emerald-600/20 text-emerald-400" />
        <StatCard label="High Priority" value={stats?.highPriority ?? 0} icon={AlertTriangle} color="bg-orange-600/20 text-orange-400" />
        <StatCard label="Resolved" value={stats?.resolved ?? 0} icon={CheckCircle} color="bg-violet-600/20 text-violet-400" />
      </div>

      {/* Quick Action */}
      <Link to="/report" className="block mb-8">
        <div className="bg-blue-600/10 border border-blue-600/20 hover:border-blue-600/40 rounded-xl p-6 flex items-center justify-between transition-colors cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
              <Mic size={22} className="text-blue-400" />
            </div>
            <div>
              <div className="font-semibold text-white">Report a New Incident</div>
              <div className="text-sm text-gray-500 mt-0.5">Speak in Hindi or Hinglish — AI handles the rest</div>
            </div>
          </div>
          <ArrowRight size={20} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>

      {/* Recent Incidents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Reports</h2>
          <Link to="/incidents" className="text-sm text-blue-400 hover:text-blue-300">View all →</Link>
        </div>

        {incidents.length === 0 ? (
          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-12 text-center">
            <Mic size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No incidents yet.</p>
            <Link to="/report" className="text-blue-400 text-sm hover:text-blue-300 mt-2 inline-block">
              Report your first incident →
            </Link>
          </div>
        ) : (
          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-gray-500 font-medium px-5 py-3">ID</th>
                  <th className="text-left text-gray-500 font-medium px-5 py-3">Category</th>
                  <th className="text-left text-gray-500 font-medium px-5 py-3 hidden md:table-cell">Location</th>
                  <th className="text-left text-gray-500 font-medium px-5 py-3">Severity</th>
                  <th className="text-left text-gray-500 font-medium px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc._id} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">
                      <Link to={`/incidents/${inc.incidentId}`} className="hover:text-blue-400">
                        {inc.incidentId}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-200">{inc.category}</td>
                    <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{inc.location.name}</td>
                    <td className="px-5 py-3"><SeverityBadge severity={inc.severity} /></td>
                    <td className="px-5 py-3"><StatusBadge status={inc.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
