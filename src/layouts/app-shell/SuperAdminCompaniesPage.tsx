import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Building2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { authApi } from "../../services/authApi";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { formatCurrency } from "../../utils/billing";
import { EmptyState } from "./EmptyState";
// import { PageLoader } from "./PageLoader";
import LoadingComp from "../../pages/ReusableCom/LoadingComp";
import { PageTitle } from "./PageTitle";
import { StatCard } from "./StatCard";

export function SuperAdminCompaniesPage() {
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    email: string;
    verification_code?: string;
    setup_link?: string;
    expires_at: string;
  } | null>(null);
  const [overview, setOverview] = useState<Awaited<
    ReturnType<typeof authApi.companiesOverview>
  > | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    null,
  );
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadOverview = async (searchText = userSearch) => {
    setLoadingOverview(true);
    try {
      const data = await authApi.companiesOverview(searchText);
      setOverview(data);
      setSelectedCompanyId(
        (current) => current ?? data.companies[0]?.id ?? null,
      );
    } catch {
      toast.error("Unable to load company overview");
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOverview(userSearch);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [userSearch]);

  const createAccess = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const response = await authApi.createCompanyAccess({
        company_name: companyName.trim(),
        company_email: companyEmail.trim(),
        admin_email: adminEmail.trim(),
      });
      setResult(response);
      setCompanyName("");
      setCompanyEmail("");
      setAdminEmail("");
      toast.success("Company access created");
      await loadOverview();
    } catch {
      toast.error("Unable to create company access");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteAccess = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await authApi.deleteCompanyAccess(pendingDelete.id);
      toast.success("Company access deleted");
      setPendingDelete(null);
      await loadOverview();
    } catch {
      toast.error("Unable to delete company access");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-lg bg-slate-950 px-4 py-6 text-white shadow-soft sm:px-6 sm:py-7 lg:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">
              MK-BILLERS / Super Admin
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Company control center
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Provision company workspaces, review customer activity, and
              compare monthly billing performance from one place.
            </p>
          </div>
          <div className="w-fit rounded-md border border-white/15 bg-white/10 px-4 py-3 text-sm text-slate-200">
            Access administration
          </div>
        </div>
      </div>
      <PageTitle title="Create Company Access" />
      <form
        className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:grid-cols-2"
        onSubmit={createAccess}
      >
        <p className="text-sm text-slate-500 md:col-span-2">
          Create a separate company workspace. The company email will receive a
          one-time OTP for password setup.
        </p>
        <label className="label">
          Company Name
          <input
            className="field mt-1"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            required
            minLength={2}
          />
        </label>
        <label className="label">
          Company Email
          <input
            className="field mt-1"
            type="email"
            value={companyEmail}
            onChange={(event) => setCompanyEmail(event.target.value)}
            required
          />
        </label>
        <label className="label md:col-span-2">
          Admin Login Email
          <input
            className="field mt-1"
            type="email"
            value={adminEmail}
            onChange={(event) => setAdminEmail(event.target.value)}
            required
          />
        </label>
        <button className="btn-primary md:col-span-2" disabled={loading}>
          <Building2 className="h-4 w-4" />
          {loading ? "Creating..." : "Create Company and Send OTP"}
        </button>
      </form>
      {result && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-5 text-sm">
          <p className="font-semibold text-emerald-800">{result.message}</p>
          <p className="mt-2 text-emerald-700">
            OTP recipient: Company Email ({result.email}). The code expires at{" "}
            {result.expires_at}.
          </p>
          {result.verification_code && (
            <p className="mt-3 font-mono text-lg text-emerald-900">
              Development OTP: {result.verification_code}
            </p>
          )}
          {result.setup_link && (
            <a
              className="mt-2 block break-all text-emerald-800 underline"
              href={result.setup_link}
            >
              Open password setup
            </a>
          )}
          <p className="mt-3 text-emerald-700">
            The company admin must enter the OTP, create a password, and confirm
            the password on the setup page.
          </p>
        </div>
      )}
      <div className="border-t border-slate-200 pt-6">
        <PageTitle title="Company Overview" />
        {loadingOverview ? (
          <LoadingComp />
        ) : !overview || overview.companies.length === 0 ? (
          <EmptyState
            title="No companies found"
            description="Create a company to see its billing overview."
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Companies" value={overview.companies.length} />
              <StatCard label="Customers" value={overview.customers.length} />
              <StatCard
                label="Bills"
                value={overview.companies.reduce(
                  (sum, company) => sum + company.bill_count,
                  0,
                )}
              />
              <StatCard
                label="Total Revenue"
                value={formatCurrency(
                  overview.companies.reduce(
                    (sum, company) => sum + company.total_revenue,
                    0,
                  ),
                )}
              />
            </div>
            <div className="mt-5 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-semibold">User List</h2>
                <label className="label w-full max-w-sm">
                  <span className="text-xs text-slate-500">Filter user</span>
                  <input
                    className="field mt-1"
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="Search by user email or company"
                  />
                </label>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="py-2">Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Access Action</th>
                      <th>Role Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.users.length === 0 ? (
                      <tr>
                        <td className="py-3 text-slate-500" colSpan={7}>
                          No users found for this filter.
                        </td>
                      </tr>
                    ) : (
                      overview.users.map((user) => (
                        <tr className="border-b border-slate-100" key={user.id}>
                          <td className="py-2 font-medium">{user.email.split("@")[0]}</td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                          <td>{user.company_name}</td>
                          <td>{user.is_active ? "Active" : "Inactive"}</td>
                          <td>
                            {user.role === "SUPER_ADMIN" ? (
                              <span className="text-xs text-slate-500">Not allowed</span>
                            ) : (
                              <button
                                className="btn-secondary"
                                onClick={async () => {
                                  try {
                                    const result = await authApi.updateUserAccessStatus(user.id, {
                                      is_active: !user.is_active,
                                    });
                                    toast.success(result.message);
                                    await loadOverview(userSearch);
                                  } catch {
                                    toast.error("Unable to update user access");
                                  }
                                }}
                              >
                                {user.is_active ? "Deactivate" : "Activate"}
                              </button>
                            )}
                          </td>
                          <td>
                            {user.role === "SUPER_ADMIN" ? (
                              <span className="text-xs text-slate-500">Not allowed</span>
                            ) : (
                              <button
                                className="btn-secondary"
                                onClick={async () => {
                                  try {
                                    const nextRole =
                                      user.role === "ADMIN" ? "STAFF" : "ADMIN";
                                    const result = await authApi.updateUserRole(user.id, {
                                      role: nextRole,
                                    });
                                    toast.success(result.message);
                                    await loadOverview(userSearch);
                                  } catch {
                                    toast.error("Unable to update user role");
                                  }
                                }}
                              >
                                Make {user.role === "ADMIN" ? "STAFF" : "ADMIN"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] h-[calc(70vh)] md:h-[calc(50vh)]">
              <div className="min-w-0 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <h2 className="font-semibold">Company List</h2>
                <div className="mt-4 space-y-2 h-[calc(60vh)]  overflow-y-scroll">
                  {overview.companies.map((company) => (
                    <button
                      className={`w-full rounded-md border p-3 text-left ${selectedCompanyId === company.id ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:bg-slate-50"}`}
                      key={company.id}
                      onClick={() => setSelectedCompanyId(company.id)}
                    >
                      <p className="font-semibold">{company.name}</p>
                      <p className="text-xs text-slate-500">{company.email}</p>
                      <p className="mt-2 text-xs text-slate-600">
                        {company.customer_count} customers |{" "}
                        {company.bill_count} bills
                      </p>
                      <p className="text-sm font-medium">
                        {formatCurrency(company.total_revenue)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              {(() => {
                const company =
                  overview.companies.find(
                    (item) => item.id === selectedCompanyId,
                  ) ?? overview.companies[0];
                const restricted = !company.is_active;
                const companyCustomers = overview.customers.filter(
                  (customer) => customer.company_id === company.id,
                );
                return (
                  <div className="min-w-0 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5 h-[calc(70vh)] overflow-y-scroll">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">{company.name}</h2>
                        <p className="text-sm text-slate-500">
                          Admin: {company.admin_email ?? "Not assigned"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className={`btn-secondary ${restricted ? "border-amber-300 text-amber-700 hover:bg-amber-50" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"}`}
                          onClick={async () => {
                            try {
                              const result =
                                await authApi.updateCompanyAccessStatus(
                                  company.id,
                                  { is_active: restricted },
                                );
                              toast.success(result.message);
                              await loadOverview();
                            } catch {
                              toast.error("Unable to update company access");
                            }
                          }}
                        >
                          {restricted ? "Restricted" : "Active"}
                        </button>
                        <button
                          className="btn-secondary border-red-200 text-red-600 hover:bg-red-50"
                          onClick={async () => {
                            setPendingDelete({ id: company.id, name: company.name });
                          }}
                        >
                          <Trash2 className="h-4 w-4" /> Delete Access
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      Access toggle controls admin actions for this company.
                    </p>
                    <h3 className="mt-6 font-medium">
                      Monthly Bill Generation
                    </h3>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[520px] text-left text-sm">
                        <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="py-2">Month</th>
                            <th>Bills</th>
                            <th>Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {company.monthly_bills.map((month) => (
                            <tr
                              className="border-b border-slate-100"
                              key={month.month}
                            >
                              <td className="py-2">{month.month}</td>
                              <td>{month.bill_count}</td>
                              <td>{formatCurrency(month.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <h3 className="mt-6 font-medium">
                      Customer List ({companyCustomers.length})
                    </h3>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[520px] text-left text-sm">
                        <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="py-2">Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {companyCustomers.map((customer) => (
                            <tr
                              className="border-b border-slate-100"
                              key={customer.id}
                            >
                              <td className="py-2">{customer.name}</td>
                              <td>{customer.email ?? "-"}</td>
                              <td>{customer.phone ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete Company Access"
        message={
          pendingDelete
            ? `Delete access for ${pendingDelete.name}? All company data will be deleted.`
            : ""
        }
        confirmLabel="Delete Access"
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDeleteAccess}
      />
    </section>
  );
}
