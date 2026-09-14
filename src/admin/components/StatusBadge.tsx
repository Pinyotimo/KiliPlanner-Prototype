import React from 'react';
import type { IssueStatus } from '../../types/issue';

interface StatusBadgeProps {
  status: IssueStatus | 'open' | 'in_progress' | 'resolved' | 'closed';
}

const statusStyles: Record<string, string> = {
  open: 'bg-accent/30 text-accent-foreground border-accent/30',
  in_progress: 'bg-primary/10 text-primary border-primary/30',
  resolved: 'bg-primary/10 text-primary border-primary/30',
  closed: 'bg-muted text-foreground border-border',
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const style = statusStyles[status] || statusStyles.open;
  const label = statusLabels[status] || status;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
};

export default StatusBadge;