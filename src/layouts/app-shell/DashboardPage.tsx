import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { dashboardApi } from "../../services/dashboardApi";
import type { DashboardStats } from "../../types";
import { formatCurrency } from "../../utils/billing";
import { getRestrictedActionMessage, isInactiveAdmin } from "../../utils/permissions";
import { CreateBillButton } from "./CreateBillButton";
import { EmptyState } from "./EmptyState";
// import { PageLoader } from "./PageLoader";
import LoadingComp from "../../pages/ReusableCom/LoadingComp";
import { PageTitle } from "./PageTitle";
import { RecentBills } from "./RecentBills";
import { StatCard } from "./StatCard";


export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const adminRestricted = isInactiveAdmin();

  useEffect(() => {
    dashboardApi
      .stats()
      .then(setStats)
      .catch(() => toast.error("Unable to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingComp />;
  if (!stats)
    return (
      <EmptyState
        title="Dashboard unavailable"
        description="Statistics could not be loaded."
      />
    );

  const maxRevenue = Math.max(
    ...stats.monthly_revenue.map((item) => item.revenue),
    1,
  );

  return (
    <section className="space-y-6">
      <PageTitle
        title="Dashboard"
        action={
          <CreateBillButton
            disabled={adminRestricted}
            onBlocked={() => toast.error(getRestrictedActionMessage("create-bill"))}
          />
        }
      />

      <div className="panel-surface relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(620px_240px_at_15%_0%,rgba(15,132,200,0.14),transparent_64%),radial-gradient(520px_220px_at_100%_30%,rgba(56,189,248,0.14),transparent_62%)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Business Overview
            </p>
            <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Your billing performance at a glance
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Monitor revenue trend, customer growth, and outstanding payments from a single dashboard.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200/80 bg-white/85 px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending Value</p>
              <p className="mt-1 text-lg font-bold text-amber-600">{formatCurrency(stats.pending_total)}</p>
            </div>
            <div className="rounded-lg border border-slate-200/80 bg-white/85 px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Monthly Revenue</p>
              <p className="mt-1 text-lg font-bold text-brand-700">{formatCurrency(stats.this_month_revenue)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Bills" value={stats.total_bills} />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.total_revenue)}
        />
        <StatCard label="Customers" value={stats.total_customers} />
        <StatCard
          label="This Month"
          value={formatCurrency(stats.this_month_revenue)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="panel-surface p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">Monthly Revenue</h2>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              Last 12 months
            </span>
          </div>
          <div className="mt-6 flex h-64 items-end gap-3 overflow-x-auto pb-1">
            {stats.monthly_revenue.map((item) => (
              <div
                className="flex min-w-16 flex-1 flex-col items-center gap-2"
                key={item.month}
              >
                <div className="flex h-full w-full items-end rounded-xl bg-slate-100/80 p-1">
                <div
                  className="w-full rounded-lg bg-gradient-to-t from-brand-700 via-brand-500 to-sky-400 shadow-sm"
                  style={{
                    height: `${Math.max((item.revenue / maxRevenue) * 210, 8)}px`,
                  }}
                  title={formatCurrency(item.revenue)}
                />
                </div>
                <span className="text-xs text-slate-500">
                  {item.month.slice(0, 3)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-900/10 bg-[linear-gradient(145deg,#0b1f3a_0%,#11345f_52%,#0f84c8_100%)] p-5 text-white shadow-soft sm:p-6">
          <h2 className="text-base font-semibold text-cyan-100">Outstanding</h2>
          <p className="mt-4 text-3xl font-extrabold text-white">
            {formatCurrency(stats.pending_total)}
          </p>
          <p className="mt-2 text-sm text-cyan-100/90">
            Pending invoice value across the company workspace.
          </p>
          <div className="mt-6 rounded-lg border border-white/20 bg-white/10 p-3">
            <p className="text-xs uppercase tracking-wide text-cyan-100/85">Collection Status</p>
            <p className="mt-1 text-sm font-semibold text-white">Focus on ageing invoices this week</p>
          </div>
        </div>
      </div>

      <RecentBills bills={stats.recent_bills} />
    </section>
  );
}

