import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import {
  Building2,
  BadgeIndianRupee,
  ChevronLeft,
  ChevronRight,
  Headset,
  LayoutDashboard,
  Landmark,
  LogOut,
  Menu,
  ReceiptIndianRupee,
  Settings,
  Users,
  X,
  FileSpreadsheet,
  FileText,
  ScrollText,
} from "lucide-react";
import { toast } from "react-toastify";

import { authApi } from "../services/authApi";
import { settingsApi } from "../services/settingsApi";
import type { User } from "../types";
import { isStaffUser } from "../utils/permissions";
import { BillFormPage } from "./app-shell/BillFormPage";
import { BillsPage } from "./app-shell/BillsPage";
import { BillViewPage } from "./app-shell/BillViewPage";
import { CustomersPage } from "./app-shell/CustomersPage";
import { DashboardPage } from "./app-shell/DashboardPage";
import { ReportsPage } from "./app-shell/ReportsPage";
import { SettingsPage } from "./app-shell/SettingsPage";
import { SuperAdminCompaniesPage } from "./app-shell/SuperAdminCompaniesPage";
import { ContactPage } from "./app-shell/ContactPage";
import { CustomTemplatePage } from "./app-shell/CustomTemplatePage";
import { LetterPadPage } from "./app-shell/LetterPadPage";
import { PlansPage } from "./app-shell/PlansPage";
import { ReconciliationPage } from "./app-shell/ReconciliationPage";
import { GstReportsPage } from "./app-shell/GstReportsPage";

function getStoredUser() {
  const raw = localStorage.getItem("MKbillers_user");
  return raw ? (JSON.parse(raw) as User) : null;
}

export function AppShell() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [invoiceLogo, setInvoiceLogo] = useState("");
  const staffUser = isStaffUser();

  const sidebarCompanyName = user?.company?.name?.trim() || "MK-BILLERS";
  const sidebarSubtitle = user
    ? `${user.role.replace("_", " ")} panel`
    : "Business control center";

  useEffect(() => {
    authApi
      .me()
      .then((freshUser) => {
        setUser(freshUser);
        localStorage.setItem("MKbillers_user", JSON.stringify(freshUser));
      })
      .catch(() => toast.error("Session expired. Please login again."));

    settingsApi
      .invoice()
      .then((invoiceSettings) => setInvoiceLogo(invoiceSettings.logo ?? ""))
      .catch(() => {
        setInvoiceLogo("");
      });
  }, []);

  const logout = () => {
    localStorage.removeItem("MKbillers_token");
    localStorage.removeItem("MKbillers_user");
    navigate("/login");
  };

  return (
    <div className="app-shell-bg">
      <aside
        className={`no-print fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-800/80 bg-slate-950/95 text-slate-100 shadow-2xl backdrop-blur-sm transition-all ${
          collapsed ? "w-20" : "w-72"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-16 min-w-0 items-center justify-between border-b border-slate-800 px-3 sm:px-4">
          <div className="flex items-center gap-3">
            {invoiceLogo ? (
              <img
                className="h-10 w-10 rounded-md object-cover"
                src={invoiceLogo}
                alt="Company logo"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-600 text-white">
                <ReceiptIndianRupee className="h-5 w-5" />
              </div>
            )}
            {!collapsed && (
              <div>
                <p className="font-semibold leading-none tracking-wide">
                  {sidebarCompanyName}
                </p>
                <p className="text-xs text-slate-400">{sidebarSubtitle}</p>
              </div>
            )}
          </div>
          <button
            className="text-slate-300 hover:text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1.5 p-3">
          {[
            ["Dashboard", "/dashboard", LayoutDashboard],
            ["Bills", "/bills", FileText],
            ["Customers", "/customers", Users],
            ["Letter Pad", "/letters", ScrollText],
            ...(user?.role !== "SUPER_ADMIN"
              ? [["Contact", "/contact", Headset]]
              : []),
            ...(!staffUser ? [["Reports", "/reports", FileSpreadsheet]] : []),
            ["Settings", "/settings", Settings],
            ...(user?.role !== "SUPER_ADMIN"
              ? [["Plans", "/plans", BadgeIndianRupee]]
              : []),
            ...(user?.role === "ADMIN"
              ? [["Reconciliation", "/reconciliation", Landmark]]
              : []),
            ...(user?.role === "ADMIN"
              ? [["GST Reports", "/gst-reports", FileSpreadsheet]]
              : []),
            ...(user?.role === "SUPER_ADMIN"
              ? [["Companies", "/super-admin/companies", Building2] as const]
              : []),
          ].map(([label, to, Icon]) => (
            <NavLink
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "border-cyan-300/30 bg-cyan-400/15 text-cyan-200"
                    : "border-transparent text-slate-300 hover:border-slate-700 hover:bg-white/5 hover:text-white"
                }`
              }
              key={String(to)}
              to={String(to)}
              onClick={() => setMobileOpen(false)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{String(label)}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-3">
          {!collapsed && (
            <div className="mb-3 rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-sm">
              <p className="font-semibold text-slate-100">{user?.company.name ?? "Company"}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
          )}
          <button
            className="mb-2 hidden w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white lg:flex"
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            {!collapsed && "Collapse"}
          </button>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/40 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/15"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>
      <div
        className={`min-w-0 transition-all ${collapsed ? "lg:pl-20" : "lg:pl-72"}`}
      >
        <header className="no-print sticky top-0 z-20 m-3 flex min-h-16 flex-wrap items-center justify-between gap-3 border border-slate-200/80 bg-white/82 px-3 py-3 shadow-soft backdrop-blur-sm sm:m-4 sm:px-4 lg:m-6 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            {/* {invoiceLogo ? (
              <img
                className="h-8 w-8 rounded-md object-cover"
                src={invoiceLogo}
                alt="Company logo"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white">
                <ReceiptIndianRupee className="h-4 w-4" />
              </div>
            )} */}
            {/* <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-wide text-slate-500">
                {user?.role === "SUPER_ADMIN"
                  ? "Super Admin Control Center"
                  : "Company Workspace"}
              </p>
              <h1 className="truncate text-lg font-semibold">
                {user?.company.name ?? "MK-BILLERS"}
              </h1>
            </div> */}
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 md:flex">
              <Building2 className="h-4 w-4 text-brand-600" />
              {user?.role ?? "ADMIN"}
            </div>
          </div>
        </header>
        <main className="min-w-0 px-3 pb-4 sm:px-4 sm:pb-5 lg:px-6 lg:pb-6">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/bills" element={<BillsPage />} />
            <Route path="/bills/new" element={<BillFormPage />} />
            <Route path="/bills/:id/edit" element={<BillFormPage />} />
            <Route path="/bills/:id" element={<BillViewPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/letters" element={<LetterPadPage />} />
            <Route
              path="/contact"
              element={user?.role === "SUPER_ADMIN" ? <Navigate to="/dashboard" replace /> : <ContactPage />}
            />
            <Route
              path="/reports"
              element={staffUser ? <Navigate to="/dashboard" replace /> : <ReportsPage />}
            />
            <Route
              path="/settings"
              element={<SettingsPage />}
            />
            <Route
              path="/plans"
              element={user?.role === "SUPER_ADMIN" ? <Navigate to="/dashboard" replace /> : <PlansPage />}
            />
            <Route
              path="/reconciliation"
              element={user?.role !== "ADMIN" ? <Navigate to="/dashboard" replace /> : <ReconciliationPage />}
            />
            <Route
              path="/gst-reports"
              element={user?.role !== "ADMIN" ? <Navigate to="/dashboard" replace /> : <GstReportsPage />}
            />
            <Route
              path="/settings/custom-template"
              element={<CustomTemplatePage />}
            />
            {user?.role === "SUPER_ADMIN" && (
              <Route
                path="/super-admin/companies"
                element={<SuperAdminCompaniesPage />}
              />
            )}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
