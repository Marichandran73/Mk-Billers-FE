import { COMPANY } from "./company";

export const BillStructure6 = ({ bill }: { bill: any }) => {
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
    <div className="w-full max-w-4xl mx-auto p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header with waves */}
        <div className="relative bg-gradient-to-r from-teal-500 to-emerald-500 px-8 py-8">
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 1440 60"
              className="w-full"
              preserveAspectRatio="none"
            >
              <path
                fill="white"
                d="M0,20 C360,60 720,0 1080,30 C1260,45 1380,20 1440,40 L1440,60 L0,60 Z"
              />
            </svg>
          </div>
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl">
                  🏢
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white">
                    {companyData.name}
                  </h1>
                  <p className="text-teal-100 text-sm">{companyData.tagline}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="bg-white text-teal-700 px-5 py-1.5 rounded-full font-bold text-sm shadow-lg">
                INVOICE
              </span>
              <p className="text-white/80 text-sm mt-2 font-mono">
                #{bill._id?.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-teal-50 p-4 rounded-2xl">
              <p className="text-teal-600 text-xs font-bold uppercase tracking-wider">
                Customer
              </p>
              <p className="font-bold text-gray-800 text-lg">
                {customerDetails.customerName || "-"}
              </p>
              <p className="text-gray-600 text-sm">
                {customerDetails.address || "-"}
              </p>
              <p className="text-gray-600 text-sm">
                📱 {customerDetails.phone || "-"}
              </p>
              <p className="text-gray-600 text-sm">
                📧 {customerDetails.email || "-"}
              </p>
            </div>
            <div className="bg-teal-50 p-4 rounded-2xl">
              <p className="text-teal-600 text-xs font-bold uppercase tracking-wider">
                Details
              </p>
              <div className="grid grid-cols-2 gap-1 text-sm mt-1">
                <span className="text-gray-500">Date:</span>
                <span className="font-medium">
                  {formatDate(bill.createdAt)}
                </span>
                <span className="text-gray-500">Due:</span>
                <span className="font-medium">{formatDate(bill.dueDate)}</span>
                <span className="text-gray-500">Supply:</span>
                <span className="font-medium">
                  {customerDetails.placeOfSupply || "-"}
                </span>
                <span className="text-gray-500">State:</span>
                <span className="font-medium">
                  {customerDetails.state || "-"}
                </span>
                <span className="text-gray-500">GST:</span>
                <span className="font-medium">
                  {customerDetails.gst || "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Rate</th>
                  <th className="px-3 py-2 text-right">GST</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {billItems.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-3 py-2">{item.description || "-"}</td>
                    <td className="px-3 py-2 text-right">
                      {item.quantity ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatCurrency(item.rate || 0)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.gstRate ?? 0}%
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatCurrency(item.amount || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-72 bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-2xl">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sub Total</span>
                  <span>{formatCurrency(totals.subTotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>
                    {formatCurrency((totals.cgst || 0) + (totals.sgst || 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span>-{formatCurrency(totals.discount || 0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-teal-600 font-bold text-lg text-teal-700">
                  <span>Total</span>
                  <span>{formatCurrency(totals.grandTotal || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center text-xs text-gray-400">
            <span>GST: {companyData.gstin}</span>
            <span className="text-teal-600 font-medium">
              ✨ Thank you for your business!
            </span>
            <span>{companyData.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
