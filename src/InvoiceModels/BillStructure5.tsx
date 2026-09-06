import { COMPANY } from "./company";

export const BillStructure5 = ({ bill }: { bill: any }) => {
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
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl overflow-hidden font-serif">
      {/* Gold Header */}
      <div className="bg-gradient-to-r from-amber-800 to-yellow-700 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-wide">
              {companyData.name}
            </h1>
            <p className="text-amber-200 text-sm italic">
              {companyData.tagline}
            </p>
          </div>
          <div className="text-right">
            <div className="bg-amber-200 px-6 py-1.5 rounded-sm">
              <span className="text-amber-900 font-bold text-lg tracking-widest">
                INVOICE
              </span>
            </div>
            <p className="text-amber-200 text-sm mt-1">
              #{bill._id?.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="border-b border-amber-200 pb-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Billed To
              </p>
              <p className="text-lg font-bold text-amber-900">
                {customerDetails.customerName || "-"}
              </p>
              <p className="text-sm text-amber-800">
                {customerDetails.address || "-"}
              </p>
              <p className="text-sm text-amber-800">
                📞 {customerDetails.phone || "-"}
              </p>
              <p className="text-sm text-amber-800">
                ✉️ {customerDetails.email || "-"}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p>
                <span className="text-amber-600 text-sm">Date:</span>{" "}
                <span className="font-bold">{formatDate(bill.createdAt)}</span>
              </p>
              <p>
                <span className="text-amber-600 text-sm">Due:</span>{" "}
                <span className="font-bold">{formatDate(bill.dueDate)}</span>
              </p>
              <p>
                <span className="text-amber-600 text-sm">Supply:</span>{" "}
                <span className="font-bold">
                  {customerDetails.placeOfSupply || "-"}
                </span>
              </p>
              <p>
                <span className="text-amber-600 text-sm">GST:</span>{" "}
                <span className="font-bold">{customerDetails.gst || "-"}</span>
              </p>
            </div>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="bg-amber-100 text-amber-800 text-xs uppercase tracking-wider">
              <th className="px-4 py-2 text-left rounded-l">Description</th>
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2 text-right">Rate</th>
              <th className="px-4 py-2 text-right">GST%</th>
              <th className="px-4 py-2 text-right rounded-r">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100">
            {billItems.map((item: any, index: number) => (
              <tr key={index}>
                <td className="px-4 py-2">{item.description || "-"}</td>
                <td className="px-4 py-2 text-right">{item.quantity ?? "-"}</td>
                <td className="px-4 py-2 text-right">
                  {formatCurrency(item.rate || 0)}
                </td>
                <td className="px-4 py-2 text-right">{item.gstRate ?? 0}%</td>
                <td className="px-4 py-2 text-right font-bold">
                  {formatCurrency(item.amount || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-72 bg-amber-50 border border-amber-200 p-4 rounded">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-amber-700">Sub Total</span>
                <span>{formatCurrency(totals.subTotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700">CGST</span>
                <span>{formatCurrency(totals.cgst || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700">SGST</span>
                <span>{formatCurrency(totals.sgst || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700">Transport</span>
                <span>{formatCurrency(totals.transportation || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700">Discount</span>
                <span>-{formatCurrency(totals.discount || 0)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-amber-700 font-bold text-lg text-amber-900">
                <span>Grand Total</span>
                <span>{formatCurrency(totals.grandTotal || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-amber-200 text-xs text-amber-600 flex justify-between">
          <span>GSTIN: {companyData.gstin}</span>
          <span className="italic">~ Elegance in every detail ~</span>
          <span>{companyData.phone}</span>
        </div>
      </div>
    </div>
  );
};
