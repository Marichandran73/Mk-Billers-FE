import { formatCurrency } from "../../utils/billing";


export function SummaryBox({
  subtotal,
  cgst,
  sgst,
  transportation,
  discount,
  grandTotal,
  className = "border-slate-200 bg-slate-50",
}: {
  subtotal: number;
  cgst: number;
  sgst: number;
  transportation: number;
  discount: number;
  grandTotal: number;
  className?: string;
}) {
  return (
    <div className={`rounded-md border p-5 text-sm ${className}`}>
      {[
        ["Subtotal", subtotal],
        ["CGST", cgst],
        ["SGST", sgst],
        ["Transportation", transportation],
        ["Discount", -discount],
      ].map(([label, value]) => (
        <div
          className="flex justify-between border-b border-slate-200 py-2"
          key={String(label)}
        >
          <span className="text-slate-500">{label}</span>
          <span className="font-medium">{formatCurrency(Number(value))}</span>
        </div>
      ))}
      <div className="flex justify-between pt-4 text-lg font-semibold">
        <span>Grand Total</span>
        <span>{formatCurrency(grandTotal)}</span>
      </div>
    </div>
  );
}


