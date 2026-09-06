import type { BillStatus } from "../../types";

export function StatusBadge({ status }: { status: BillStatus }) {
  const styles = {
    Paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
    Cancelled: "bg-red-50 text-red-700 ring-red-200",
  };
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ring-1 ${styles[status]}`}
    >
      {status}
    </span>
  );
}
