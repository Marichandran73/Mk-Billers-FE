import { COMPANY } from "./company";

export const BillStructure1 = ({ bill }: { bill: any }) => {
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
    <div className="w-full max-w-4xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden font-sans">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {companyData.name}
            </h1>
            <p className="text-indigo-100 text-sm mt-1">
              {companyData.tagline}
            </p>
            <p className="text-indigo-200 text-xs mt-2">
              GST: {companyData.gstin}
            </p>
          </div>
          <div className="text-right">
            <span className="bg-white/20 backdrop-blur px-4 py-1 rounded-full text-white font-bold text-sm">
              INVOICE
            </span>
            <p className="text-indigo-100 text-sm mt-2">
              #{bill._id?.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Bill To
            </h3>
            <p className="font-semibold text-gray-800">
              {customerDetails.customerName || "-"}
            </p>
            <p className="text-sm text-gray-600">
              {customerDetails.address || "-"}
            </p>
            <p className="text-sm text-gray-600">
              📞 {customerDetails.phone || "-"}
            </p>
            <p className="text-sm text-gray-600">
              ✉️ {customerDetails.email || "-"}
            </p>
            <p className="text-sm text-gray-600">
              GST: {customerDetails.gst || "-"}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice Date</span>
                <span className="font-medium">
                  {formatDate(bill.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Due Date</span>
                <span className="font-medium">{formatDate(bill.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Place of Supply</span>
                <span className="font-medium">
                  {customerDetails.placeOfSupply || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">State</span>
                <span className="font-medium">
                  {customerDetails.state || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-700 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Rate</th>
              <th className="px-4 py-3 text-right">GST%</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {billItems.map((item: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3">{item.description || "-"}</td>
                <td className="px-4 py-3 text-right">{item.quantity ?? "-"}</td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(item.rate || 0)}
                </td>
                <td className="px-4 py-3 text-right">{item.gstRate ?? 0}%</td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(item.amount || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-80 bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Sub Total</span>
                <span>{formatCurrency(totals.subTotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CGST</span>
                <span>{formatCurrency(totals.cgst || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SGST</span>
                <span>{formatCurrency(totals.sgst || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transport</span>
                <span>{formatCurrency(totals.transportation || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span>-{formatCurrency(totals.discount || 0)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-indigo-600 font-bold text-lg text-indigo-700">
                <span>Grand Total</span>
                <span>{formatCurrency(totals.grandTotal || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
          <span>📍 {companyData.address}</span>
          <span>📱 {companyData.phone}</span>
          <span className="text-indigo-600 font-medium">Thank You!</span>
        </div>
      </div>
    </div>
  );
};
