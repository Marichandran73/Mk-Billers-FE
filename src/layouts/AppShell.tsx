import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Headset,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptIndianRupee,
  Settings,
  Users,
  X,
  FileSpreadsheet,
  FileText,
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside
        className={`no-print fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200 bg-white transition-all ${
          collapsed ? "w-20" : "w-72"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-16 min-w-0 items-center justify-between border-b border-slate-200 px-3 sm:px-4">
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
                <p className="text-xs text-slate-500">{sidebarSubtitle}</p>
              </div>
            )}
          </div>
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {[
            ["Dashboard", "/dashboard", LayoutDashboard],
            ["Bills", "/bills", FileText],
            ["Customers", "/customers", Users],
            ...(user?.role !== "SUPER_ADMIN"
              ? [["Contact", "/contact", Headset]]
              : []),
            ...(!staffUser ? [["Reports", "/reports", FileSpreadsheet]] : []),
            ["Settings", "/settings", Settings],
            ...(user?.role === "SUPER_ADMIN"
              ? [["Companies", "/super-admin/companies", Building2] as const]
              : []),
          ].map(([label, to, Icon]) => (
            <NavLink
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100"
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
        <div className="border-t border-slate-200 p-3">
          {!collapsed && (
            <div className="mb-3 rounded-md bg-slate-50 p-3 text-sm">
              <p className="font-semibold">{user?.company.name ?? "Company"}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          )}
          <button
            className="mb-2 hidden w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 lg:flex"
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
            className="flex w-full items-center justify-center gap-2 rounded-md border border-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
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
        <header className="no-print sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="lg:hidden"
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
            <div className="hidden items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium md:flex">
              <Building2 className="h-4 w-4 text-brand-600" />
              {user?.role ?? "ADMIN"}
            </div>
          </div>
        </header>
        <main className="min-w-0 p-3 sm:p-4 lg:p-6">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/bills" element={<BillsPage />} />
            <Route path="/bills/new" element={<BillFormPage />} />
            <Route path="/bills/:id/edit" element={<BillFormPage />} />
            <Route path="/bills/:id" element={<BillViewPage />} />
            <Route path="/customers" element={<CustomersPage />} />
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
