import { COMPANY } from "./company";

export const BillStructure9 = ({ bill }: { bill: any }) => {
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
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 font-sans border border-green-200">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-green-700 px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
              🌿
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {companyData.name}
              </h1>
              <p className="text-green-200 text-sm">{companyData.tagline}</p>
            </div>
          </div>
          <div className="text-right text-white">
            <p className="text-lg font-bold">TAX INVOICE</p>
            <p className="text-green-200 text-sm">
              #{bill._id?.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-600 text-xs font-bold uppercase tracking-wider">
                Customer Details
              </p>
              <p className="font-bold text-gray-800">
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
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-600 text-xs font-bold uppercase tracking-wider">
                Invoice Details
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">
                    {formatDate(bill.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Due</span>
                  <span className="font-medium">
                    {formatDate(bill.dueDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Supply</span>
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
              <tr className="bg-green-50 text-green-700 text-xs uppercase tracking-wider">
                <th className="px-4 py-2 text-left rounded-l">Description</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-right">Rate</th>
                <th className="px-4 py-2 text-right">GST%</th>
                <th className="px-4 py-2 text-right rounded-r">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-100">
              {billItems.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="px-4 py-2">{item.description || "-"}</td>
                  <td className="px-4 py-2 text-right">
                    {item.quantity ?? "-"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatCurrency(item.rate || 0)}
                  </td>
                  <td className="px-4 py-2 text-right">{item.gstRate ?? 0}%</td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatCurrency(item.amount || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-72 bg-green-50 p-4 rounded-lg">
              <div className="space-y-1 text-sm">
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
                <div className="flex justify-between pt-2 border-t-2 border-green-600 font-bold text-lg text-green-700">
                  <span>Grand Total</span>
                  <span>{formatCurrency(totals.grandTotal || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-between text-xs text-gray-500 border-t border-green-200 pt-4">
            <span>🌱 GSTIN: {companyData.gstin}</span>
            <span className="text-green-600 font-medium">
              ♻️ Go Green - Save Paper
            </span>
            <span>📍 {companyData.address}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
