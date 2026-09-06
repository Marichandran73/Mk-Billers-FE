import { COMPANY } from "./company";

export const BillStructure8 = ({ bill }: { bill: any }) => {
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
    <div className="w-full max-w-4xl mx-auto p-6 font-mono">
      <div className="border-2 border-dashed border-indigo-400 rounded-2xl p-6 bg-white">
        <div className="border-b-2 border-dashed border-indigo-300 pb-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-indigo-700">
                {companyData.name}
              </h1>
              <p className="text-sm text-gray-500">{companyData.tagline}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-indigo-700">INVOICE</p>
              <p className="text-sm text-gray-500">
                #{bill._id?.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b-2 border-dashed border-indigo-300">
          <div>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">
              Customer
            </p>
            <p className="font-bold">{customerDetails.customerName || "-"}</p>
            <p className="text-sm">{customerDetails.address || "-"}</p>
            <p className="text-sm">{customerDetails.phone || "-"}</p>
            <p className="text-sm">{customerDetails.email || "-"}</p>
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
              <span className="text-gray-500">Supply:</span>{" "}
              {customerDetails.placeOfSupply || "-"}
            </p>
            <p>
              <span className="text-gray-500">GST:</span>{" "}
              {customerDetails.gst || "-"}
            </p>
          </div>
        </div>

        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b-2 border-dashed border-indigo-300 text-indigo-600 text-xs uppercase tracking-wider">
              <th className="px-3 py-2 text-left">Item</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Rate</th>
              <th className="px-3 py-2 text-right">GST%</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-indigo-200">
            {billItems.map((item: any, index: number) => (
              <tr key={index}>
                <td className="px-3 py-2">{item.description || "-"}</td>
                <td className="px-3 py-2 text-right">{item.quantity ?? "-"}</td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(item.rate || 0)}
                </td>
                <td className="px-3 py-2 text-right">{item.gstRate ?? 0}%</td>
                <td className="px-3 py-2 text-right font-bold">
                  {formatCurrency(item.amount || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-72 border-2 border-dashed border-indigo-300 p-4 rounded">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Sub Total</span>
                <span>{formatCurrency(totals.subTotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">CGST</span>
                <span>{formatCurrency(totals.cgst || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">SGST</span>
                <span>{formatCurrency(totals.sgst || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Discount</span>
                <span>-{formatCurrency(totals.discount || 0)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-dashed border-indigo-600 font-bold text-indigo-700">
                <span>Grand Total</span>
                <span>{formatCurrency(totals.grandTotal || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t-2 border-dashed border-indigo-300 text-xs text-gray-400 flex justify-between">
          <span>GST: {companyData.gstin}</span>
          <span className="text-indigo-500">✧ Thank You ✧</span>
          <span>{companyData.phone}</span>
        </div>
      </div>
    </div>
  );
};
