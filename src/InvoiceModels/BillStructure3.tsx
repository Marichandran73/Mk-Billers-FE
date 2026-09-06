import { COMPANY } from "./company";

export const BillStructure3 = ({ bill }: { bill: any }) => {
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
    <div className="w-full max-w-4xl mx-auto bg-white shadow-sm border border-gray-100 rounded-lg font-sans">
      {/* Simple Header */}
      <div className="border-b border-gray-200 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-light text-gray-900">
              {companyData.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{companyData.tagline}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-light text-gray-900">INVOICE</p>
            <p className="text-sm text-gray-500">
              #{bill._id?.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-6 text-sm text-gray-500">
          <span>GSTIN: {companyData.gstin}</span>
          <span>|</span>
          <span>{companyData.address}</span>
          <span>|</span>
          <span>{companyData.phone}</span>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Customer
            </p>
            <p className="text-lg font-medium">
              {customerDetails.customerName || "-"}
            </p>
            <p className="text-sm text-gray-600">
              {customerDetails.address || "-"}
            </p>
            <p className="text-sm text-gray-600">
              {customerDetails.phone || "-"}
            </p>
            <p className="text-sm text-gray-600">
              {customerDetails.email || "-"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Details
            </p>
            <p>
              <span className="text-gray-500 text-sm">Date:</span>{" "}
              <span className="font-medium">{formatDate(bill.createdAt)}</span>
            </p>
            <p>
              <span className="text-gray-500 text-sm">Due:</span>{" "}
              <span className="font-medium">{formatDate(bill.dueDate)}</span>
            </p>
            <p>
              <span className="text-gray-500 text-sm">Supply:</span>{" "}
              <span className="font-medium">
                {customerDetails.placeOfSupply || "-"}
              </span>
            </p>
            <p>
              <span className="text-gray-500 text-sm">State:</span>{" "}
              <span className="font-medium">
                {customerDetails.state || "-"}
              </span>
            </p>
            <p>
              <span className="text-gray-500 text-sm">GST:</span>{" "}
              <span className="font-medium">{customerDetails.gst || "-"}</span>
            </p>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Rate</th>
              <th className="px-3 py-2 text-right">GST%</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {billItems.map((item: any, index: number) => (
              <tr key={index}>
                <td className="px-3 py-3">{item.description || "-"}</td>
                <td className="px-3 py-3 text-right">{item.quantity ?? "-"}</td>
                <td className="px-3 py-3 text-right">
                  {formatCurrency(item.rate || 0)}
                </td>
                <td className="px-3 py-3 text-right">{item.gstRate ?? 0}%</td>
                <td className="px-3 py-3 text-right font-medium">
                  {formatCurrency(item.amount || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-72">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Sub Total</span>
                <span>{formatCurrency(totals.subTotal || 0)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">CGST</span>
                <span>{formatCurrency(totals.cgst || 0)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">SGST</span>
                <span>{formatCurrency(totals.sgst || 0)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Transport</span>
                <span>{formatCurrency(totals.transportation || 0)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Discount</span>
                <span>-{formatCurrency(totals.discount || 0)}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-gray-300 font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(totals.grandTotal || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
          <span>Terms: Payment due within 15 days</span>
          <span>Thank you!</span>
        </div>
      </div>
    </div>
  );
};
