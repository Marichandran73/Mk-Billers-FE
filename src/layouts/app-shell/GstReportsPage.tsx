import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { billApi } from "../../services/billApi";
import type { Bill } from "../../types";
import { formatCurrency } from "../../utils/billing";
import LoadingComp from "../../pages/ReusableCom/LoadingComp";
import { PageTitle } from "./PageTitle";

export function GstReportsPage() {
  const today = new Date();
  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    billApi.list({ page: 1, limit: 100, month, year })
      .then(async (firstPage) => {
        const remaining = await Promise.all(
          Array.from({ length: Math.max(Math.ceil(firstPage.total / 100) - 1, 0) }, (_, index) =>
            billApi.list({ page: index + 2, limit: 100, month, year }),
          ),
        );
        if (!cancelled) setBills([...firstPage.items, ...remaining.flatMap((page) => page.items)]);
      })
      .catch(() => toast.error("Unable to load GST report data"))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [month, year]);

  const summary = useMemo(() => bills.reduce((result, bill) => ({
    taxable: result.taxable + bill.subtotal,
    cgst: result.cgst + bill.cgst,
    sgst: result.sgst + bill.sgst,
    total: result.total + bill.grand_total,
  }), { taxable: 0, cgst: 0, sgst: 0, total: 0 }), [bills]);

  const exportWorkbook = () => {
    const invoiceRows = bills.map((bill) => ({
      "Invoice Number": bill.invoice_number,
      "Invoice Date": bill.invoice_date,
      "Customer": bill.customer?.name ?? "",
      "Customer GSTIN": bill.customer?.gst_number ?? "",
      "Taxable Value": bill.subtotal,
      "CGST": bill.cgst,
      "SGST": bill.sgst,
      "Other Charges": bill.transportation,
      "Discount": bill.discount,
      "Invoice Total": bill.grand_total,
      "Status": bill.status,
    }));
    const rateTotals = new Map<number, { taxable: number; tax: number; invoices: Set<number> }>();
    bills.forEach((bill) => bill.items.forEach((item) => {
      const current = rateTotals.get(item.gst_percent) ?? { taxable: 0, tax: 0, invoices: new Set<number>() };
      current.taxable += item.quantity * item.rate;
      current.tax += (item.quantity * item.rate * item.gst_percent) / 100;
      current.invoices.add(bill.id);
      rateTotals.set(item.gst_percent, current);
    }));
    const rateRows = Array.from(rateTotals, ([rate, totals]) => ({
      "GST Rate (%)": rate,
      "Taxable Value": totals.taxable,
      "Calculated GST": totals.tax,
      "Invoice Count": totals.invoices.size,
    })).sort((a, b) => a["GST Rate (%)"] - b["GST Rate (%)"]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(invoiceRows), "Sales Register");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rateRows), "Tax Rate Summary");
    XLSX.writeFile(workbook, `MK-BILLERS-GST-${year}-${month.padStart(2, "0")}.xlsx`);
  };

  return (
    <section className="space-y-5">
      <PageTitle title="GST Reports" action={<button className="btn-primary" disabled={loading || !bills.length} onClick={exportWorkbook}><Download className="h-4 w-4" /> Export GST workbook</button>} />
      <p className="text-sm text-slate-600">Review sales and tax totals for the selected month, then export the invoice register and tax rate summary for your GST return preparation.</p>
      <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="label">Month<select className="field mt-1" value={month} onChange={(event) => setMonth(event.target.value)}>{Array.from({ length: 12 }, (_, index) => <option key={index} value={index + 1}>{new Date(2000, index).toLocaleString("en", { month: "long" })}</option>)}</select></label>
        <label className="label">Year<input className="field mt-1 w-32" inputMode="numeric" value={year} onChange={(event) => setYear(event.target.value)} /></label>
      </div>
      {loading ? <LoadingComp /> : <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Sales invoices" value={String(bills.length)} />
          <Metric label="Taxable sales" value={formatCurrency(summary.taxable)} />
          <Metric label="Output GST" value={formatCurrency(summary.cgst + summary.sgst)} />
          <Metric label="Invoice total" value={formatCurrency(summary.total)} />
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Invoice</th><th className="p-3">Date</th><th className="p-3">Customer</th><th className="p-3">GSTIN</th><th className="p-3">Taxable</th><th className="p-3">CGST</th><th className="p-3">SGST</th><th className="p-3">Total</th></tr></thead>
            <tbody>{bills.map((bill) => <tr className="border-b border-slate-100" key={bill.id}><td className="p-3 font-medium">{bill.invoice_number}</td><td className="p-3">{bill.invoice_date}</td><td className="p-3">{bill.customer?.name ?? "—"}</td><td className="p-3">{bill.customer?.gst_number ?? "Unregistered"}</td><td className="p-3">{formatCurrency(bill.subtotal)}</td><td className="p-3">{formatCurrency(bill.cgst)}</td><td className="p-3">{formatCurrency(bill.sgst)}</td><td className="p-3 font-semibold">{formatCurrency(bill.grand_total)}</td></tr>)}</tbody>
          </table>
          {!bills.length && <p className="p-8 text-center text-sm text-slate-500">No invoices for this month.</p>}
        </div>
      </>}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold text-slate-900">{value}</p></div>;
}
