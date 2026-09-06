import type { Bill } from "../../types";
import { formatCurrency } from "../../utils/billing";
import { StatusBadge } from "./StatusBadge";

export function RecentBills({ bills }: { bills: Bill[] }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold">Recent Bills</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="py-3">Invoice</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr className="border-b border-slate-100" key={bill.id}>
                <td className="py-3 font-medium">{bill.invoice_number}</td>
                <td>{bill.customer?.name ?? "Deleted customer"}</td>
                <td>{bill.invoice_date}</td>
                <td>{formatCurrency(bill.grand_total)}</td>
                <td>
                  <StatusBadge status={bill.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
