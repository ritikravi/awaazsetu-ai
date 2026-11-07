import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Search, Filter } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import api from '../services/api';
import { Incident, Pagination } from '../types';

const CATEGORIES = ['', 'Water Leakage', 'Road Damage', 'Electrical Hazard', 'Waste Management', 'Drainage Problem', 'Public Safety', 'Infrastructure Damage', 'Other'];
const STATUSES = ['', 'Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];

export default function IncidentHistory() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery<{ incidents: Incident[]; pagination: Pagination }>({
    queryKey: ['incidents', page, category, status],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (category) params.set('category', category);
      if (status) params.set('status', status);
      return api.get(`/incidents?${params}`).then((r) => r.data.data);
    },
  });

  const incidents = data?.incidents ?? [];
  const pagination = data?.pagination;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Incident Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Track all your submitted incidents</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 bg-[#0f0f0f] border border-white/5 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Filter size={14} className="text-gray-500" />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-gray-300 focus:outline-none w-full"
          >
            {CATEGORIES.map((c) => <option key={c} value={c} className="bg-gray-900">{c || 'All Categories'}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-[#0f0f0f] border border-white/5 rounded-lg px-3 py-2 flex-1 min-w-40">
          <Search size={14} className="text-gray-500" />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-gray-300 focus:outline-none w-full"
          >
            {STATUSES.map((s) => <option key={s} value={s} className="bg-gray-900">{s || 'All Statuses'}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-16 text-center">
          <FileText size={36} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No incidents found</p>
        </div>
      ) : (
        <div className="bg-[#0f0f0f] border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Incident ID', 'Category', 'Location', 'Severity', 'Status', 'Date'].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3 first:pl-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc._id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/incidents/${inc.incidentId}`} className="font-mono text-xs text-blue-400 hover:text-blue-300">
                      {inc.incidentId}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-200">{inc.category}</td>
                  <td className="px-5 py-3 text-gray-400 max-w-32 truncate">{inc.location.name}</td>
                  <td className="px-5 py-3"><SeverityBadge severity={inc.severity} /></td>
                  <td className="px-5 py-3"><StatusBadge status={inc.status} /></td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(inc.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
              <span className="text-xs text-gray-500">{pagination.total} total incidents</span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs px-3 py-1.5 text-gray-400">
                  {page} / {pagination.pages}
                </span>
                <button
                  disabled={page === pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
