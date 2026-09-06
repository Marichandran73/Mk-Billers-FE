import type { ReactNode } from "react";


export function PageTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      {action}
    </div>
  );
}


