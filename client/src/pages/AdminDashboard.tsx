import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Link } from 'react-router-dom';
import { FileText, TrendingUp, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import api from '../services/api';
import { DashboardStats, AnalyticsData, Incident, Pagination } from '../types';

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const STATUSES = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}><Icon size={16} /></div>
      </div>
      <div className="text-3xl font-bold text-white">{value?.toLocaleString() ?? 0}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const qc = useQueryClient();
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [page, setPage] = useState(1);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: () => api.get('/dashboard/analytics').then((r) => r.data.data),
  });

  const { data: incidentsData } = useQuery<{ incidents: Incident[]; pagination: Pagination }>({
    queryKey: ['admin-incidents', page],
    queryFn: () => api.get(`/incidents?page=${page}&limit=10`).then((r) => r.data.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes: string }) =>
      api.patch(`/incidents/${id}/status`, { status, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-incidents'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      setSelectedIncident(null);
      setNewStatus('');
      setNotes('');
    },
  });

  const incidents = incidentsData?.incidents ?? [];
  const pagination = incidentsData?.pagination;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform-wide incident management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total" value={stats?.totalIncidents} icon={FileText} color="bg-blue-600/20 text-blue-400" />
        <StatCard label="New Today" value={stats?.newIncidents} icon={TrendingUp} color="bg-emerald-600/20 text-emerald-400" />
        <StatCard label="Pending" value={stats?.pendingVerification} icon={Clock} color="bg-yellow-600/20 text-yellow-400" />
        <StatCard label="High Priority" value={stats?.highPriority} icon={AlertTriangle} color="bg-orange-600/20 text-orange-400" />
        <StatCard label="Resolved" value={stats?.resolved} icon={CheckCircle} color="bg-violet-600/20 text-violet-400" />
      </div>

      {/* Charts */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Category Bar */}
          <div className="lg:col-span-2 bg-[#0f0f0f] border border-white/5 rounded-xl p-5">
            <h2 className="text-sm font-medium text-gray-300 mb-4">Incidents by Category</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.categoryDistribution}>
                <XAxis dataKey="category" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Severity Pie */}
          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5">
            <h2 className="text-sm font-medium text-gray-300 mb-4">Severity Distribution</h2>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={analytics.severityDistribution} dataKey="count" nameKey="severity" cx="50%" cy="50%" outerRadius={65} label={({ severity, count }) => `${severity}: ${count}`} labelLine={false}>
                  {analytics.severityDistribution.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-3 bg-[#0f0f0f] border border-white/5 rounded-xl p-5">
            <h2 className="text-sm font-medium text-gray-300 mb-4">Reports Over Time</h2>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={analytics.timeline}>
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Incidents Table */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">All Incidents</h2>
        <div className="bg-[#0f0f0f] border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['ID', 'Category', 'Location', 'Severity', 'Status', 'Date', 'Action'].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc._id} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                  <td className="px-4 py-3">
                    <Link to={`/incidents/${inc.incidentId}`} className="font-mono text-xs text-blue-400 hover:text-blue-300">
                      {inc.incidentId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-200 text-xs">{inc.category}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-24 truncate">{inc.location.name}</td>
                  <td className="px-4 py-3"><SeverityBadge severity={inc.severity} /></td>
                  <td className="px-4 py-3"><StatusBadge status={inc.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(inc.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedIncident(inc.incidentId)}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
              <span className="text-xs text-gray-500">{pagination.total} total</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-40">Prev</button>
                <span className="text-xs px-2 py-1.5 text-gray-400">{page}/{pagination.pages}</span>
                <button disabled={page === pagination.pages} onClick={() => setPage((p) => p + 1)} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Update Status</h3>
            <div className="text-xs text-blue-400 font-mono mb-4">{selectedIncident}</div>

            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full bg-black border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Select status...</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-2 block">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add resolution notes..."
                className="w-full bg-black border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setSelectedIncident(null); setNewStatus(''); setNotes(''); }}
                className="flex-1 border border-white/10 text-gray-400 hover:text-white py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!newStatus || updateStatus.isPending}
                onClick={() => updateStatus.mutate({ id: selectedIncident, status: newStatus, notes })}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                {updateStatus.isPending ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
