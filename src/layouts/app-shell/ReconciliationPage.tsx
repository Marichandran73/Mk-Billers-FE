import { useEffect, useMemo, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { billApi } from "../../services/billApi";
import type { Bill } from "../../types";
import { formatCurrency } from "../../utils/billing";
import { PageTitle } from "./PageTitle";
import LoadingComp from "../../pages/ReusableCom/LoadingComp";

type ReconciliationRow = {
  id: string;
  date: string;
  description: string;
  amount: number;
  billId: number | null;
};

export function ReconciliationPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [rows, setRows] = useState<ReconciliationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    billApi.list({ page: 1, limit: 100 })
      .then(async (firstPage) => {
        const pages = Math.ceil(firstPage.total / 100);
        const rest = await Promise.all(
          Array.from({ length: Math.max(pages - 1, 0) }, (_, index) =>
            billApi.list({ page: index + 2, limit: 100 }),
          ),
        );
        setBills([...firstPage.items, ...rest.flatMap((page) => page.items)]);
      })
      .catch(() => toast.error("Unable to load invoices for reconciliation"))
      .finally(() => setLoading(false));
  }, []);

  const matchedCount = useMemo(() => rows.filter((row) => row.billId !== null).length, [rows]);

  const importStatement = async (file?: File) => {
    if (!file) return;
    setImporting(true);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (!rawRows.length) throw new Error("The statement has no transaction rows.");

      const columns = Object.keys(rawRows[0]);
      const findColumn = (terms: string[]) => columns.find((column) =>
        terms.some((term) => column.toLowerCase().includes(term)),
      );
      const dateColumn = findColumn(["date"]);
      const descriptionColumn = findColumn(["description", "narration", "particular", "reference", "details"]);
      const amountColumn = findColumn(["amount", "credit"]);
      if (!dateColumn || !descriptionColumn || !amountColumn) {
        throw new Error("Include columns named Date, Description (or Narration), and Amount (or Credit).");
      }

      const transactions = rawRows.map((row, index) => {
        const description = String(row[descriptionColumn] ?? "").trim();
        const amount = Number(String(row[amountColumn]).replace(/[₹,\s]/g, ""));
        if (!Number.isFinite(amount) || amount <= 0) return null;
        const normalizedDescription = description.toLowerCase();
        const referencedBill = bills.find((bill) =>
          normalizedDescription.includes(bill.invoice_number.toLowerCase()) &&
          Math.abs(bill.grand_total - amount) < 0.01,
        );
        const rawDate = row[dateColumn];
        const date = rawDate instanceof Date
          ? rawDate.toISOString().slice(0, 10)
          : String(rawDate ?? "").trim();
        return { id: `${file.name}-${index}`, date, description, amount, billId: referencedBill?.id ?? null };
      }).filter((row): row is ReconciliationRow => row !== null);

      if (!transactions.length) throw new Error("No positive transaction amounts were found.");
      setRows(transactions);
      toast.success(`Imported ${transactions.length} bank transactions`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to read bank statement");
    } finally {
      setImporting(false);
    }
  };

  const exportResults = () => {
    const sheet = XLSX.utils.json_to_sheet(rows.map((row) => {
      const bill = bills.find((item) => item.id === row.billId);
      return {
        Date: row.date,
        Description: row.description,
        "Bank Amount": row.amount,
        "Invoice Number": bill?.invoice_number ?? "",
        "Invoice Amount": bill?.grand_total ?? "",
        Status: bill ? "Matched" : "Unmatched",
      };
    }));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Reconciliation");
    XLSX.writeFile(book, "MK-BILLERS-reconciliation.xlsx");
  };

  if (loading) return <LoadingComp />;

  return (
    <section className="space-y-5">
      <PageTitle
        title="Bank Reconciliation"
        action={
          <div className="flex flex-wrap gap-2">
            <label className="btn-primary cursor-pointer">
              <Upload className="h-4 w-4" /> {importing ? "Importing..." : "Import statement"}
              <input className="sr-only" type="file" accept=".csv,.xlsx,.xls" disabled={importing} onChange={(event) => {
                void importStatement(event.target.files?.[0]);
                event.target.value = "";
              }} />
            </label>
            <button className="btn-secondary" disabled={!rows.length} onClick={exportResults}>
              <FileSpreadsheet className="h-4 w-4" /> Export results
            </button>
          </div>
        }
      />
      <p className="text-sm text-slate-600">Import a CSV or Excel bank statement. Transactions are matched against invoice references and exact amounts; you can review or change every match before exporting.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">Transactions</p><p className="mt-1 text-2xl font-semibold">{rows.length}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">Matched</p><p className="mt-1 text-2xl font-semibold text-emerald-700">{matchedCount}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">Needs review</p><p className="mt-1 text-2xl font-semibold text-amber-700">{rows.length - matchedCount}</p></div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {rows.length ? (
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Date</th><th className="p-3">Bank description</th><th className="p-3">Amount</th><th className="p-3">Matched invoice</th><th className="p-3">Status</th></tr></thead>
            <tbody>{rows.map((row) => {
              const matched = bills.find((bill) => bill.id === row.billId);
              return <tr className="border-b border-slate-100" key={row.id}>
                <td className="p-3">{row.date || "—"}</td><td className="max-w-sm truncate p-3">{row.description || "—"}</td><td className="p-3">{formatCurrency(row.amount)}</td>
                <td className="p-3"><select className="field min-w-60" value={row.billId ?? ""} onChange={(event) => setRows((current) => current.map((item) => item.id === row.id ? { ...item, billId: event.target.value ? Number(event.target.value) : null } : item))}><option value="">Choose invoice...</option>{bills.map((bill) => <option key={bill.id} value={bill.id}>{bill.invoice_number} · {formatCurrency(bill.grand_total)} · {bill.customer?.name ?? "Customer"}</option>)}</select></td>
                <td className={`p-3 font-medium ${matched ? "text-emerald-700" : "text-amber-700"}`}>{matched ? "Matched" : "Review"}</td>
              </tr>;
            })}</tbody>
          </table>
        ) : <div className="p-8 text-center text-sm text-slate-500">Import a bank statement to begin. Use a header row with Date, Description or Narration, and Amount or Credit.</div>}
      </div>
    </section>
  );
}
