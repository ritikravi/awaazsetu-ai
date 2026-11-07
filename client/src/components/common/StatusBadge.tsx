import { IncidentStatus } from '../../types';

const styles: Record<IncidentStatus, string> = {
  Submitted: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  'Under Review': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  Assigned: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  'In Progress': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  Resolved: 'bg-green-500/20 text-green-400 border border-green-500/30',
  Rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status]}`}>
      {status}
    </span>
  );
}
