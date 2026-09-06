import { COMPANY } from "./company";

export const BillStructure4 = ({ bill }: { bill: any }) => {
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
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl overflow-hidden shadow-xl font-sans">
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-48 bg-gradient-to-b from-blue-600 to-blue-800 p-6 text-white flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl mb-4">
              📄
            </div>
            <h2 className="text-xl font-bold">INVOICE</h2>
            <p className="text-blue-200 text-sm mt-1">
              #{bill._id?.slice(-6).toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-blue-200 text-xs uppercase tracking-wider">
              Total
            </p>
            <p className="text-2xl font-bold">
              {formatCurrency(totals.grandTotal || 0)}
            </p>
            <div className="w-full h-px bg-blue-400/30 my-3"></div>
            <p className="text-blue-200 text-xs">{companyData.phone}</p>
            <p className="text-blue-200 text-xs">{companyData.email}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-100">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {companyData.name}
              </h1>
              <p className="text-sm text-gray-500">{companyData.tagline}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Date: {formatDate(bill.createdAt)}
              </p>
              <p className="text-sm text-gray-500">
                Due: {formatDate(bill.dueDate)}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Customer:</span>{" "}
                <span className="font-medium">
                  {customerDetails.customerName || "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>{" "}
                <span className="font-medium">
                  {customerDetails.phone || "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Address:</span>{" "}
                <span className="font-medium">
                  {customerDetails.address || "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">GST:</span>{" "}
                <span className="font-medium">
                  {customerDetails.gst || "-"}
                </span>
              </div>
            </div>
          </div>

          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">GST</th>
                <th className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {billItems.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="px-3 py-2">{item.description || "-"}</td>
                  <td className="px-3 py-2 text-right">
                    {item.quantity ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(item.rate || 0)}
                  </td>
                  <td className="px-3 py-2 text-right">{item.gstRate ?? 0}%</td>
                  <td className="px-3 py-2 text-right font-medium">
                    {formatCurrency(item.amount || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64 bg-gray-50 p-4 rounded-xl">
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
                <div className="flex justify-between pt-2 border-t-2 border-blue-600 font-bold text-blue-700">
                  <span>Grand Total</span>
                  <span>{formatCurrency(totals.grandTotal || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-gray-400">
            <span>
              GSTIN: {companyData.gstin} | {companyData.address}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
