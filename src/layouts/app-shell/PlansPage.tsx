import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { BadgeIndianRupee, Check, FileText, Headset, Loader2, Users } from "lucide-react";
import { toast } from "react-toastify";

import { settingsApi } from "../../services/settingsApi";
import type { CurrentPlan, Plan } from "../../types";
import { isStaffUser } from "../../utils/permissions";
import { PageTitle } from "./PageTitle";

function formatPrice(monthlyPriceInr: number) {
  if (monthlyPriceInr <= 0) return "₹0";
  return `₹${monthlyPriceInr.toLocaleString("en-IN")}`;
}

function getLimitText(limit: number | null | undefined, label: string) {
  if (limit == null) return `Unlimited ${label}`;
  return `${limit} ${label}`;
}

function updateStoredUserPlan(planCode: Plan["code"]) {
  const rawUser = localStorage.getItem("MKbillers_user");
  if (!rawUser) return;
  try {
    const user = JSON.parse(rawUser) as {
      company?: {
        plan_code?: string;
      };
    };
    localStorage.setItem(
      "MKbillers_user",
      JSON.stringify({
        ...user,
        company: {
          ...(user.company ?? {}),
          plan_code: planCode,
        },
      }),
    );
  } catch {
    // Ignore storage parse issues and keep app behavior unchanged.
  }
}

export function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingCode, setUpdatingCode] = useState<Plan["code"] | null>(null);
  const staffUser = isStaffUser();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [planList, current] = await Promise.all([
        settingsApi.plans(),
        settingsApi.currentPlan(),
      ]);
      setPlans(planList);
      setCurrentPlan(current);
    } catch {
      toast.error("Unable to load plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const switchPlan = async (planCode: Plan["code"]) => {
    if (staffUser) {
      toast.error("Only admin users can switch plans");
      return;
    }

    setUpdatingCode(planCode);
    try {
      const response = await settingsApi.updateCurrentPlan(planCode);
      updateStoredUserPlan(response.current_plan.code);
      setCurrentPlan(response.current_plan);
      setPlans((existing) =>
        existing.map((plan) => ({
          ...plan,
          current: plan.code === response.current_plan.code,
        })),
      );
      toast.success(response.message);
    } catch (error) {
      if (isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (typeof detail === "string" && detail.trim()) {
          toast.error(detail);
          return;
        }
      }
      toast.error("Unable to change plan");
    } finally {
      setUpdatingCode(null);
    }
  };

  const billUsagePercent = currentPlan?.usage.bill_usage_percent ?? 0;
  const userUsagePercent = currentPlan?.usage.user_usage_percent ?? 0;

  return (
    <section className="space-y-5">
      <PageTitle title="Plans" />

      {loading ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading plans...
          </div>
        </div>
      ) : (
        <>
          {currentPlan && (
            <div className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-3">
              <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Current Plan</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{currentPlan.name}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {formatPrice(currentPlan.monthly_price_inr)}
                  {currentPlan.monthly_price_inr > 0 ? " / month" : ""}
                </p>
              </article>
              <article className="rounded-lg border border-slate-200 p-4">
                <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                  <FileText className="h-4 w-4" /> Invoice Usage
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {currentPlan.usage.bills_used} used / {getLimitText(currentPlan.bill_limit, "invoices")}
                </p>
                {currentPlan.bill_limit != null && (
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${Math.min(100, billUsagePercent)}%` }}
                    />
                  </div>
                )}
              </article>
              <article className="rounded-lg border border-slate-200 p-4">
                <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                  <Users className="h-4 w-4" /> Active Users
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {currentPlan.usage.users_used} used / {getLimitText(currentPlan.user_limit, "users")}
                </p>
                {currentPlan.user_limit != null && (
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${Math.min(100, userUsagePercent)}%` }}
                    />
                  </div>
                )}
              </article>
            </div>
          )}

          <div className="grid items-stretch gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {plans.map((plan) => (
              <article
                key={plan.code}
                className={`flex min-h-[360px] flex-col rounded-2xl border p-5 shadow-sm ${
                  plan.current
                    ? "border-orange-300 bg-orange-50/80 ring-1 ring-orange-200"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{plan.name}</h3>
                  <p className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    {formatPrice(plan.monthly_price_inr)}
                    {plan.monthly_price_inr > 0 && (
                      <span className="ml-1 text-xs font-normal text-slate-500">/mo</span>
                    )}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {getLimitText(plan.bill_limit, "invoices")}, {getLimitText(plan.user_limit, "users")}
                  </p>
                </div>
                <ul className="mt-4 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                      <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" strokeWidth={2.5} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.current ? (
                  <div className="mt-4 flex h-10 items-center justify-center text-sm font-semibold text-orange-600" aria-current="true">
                    Current Plan
                  </div>
                ) : (
                  <button
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => {
                      void switchPlan(plan.code);
                    }}
                    disabled={Boolean(updatingCode)}
                  >
                    {updatingCode === plan.code ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                      </>
                    ) : (
                      <>
                        <BadgeIndianRupee className="mr-1 h-4 w-4" />
                        {staffUser ? "Contact Admin" : "Switch Plan"}
                      </>
                    )}
                  </button>
                )}
              </article>
            ))}
          </div>

          {currentPlan && (
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                Rules We Follow
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {currentPlan.rules.map((rule) => (
                  <li key={rule} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <p className="flex items-center gap-2 text-sm text-slate-500">
        <Headset className="h-4 w-4 text-orange-500" />
        Need help choosing?{" "}
        <a className="font-medium text-orange-600 underline underline-offset-2 hover:text-orange-700" href="mailto:mkbillers@gmail.com?subject=Plan%20help">
          Contact our team
        </a>
      </p>
    </section>
  );
}
