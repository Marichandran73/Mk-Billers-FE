import { useCallback, useEffect, useState } from "react";
import { Edit, FileSpreadsheet, FileText, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

import { billApi, type BillFilters } from "../../services/billApi";
import { customerApi } from "../../services/customerApi";
import type { Bill, BillStatus, Customer } from "../../types";
import { formatCurrency } from "../../utils/billing";
import {
  getRestrictedActionMessage,
  isInactiveAdmin,
} from "../../utils/permissions";
import { CreateBillButton } from "./CreateBillButton";
import { EmptyState } from "./EmptyState";
import { IconLink } from "./IconLink";
import { PageLoader } from "./PageLoader";
import { PageTitle } from "./PageTitle";
import { StatusBadge } from "./StatusBadge";

type BillsPageProps = {
  restrictReportGeneration?: boolean;
  restrictAllActions?: boolean;
};

export function BillsPage({
  restrictReportGeneration = false,
  restrictAllActions = false,
}: BillsPageProps) {
  const [data, setData] = useState<Bill[]>([]);
  const [total, setTotal] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filters, setFilters] = useState<BillFilters>({ page: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const adminRestricted = isInactiveAdmin() || restrictAllActions;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bills, customerList] = await Promise.all([
        billApi.list(filters),
        customerApi.list(),
      ]);
      setData(bills.items);
      setTotal(bills.total);
      setCustomers(customerList);
    } catch {
      toast.error("Unable to load bills");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const exportRows = (rows: Bill[], filename: string) => {
    const sheet = XLSX.utils.json_to_sheet(
      rows.map((bill) => ({
        "Invoice Number": bill.invoice_number,
        "Invoice Date": bill.invoice_date,
        Customer: bill.customer?.name ?? "",
        Subtotal: bill.subtotal,
        CGST: bill.cgst,
        SGST: bill.sgst,
        Transportation: bill.transportation,
        Discount: bill.discount,
        "Grand Total": bill.grand_total,
        Status: bill.status,
      })),
    );
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Bills");
    XLSX.writeFile(book, filename);
  };

  const exportFiltered = () => {
    if (restrictReportGeneration || adminRestricted) {
      toast.error(getRestrictedActionMessage("download-report"));
      return;
    }
    const year = filters.year ?? new Date().getFullYear();
    const month = filters.month
      ? new Date(Number(year), Number(filters.month) - 1).toLocaleString("en", {
          month: "long",
        })
      : "All";
    exportRows(data, `MK-BILLERS-${month}-${year}.xlsx`);
  };

  const remove = async (bill: Bill) => {
    if (adminRestricted) {
      toast.error(getRestrictedActionMessage("delete-bill"));
      return;
    }
    if (
      !window.confirm(
        `Delete Invoice?\n\nAre you sure you want to delete ${bill.invoice_number}?\n\nThis action cannot be undone.`,
      )
    )
      return;
    try {
      await billApi.remove(bill.id);
      toast.success("Bill deleted successfully");
      await load();
    } catch {
      toast.error("Unable to delete bill");
    }
  };

  return (
    <section className="space-y-5">
      <PageTitle
        title="Bills"
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={exportFiltered}>
              <FileSpreadsheet className="h-4 w-4" /> Export Excel
            </button>
            <CreateBillButton
              disabled={adminRestricted}
              onBlocked={() =>
                toast.error(getRestrictedActionMessage("create-bill"))
              }
            />
          </div>
        }
      />
      <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-6">
        <input
          className="field lg:col-span-2"
          placeholder="Search invoice, customer, phone"
          value={filters.search ?? ""}
          onChange={(event) =>
            setFilters({ ...filters, search: event.target.value, page: 1 })
          }
        />
        <select
          className="field"
          value={filters.month ?? ""}
          onChange={(event) =>
            setFilters({ ...filters, month: event.target.value, page: 1 })
          }
        >
          <option value="">Month</option>
          {Array.from({ length: 12 }, (_, index) => (
            <option value={index + 1} key={index}>
              {new Date(2026, index).toLocaleString("en", { month: "long" })}
            </option>
          ))}
        </select>
        <input
          className="field"
          placeholder="Year"
          value={filters.year ?? ""}
          onChange={(event) =>
            setFilters({ ...filters, year: event.target.value, page: 1 })
          }
        />
        <select
          className="field"
          value={filters.customer_id ?? ""}
          onChange={(event) =>
            setFilters({ ...filters, customer_id: event.target.value, page: 1 })
          }
        >
          <option value="">Customer</option>
          {customers.map((customer) => (
            <option value={customer.id} key={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
        <select
          className="field"
          value={filters.status ?? ""}
          onChange={(event) =>
            setFilters({
              ...filters,
              status: event.target.value as BillStatus | "",
              page: 1,
            })
          }
        >
          <option value="">Status</option>
          <option>Paid</option>
          <option>Pending</option>
          <option>Cancelled</option>
        </select>
      </div>
      <div className="rounded-md border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <PageLoader />
        ) : data.length === 0 ? (
          <EmptyState
            title="No bills found"
            description="Create a bill or adjust filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  {[
                    "Invoice Number",
                    "Date",
                    "Customer",
                    "Items",
                    "Subtotal",
                    "GST",
                    "Discount",
                    "Grand Total",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th className="px-4 py-3" key={heading}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((bill) => (
                  <tr className="border-b border-slate-100" key={bill.id}>
                    <td className="px-4 py-3 font-medium">
                      {bill.invoice_number}
                    </td>
                    <td className="px-4 py-3">{bill.invoice_date}</td>
                    <td className="px-4 py-3">
                      {bill.customer?.name ?? "Deleted customer"}
                    </td>
                    <td className="px-4 py-3">{bill.items.length}</td>
                    <td className="px-4 py-3">
                      {formatCurrency(bill.subtotal)}
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(bill.cgst + bill.sgst)}
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(bill.discount)}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatCurrency(bill.grand_total)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={bill.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <IconLink to={`/bills/${bill.id}`} label="View">
                          <FileText className="h-4 w-4" />
                        </IconLink>
                        <IconLink
                          to={`/bills/${bill.id}/edit`}
                          label="Edit"
                          disabled={adminRestricted}
                          onBlocked={() =>
                            toast.error(getRestrictedActionMessage("edit-bill"))
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </IconLink>
                        <button
                          className={`icon-btn text-red-600 ${adminRestricted ? "opacity-50" : ""}`}
                          onClick={() => remove(bill)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
          <span>{total} bills</span>
          <span>Page {filters.page ?? 1}</span>
        </div>
      </div>
    </section>
  );
}
