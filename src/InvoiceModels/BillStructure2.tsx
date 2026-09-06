import { COMPANY } from "./company";

export const BillStructure2 = ({ bill }: { bill: any }) => {
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
    <div className="w-full max-w-4xl mx-auto bg-gray-900 text-white rounded-2xl overflow-hidden font-sans">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-8 py-8 border-b border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center font-black text-gray-900 text-xl">
                ★
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white">
                  {companyData.name}
                </h1>
                <p className="text-gray-400 text-sm">{companyData.tagline}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-yellow-500 px-5 py-1.5 rounded-lg inline-block">
              <span className="text-gray-900 font-bold text-sm tracking-widest">
                TAX INVOICE
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-2 font-mono">
              #{bill._id?.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
            <p className="text-yellow-500 text-xs uppercase tracking-wider font-bold mb-2">
              Billed To
            </p>
            <p className="font-bold text-lg text-white">
              {customerDetails.customerName || "-"}
            </p>
            <p className="text-gray-400 text-sm">
              {customerDetails.address || "-"}
            </p>
            <p className="text-gray-400 text-sm">
              📞 {customerDetails.phone || "-"}
            </p>
            <p className="text-gray-400 text-sm">
              ✉️ {customerDetails.email || "-"}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              GST: {customerDetails.gst || "-"}
            </p>
          </div>
          <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-500">Invoice Date</span>
                <span className="text-white font-medium">
                  {formatDate(bill.createdAt)}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-500">Due Date</span>
                <span className="text-white font-medium">
                  {formatDate(bill.dueDate)}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-500">Place of Supply</span>
                <span className="text-white font-medium">
                  {customerDetails.placeOfSupply || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">State</span>
                <span className="text-white font-medium">
                  {customerDetails.state || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-gray-300 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left rounded-l-lg">#</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 text-right">GST%</th>
                <th className="px-4 py-3 text-right rounded-r-lg">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {billItems.map((item: any, index: number) => (
                <tr key={index} className="hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                  <td className="px-4 py-3">{item.description || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    {item.quantity ?? "-"}
                  </td>
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
        </div>

        <div className="flex justify-end">
          <div className="w-80 bg-gray-800/50 p-5 rounded-xl border border-gray-700">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Sub Total</span>
                <span className="text-white">
                  {formatCurrency(totals.subTotal || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">CGST</span>
                <span className="text-white">
                  {formatCurrency(totals.cgst || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">SGST</span>
                <span className="text-white">
                  {formatCurrency(totals.sgst || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Transport</span>
                <span className="text-white">
                  {formatCurrency(totals.transportation || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Discount</span>
                <span className="text-yellow-400">
                  -{formatCurrency(totals.discount || 0)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t-2 border-yellow-500 font-bold text-lg">
                <span className="text-yellow-500">Grand Total</span>
                <span className="text-yellow-500">
                  {formatCurrency(totals.grandTotal || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-700 text-xs text-gray-500 flex justify-between">
          <span>GSTIN: {companyData.gstin}</span>
          <span className="text-yellow-500 font-medium">★ Premium Service</span>
          <span>{companyData.phone}</span>
        </div>
      </div>
    </div>
  );
};
