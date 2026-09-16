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
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">Monthly Revenue</h2>
          <div className="mt-6 flex h-64 items-end gap-3 overflow-x-auto">
            {stats.monthly_revenue.map((item) => (
              <div
                className="flex min-w-16 flex-1 flex-col items-center gap-2"
                key={item.month}
              >
                <div
                  className="w-full rounded-t-md bg-brand-500"
                  style={{
                    height: `${Math.max((item.revenue / maxRevenue) * 210, 8)}px`,
                  }}
                  title={formatCurrency(item.revenue)}
                />
                <span className="text-xs text-slate-500">
                  {item.month.slice(0, 3)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">Outstanding</h2>
          <p className="mt-4 text-3xl font-semibold text-amber-600">
            {formatCurrency(stats.pending_total)}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Pending invoice value across the company workspace.
          </p>
        </div>
      </div>
      <RecentBills bills={stats.recent_bills} />
    </section>
  );
}

