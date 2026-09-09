type StatusBadgeProps = {
  status: 'open' | 'resolved';
};

const statusStyles = {
  open: 'bg-sky-100 text-sky-700',
  resolved: 'bg-emerald-100 text-emerald-700',
};

const statusLabels = { open: "Open", resolved: "Resolved" };

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
