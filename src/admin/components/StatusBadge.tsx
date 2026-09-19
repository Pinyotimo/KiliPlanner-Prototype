import React from 'react';
import type { IssueStatus } from '../../types/issue';

interface StatusBadgeProps {
  status: IssueStatus;
}

const statusStyles: Record<string, string> = {
  UNVERIFIED: 'bg-muted text-muted-foreground border-border',
  UNDER_REVIEW: 'bg-muted text-muted-foreground border-border',
  CORROBORATED: 'bg-accent/30 text-accent-foreground border-accent/30',
  VERIFIED: 'bg-primary/10 text-primary border-primary/30',
  RESOLVED: 'bg-primary/10 text-primary border-primary/30',
  REJECTED: 'bg-muted text-foreground border-border',
};

const statusLabels: Record<string, string> = {
  UNVERIFIED: 'Community report — under verification',
  UNDER_REVIEW: 'Under Review',
  CORROBORATED: 'Corroborated infrastructure issue',
  VERIFIED: '✓ Verified Infrastructure Issue',
  RESOLVED: '✓ Resolved',
  REJECTED: 'Rejected',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const style = statusStyles[status] || statusStyles.UNVERIFIED;
  const label = statusLabels[status] || status;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
};

export default StatusBadge;