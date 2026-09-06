import { QRCodeSVG } from "qrcode.react";

const PaymentQR = ({
  grandTotal,
  companyName,
  upiId,
}: {
  grandTotal: number;
  companyName: string;
  upiId: string;
}) => {
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    companyName,
  )}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    "Invoice Payment",
  )}`;

  return (
    <div className="border rounded-lg p-3 w-fit">
      <QRCodeSVG value={upiUrl} size={130} />
      <p className="text-xs mt-2 text-center">Scan to Pay</p>
    </div>
  );
};

export default PaymentQR;
