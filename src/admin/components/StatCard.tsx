type StatCardProps = {
  label: string;
  value: string;
  description: string;
  icon: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
};

const toneClasses = {
  neutral: 'bg-muted text-foreground',
  success: 'bg-primary/10 text-primary',
  warning: 'bg-accent/20 text-accent-foreground',
  danger: 'bg-destructive/10 text-destructive',
};

export default function StatCard({ label, value, description, icon, tone = 'neutral' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${toneClasses[tone]}`} aria-hidden="true">{icon}</span>
      </div>
      <div className="mt-4 text-3xl font-bold text-foreground">{value}</div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}
