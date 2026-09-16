import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, Printer, ReceiptIndianRupee } from "lucide-react";
import { toast } from "react-toastify";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { useNavigate, useParams } from "react-router-dom";

import { billApi } from "../../services/billApi";
import { settingsApi } from "../../services/settingsApi";
import type { Bill, InvoiceSettings, InvoiceTemplateId } from "../../types";
import { amountToWords, formatCurrency, getUpiUrl } from "../../utils/billing";
import {
  getRestrictedActionMessage,
  hasStaffReachedBillLimit,
  isInactiveAdmin,
} from "../../utils/permissions";
// import { PageLoader } from "./PageLoader";
import LoadingComp from "../../pages/ReusableCom/LoadingComp";
import { PageTitle } from "./PageTitle";
import { SummaryBox } from "./SummaryBox";
import {
  defaultSettings,
  getInvoiceTemplateClasses,
  getStoredInvoiceTemplate,
  INVOICE_TEMPLATE_OPTIONS,
  TEMPLATE_STORAGE_KEY,
} from "./shared";

export function BillViewPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings);
  const [staffBillActionRestricted, setStaffBillActionRestricted] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplateId>(
    getStoredInvoiceTemplate,
  );
  const adminRestricted = isInactiveAdmin();

  useEffect(() => {
    if (!id) return;
    Promise.all([billApi.get(Number(id)), settingsApi.invoice()])
      .then(([billData, settingsData]) => {
        setBill(billData);
        const templateFromSettings = settingsData.invoice_template;
        const template = INVOICE_TEMPLATE_OPTIONS.some(
          (option) => option.id === templateFromSettings,
        )
          ? (templateFromSettings as InvoiceTemplateId)
          : getStoredInvoiceTemplate();
        localStorage.setItem(TEMPLATE_STORAGE_KEY, template);
        setSelectedTemplate(template);
        setSettings({
          ...defaultSettings,
          ...settingsData,
          invoice_template: template,
        });
      })
      .catch(() => toast.error("Unable to load invoice"));

    billApi
      .list({ page: 1, limit: 1 })
      .then((response) => setStaffBillActionRestricted(hasStaffReachedBillLimit(response.total)))
      .catch(() => {
        setStaffBillActionRestricted(false);
      });
  }, [id]);

  const downloadPdf = async () => {
    if (adminRestricted || staffBillActionRestricted) {
      toast.error(getRestrictedActionMessage("download-report"));
      return;
    }
    if (!invoiceRef.current || !bill) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`${bill.invoice_number}.pdf`);
    } catch {
      toast.error("Failed PDF generation");
    }
  };

  if (!bill) return <LoadingComp />;

  return (
    <section className="space-y-5">
      <PageTitle
        title={bill.invoice_number}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn-secondary"
              onClick={() => navigate("/bills")}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <select
              className="field min-w-56"
              value={selectedTemplate}
              onChange={(event) => {
                const value = event.target.value as InvoiceTemplateId;
                setSelectedTemplate(value);
                localStorage.setItem(TEMPLATE_STORAGE_KEY, value);
              }}
            >
              {INVOICE_TEMPLATE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              className="btn-secondary"
              onClick={() => {
                if (adminRestricted) {
                  toast.error(getRestrictedActionMessage("print-bill"));
                  return;
                }
                if (staffBillActionRestricted) {
                  toast.error(getRestrictedActionMessage("print-bill"));
                  return;
                }
                window.print();
              }}
            >
              <Printer className="h-4 w-4" /> Print Bill
            </button>
            <button className="btn-primary" onClick={downloadPdf}>
              <Download className="h-4 w-4" /> Download PDF
            </button>
          </div>
        }
      />
      <InvoicePreview
        bill={bill}
        settings={settings}
        refNode={invoiceRef}
        templateId={selectedTemplate}
      />
    </section>
  );
}

function InvoicePreview({
  bill,
  settings,
  refNode,
  templateId,
}: {
  bill: Bill;
  settings: InvoiceSettings;
  refNode: React.RefObject<HTMLDivElement | null>;
  templateId: InvoiceTemplateId;
}) {
  const upiUrl = settings.upi_id
    ? getUpiUrl(settings.upi_id, settings.company_name, bill.grand_total)
    : "";
  const qrValue =
    upiUrl ||
    `INVOICE:${bill.invoice_number}|DATE:${bill.invoice_date}|AMOUNT:${bill.grand_total.toFixed(2)}|COMPANY:${settings.company_name}`;
  const theme = getInvoiceTemplateClasses(templateId);

  return (
    <div
      ref={refNode}
      className={`invoice-print mx-auto max-w-5xl overflow-hidden rounded-md p-4 shadow-soft sm:p-6 lg:p-8 ${theme.shell}`}
    >
      <div
        className={`flex flex-col justify-between gap-6 border-b pb-6 md:flex-row ${theme.header}`}
      >
        <div>
          <div className="flex min-w-0 items-center gap-3">
            {settings.logo ? (
              <img
                className="h-14 w-14 rounded-md object-cover"
                src={settings.logo}
                alt="Company logo"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-md bg-brand-600 text-white">
                <ReceiptIndianRupee />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold sm:text-2xl">
                {settings.company_name}
              </h2>
              <p className="text-sm text-slate-500">{settings.address}</p>
            </div>
          </div>
          <p className="mt-3 break-words text-sm text-slate-600">
            GST: {settings.gst_number || "N/A"} | {settings.phone} |{" "}
            {settings.email}
          </p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-sm uppercase text-slate-500">Invoice</p>
          <p className="text-2xl font-semibold">{bill.invoice_number}</p>
          <p className="mt-2 text-sm text-slate-600">
            Date: {bill.invoice_date}
          </p>
          <p className="text-sm text-slate-600">Due: {bill.due_date || "-"}</p>
        </div>
      </div>
      <div className="grid gap-6 py-6 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">
            Bill To
          </p>
          <h3 className="mt-2 font-semibold">
            {bill.customer?.name ?? "Deleted customer"}
          </h3>
          <p className="text-sm text-slate-600">{bill.customer?.address}</p>
          <p className="text-sm text-slate-600">
            GST: {bill.customer?.gst_number || "N/A"}
          </p>
          <p className="text-sm text-slate-600">
            {bill.customer?.phone} {bill.customer?.email}
          </p>
        </div>
        <div className="md:text-right" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className={`border-y text-xs uppercase ${theme.tableHead}`}>
            <tr>
              <th className="p-3">SI No</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Rate</th>
              <th>GST</th>
              <th className="pr-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, index) => (
              <tr
                className="border-b border-slate-100"
                key={`${item.description}-${index}`}
              >
                <td className="p-3">{index + 1}</td>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{item.unit}</td>
                <td>{formatCurrency(item.rate)}</td>
                <td>{item.gst_percent}%</td>
                <td className="pr-3 text-right">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {bill.notes?.trim() && (
        <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">Notes</p>
          <p className="mt-2 whitespace-pre-line break-words text-sm text-slate-600">
            {bill.notes}
          </p>
        </div>
      )}
      <div className="grid gap-6 pt-6 md:grid-cols-[1fr_340px]">
        <div>
          <p className="text-sm font-medium">Amount in words</p>
          <p className="mt-1 text-sm text-slate-600">
            {amountToWords(bill.grand_total)}
          </p>
          <div
            className={`mt-5 inline-flex items-center gap-4 rounded-md border p-4 ${theme.qrCard}`}
          >
            <QRCodeSVG value={qrValue} size={104} />
            <div>
              <p className="font-semibold">
                {upiUrl ? "Scan to Pay" : "Scan Invoice"}
              </p>
              <p className="text-sm text-slate-500">
                {upiUrl ? settings.upi_id : bill.invoice_number}
              </p>
            </div>
          </div>
          {settings.bank_details && (
            <p className="mt-4 whitespace-pre-line text-sm text-slate-600">
              {settings.bank_details}
            </p>
          )}
        </div>
        <SummaryBox
          subtotal={bill.subtotal}
          cgst={bill.cgst}
          sgst={bill.sgst}
          transportation={bill.transportation}
          discount={bill.discount}
          grandTotal={bill.grand_total}
          className={theme.summary}
        />
      </div>
      <div
        className={`mt-12 flex justify-between border-t pt-6 text-sm ${theme.footer}`}
      >
        <p>{settings.footer_text}</p>
        <p className="font-medium text-slate-700">
          {settings.signature?.startsWith("data:image/") ? (
            <img
              className="max-h-16 max-w-40 object-contain"
              src={settings.signature}
              alt="Authorized signature"
            />
          ) : (
            settings.signature || "Authorized Signature"
          )}
        </p>
      </div>
    </div>
  );
}
