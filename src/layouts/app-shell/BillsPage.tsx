import { useCallback, useEffect, useState } from "react";
import { Edit, FileSpreadsheet, FileText, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

import { billApi, type BillFilters } from "../../services/billApi";
import { customerApi } from "../../services/customerApi";
import type { Bill, Customer } from "../../types";
import { formatCurrency } from "../../utils/billing";
import {
  getRestrictedActionMessage,
  hasStaffReachedBillLimit,
  isInactiveAdmin,
} from "../../utils/permissions";
import { CreateBillButton } from "./CreateBillButton";
import { EmptyState } from "./EmptyState";
import { IconLink } from "./IconLink";
// import { PageLoader } from "./PageLoader";
import LoadingComp from "../../pages/ReusableCom/LoadingComp";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PageTitle } from "./PageTitle";

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
  const [pendingDelete, setPendingDelete] = useState<Bill | null>(null);
  const [deleting, setDeleting] = useState(false);
  const staffBillActionRestricted = hasStaffReachedBillLimit(total);
  const writeRestricted = isInactiveAdmin() || staffBillActionRestricted || restrictAllActions;
  const createRestricted = isInactiveAdmin() || staffBillActionRestricted || restrictAllActions;

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
    const billsSheet = XLSX.utils.json_to_sheet(
      rows.map((bill) => ({
        "Invoice Number": bill.invoice_number,
        "Invoice Date": bill.invoice_date,
        Customer: bill.customer?.name ?? "",
        Notes: bill.notes,
        
        Subtotal: bill.subtotal,
        CGST: bill.cgst,
        SGST: bill.sgst,
        Transportation: bill.transportation,
        Discount: bill.discount,
        "Grand Total": bill.grand_total,
      })),
    );

    const uniqueCustomers = new Map<number, Bill["customer"]>();
    rows.forEach((bill) => {
      if (bill.customer?.id != null && !uniqueCustomers.has(bill.customer.id)) {
        uniqueCustomers.set(bill.customer.id, bill.customer);
      }
    });

    const customersSheet = XLSX.utils.json_to_sheet(
      Array.from(uniqueCustomers.values()).map((customer) => ({
        "Customer ID": customer?.id ?? "",
        "Customer Name": customer?.name ?? "",
        "Customer Company": customer?.company_name ?? "",
        "Customer Phone": customer?.phone ?? "",
        "Customer Email": customer?.email ?? "",
        "Customer Address": customer?.address ?? "",
        "Customer GST": customer?.gst_number ?? "",
        "Customer City": customer?.city ?? "",
        "Customer State": customer?.state ?? "",
        "Customer Pincode": customer?.pincode ?? "",
      })),
    );

    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, billsSheet, "Bills");
    XLSX.utils.book_append_sheet(book, customersSheet, "Customers");
    XLSX.writeFile(book, filename);
  };

  const exportFiltered = () => {
    if (restrictReportGeneration || writeRestricted) {
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
    if (writeRestricted) {
      toast.error(getRestrictedActionMessage("delete-bill"));
      return;
    }
    setPendingDelete(bill);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await billApi.remove(pendingDelete.id);
      toast.success("Bill deleted successfully");
      setPendingDelete(null);
      await load();
    } catch {
      toast.error("Unable to delete bill");
    } finally {
      setDeleting(false);
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
              disabled={createRestricted}
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
      </div>
      <div className="rounded-md border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <LoadingComp />
        ) : data.length === 0 ? (
          <EmptyState
            description="Create a bill or adjust filters."
            title="No bills found"
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
                      <div className="flex gap-2">
                        <IconLink to={`/bills/${bill.id}`} label="View">
                          <FileText className="h-4 w-4" />
                        </IconLink>
                        <IconLink
                          to={`/bills/${bill.id}/edit`}
                          label="Edit"
                          disabled={writeRestricted}
                          onBlocked={() =>
                            toast.error(getRestrictedActionMessage("edit-bill"))
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </IconLink>
                        <button
                          className={`icon-btn text-red-600 ${writeRestricted ? "opacity-50" : ""}`}
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
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete Invoice"
        message={
          pendingDelete
            ? `Are you sure you want to delete ${pendingDelete.invoice_number}? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete Invoice"
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
