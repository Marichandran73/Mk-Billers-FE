import { COMPANY } from "./company";

export const BillStructure7 = ({ bill }: { bill: any }) => {
  if (!bill) return null;

  const companyData = COMPANY;
  const formatDate = (dateValue?: string) => {
    if (!dateValue) return "N/A";
    return new Date(dateValue).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const customerDetails = bill.customerDetails ?? {};
  const billItems = Array.isArray(bill.items) ? bill.items : [];
  const totals = bill.totals ?? {};

  return (
    <div className="w-full max-w-3xl mx-auto bg-white border border-gray-200 rounded font-sans text-sm">
      {/* Header */}
      <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{companyData.name}</h1>
          <p className="text-gray-400 text-xs">{companyData.tagline}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">INVOICE</p>
          <p className="text-gray-400 text-xs">
            #{bill._id?.slice(-6).toUpperCase()}
          </p>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between mb-4 pb-4 border-b border-gray-200">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">
              Bill To
            </p>
            <p className="font-bold">{customerDetails.customerName || "-"}</p>
            <p className="text-gray-600">{customerDetails.address || "-"}</p>
            <p className="text-gray-600">{customerDetails.phone || "-"}</p>
          </div>
          <div className="text-right">
            <p>
              <span className="text-gray-500">Date:</span>{" "}
              {formatDate(bill.createdAt)}
            </p>
            <p>
              <span className="text-gray-500">Due:</span>{" "}
              {formatDate(bill.dueDate)}
            </p>
            <p>
              <span className="text-gray-500">GST:</span>{" "}
              {customerDetails.gst || "-"}
            </p>
          </div>
        </div>

        <table className="w-full mb-4">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Rate</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {billItems.map((item: any, index: number) => (
              <tr key={index}>
                <td className="px-3 py-2">{item.description || "-"}</td>
                <td className="px-3 py-2 text-right">{item.quantity ?? "-"}</td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(item.rate || 0)}
                </td>
                <td className="px-3 py-2 text-right font-medium">
                  {formatCurrency(item.amount || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-56">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Sub Total</span>
                <span>{formatCurrency(totals.subTotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span>
                  {formatCurrency((totals.cgst || 0) + (totals.sgst || 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Discount</span>
                <span>-{formatCurrency(totals.discount || 0)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-300 font-bold">
                <span>Total</span>
                <span>{formatCurrency(totals.grandTotal || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
          <span>GSTIN: {companyData.gstin}</span>
          <span>Payment due in 7 days</span>
        </div>
      </div>
    </div>
  );
};
