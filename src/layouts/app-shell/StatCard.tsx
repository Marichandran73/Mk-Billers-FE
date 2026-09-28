

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="panel-surface relative overflow-hidden p-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-sky-400 to-emerald-400" />
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}


