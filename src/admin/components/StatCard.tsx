type StatCardProps = {
  label: string;
  value: string;
  description: string;
  icon: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
};

const toneClasses = {
  neutral: 'bg-slate-50 text-slate-800',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
};

export default function StatCard({ label, value, description, icon, tone = 'neutral' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${toneClasses[tone]}`} aria-hidden="true">{icon}</span>
      </div>
      <div className="mt-4 text-3xl font-bold text-slate-900">{value}</div>
      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}
