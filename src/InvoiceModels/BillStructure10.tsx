import { COMPANY } from "./company";

export const BillStructure10 = ({ bill }: { bill: any }) => {
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
    <div className="w-full max-w-4xl mx-auto bg-gray-900 rounded-2xl overflow-hidden shadow-2xl font-sans">
      {/* Gold Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b-2 border-yellow-500 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-yellow-500 rounded-full flex items-center justify-center text-2xl font-bold text-gray-900">
                ✦
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-wide">
                  {companyData.name}
                </h1>
                <p className="text-yellow-500 text-sm font-light">
                  {companyData.tagline}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-yellow-500 px-6 py-1.5">
              <span className="text-gray-900 font-bold text-sm tracking-widest">
                INVOICE
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1 font-mono">
              #{bill._id?.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
            <p className="text-yellow-500 text-xs font-bold uppercase tracking-wider mb-2">
              Billed To
            </p>
            <p className="text-white font-bold text-lg">
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
          <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
            <p className="text-yellow-500 text-xs font-bold uppercase tracking-wider mb-2">
              Details
            </p>
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
              <tr className="bg-gray-800 border-b-2 border-yellow-500">
                <th className="px-4 py-3 text-left text-yellow-500 text-xs uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-yellow-500 text-xs uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-yellow-500 text-xs uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-4 py-3 text-right text-yellow-500 text-xs uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-4 py-3 text-right text-yellow-500 text-xs uppercase tracking-wider">
                  GST%
                </th>
                <th className="px-4 py-3 text-right text-yellow-500 text-xs uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {billItems.map((item: any, index: number) => (
                <tr key={index} className="hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3 text-white">
                    {item.description || "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {item.quantity ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {formatCurrency(item.rate || 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {item.gstRate ?? 0}%
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium">
                    {formatCurrency(item.amount || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-80 bg-gray-800 p-5 rounded-lg border border-gray-700">
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

        <div className="mt-6 pt-4 border-t border-gray-800 flex justify-between items-center text-xs">
          <span className="text-gray-500">GSTIN: {companyData.gstin}</span>
          <div className="flex items-center gap-2">
            <span className="text-yellow-500">✦</span>
            <span className="text-gray-400">Luxury Service</span>
            <span className="text-yellow-500">✦</span>
          </div>
          <span className="text-gray-500">{companyData.phone}</span>
        </div>
      </div>
    </div>
  );
};
