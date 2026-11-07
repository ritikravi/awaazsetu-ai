import { SeverityLevel } from '../../types';

const styles: Record<SeverityLevel, string> = {
  Critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
  High: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  Low: 'bg-green-500/20 text-green-400 border border-green-500/30',
};

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[severity]}`}>
      {severity}
    </span>
  );
}
