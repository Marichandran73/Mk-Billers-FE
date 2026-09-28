import type { Bill } from "../../types";
import { formatCurrency } from "../../utils/billing";

export function RecentBills({ bills }: { bills: Bill[] }) {
  return (
    <div className="panel-surface p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Recent Bills</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-3">Invoice</th>
              <th className="py-3">Customer</th>
              <th className="py-3">Date</th>
              <th className="py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr className="border-b border-slate-100 transition hover:bg-slate-50/80" key={bill.id}>
                <td className="py-3 font-semibold text-slate-900">{bill.invoice_number}</td>
                <td className="text-slate-700">{bill.customer?.name ?? "Deleted customer"}</td>
                <td className="text-slate-600">{bill.invoice_date}</td>
                <td className="font-semibold text-slate-800">{formatCurrency(bill.grand_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
