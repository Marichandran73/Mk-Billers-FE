import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  Download,
  Loader2,
  Mail,
  MessageCircle,
  Printer,
  ReceiptIndianRupee,
  Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { useNavigate, useParams } from "react-router-dom";

import { billApi } from "../../services/billApi";
import { settingsApi } from "../../services/settingsApi";
import type {
  Bill,
  BillPaymentSummary,
  InvoiceSettings,
  InvoiceTemplateId,
  PaymentMethod,
  UserInvoiceTemplate,
} from "../../types";
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
  defaultUserCustomTemplate,
  getInvoiceTemplateClasses,
  getStoredInvoiceTemplate,
  INVOICE_TEMPLATE_OPTIONS,
  normalizeUserCustomTemplate,
  TEMPLATE_STORAGE_KEY,
} from "./shared";

export function BillViewPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings);
  const [staffBillActionRestricted, setStaffBillActionRestricted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState<BillPaymentSummary | null>(null);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [customTemplate, setCustomTemplate] = useState<UserInvoiceTemplate>(
    defaultUserCustomTemplate,
  );
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplateId>(
    getStoredInvoiceTemplate,
  );
  const adminRestricted = isInactiveAdmin();

  const getShareMessage = () => {
    if (!bill) return "";
    const amountDue = paymentSummary?.outstanding_total ?? bill.grand_total;
    return [
      `Invoice ${bill.invoice_number} from ${settings.company_name}`,
      `Customer: ${bill.customer?.name ?? "Customer"}`,
      `Date: ${bill.invoice_date}`,
      `Amount due: ${formatCurrency(amountDue)}`,
      "Please find the invoice attached. Reply if you have any questions.",
    ].join("\n");
  };

  const shareByWhatsApp = () => {
    if (adminRestricted || staffBillActionRestricted) {
      toast.error(getRestrictedActionMessage("download-report"));
      return;
    }
    const phone = bill?.customer?.phone?.replace(/\D/g, "") ?? "";
    const phoneParam = phone ? `&phone=${phone}` : "";
    window.open(
      `https://wa.me/?text=${encodeURIComponent(getShareMessage())}${phoneParam}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  useEffect(() => {
    if (!id) return;
    Promise.all([
      billApi.get(Number(id)),
      settingsApi.invoice(),
      settingsApi.customTemplate().catch(() => defaultUserCustomTemplate),
      billApi.payments(Number(id)).catch(() => null),
    ])
      .then(([billData, settingsData, customTemplateData, paymentData]) => {
        setBill(billData);
        setPaymentSummary(paymentData);
        if (paymentData && paymentData.outstanding_total > 0) {
          setPaymentAmount(String(Number(paymentData.outstanding_total.toFixed(2))));
        }
        setCustomTemplate(normalizeUserCustomTemplate(customTemplateData));
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

  const recordPayment = async (event: FormEvent) => {
    event.preventDefault();
    if (!bill) return;
    if (adminRestricted || staffBillActionRestricted) {
      toast.error("Payment recording is disabled for your account.");
      return;
    }

    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }

    setRecordingPayment(true);
    try {
      const summary = await billApi.addPayment(bill.id, {
        amount,
        paid_on: paymentDate,
        payment_method: paymentMethod,
        reference: paymentReference.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });
      setPaymentSummary(summary);
      const freshBill = await billApi.get(bill.id);
      setBill(freshBill);
      setPaymentAmount(
        summary.outstanding_total > 0
          ? String(Number(summary.outstanding_total.toFixed(2)))
          : "",
      );
      setPaymentReference("");
      setPaymentNotes("");
      toast.success("Payment recorded successfully");
    } catch (error) {
      if (isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (typeof detail === "string" && detail.trim()) {
          toast.error(detail);
          return;
        }
      }
      toast.error("Unable to record payment");
    } finally {
      setRecordingPayment(false);
    }
  };

  const downloadPdf = async () => {
    if (adminRestricted || staffBillActionRestricted) {
      toast.error(getRestrictedActionMessage("download-report"));
      return;
    }
    if (!invoiceRef.current || !bill) return;
    setIsDownloading(true);
    try {
      const invoiceNode = invoiceRef.current;
      const sourceWidth = Math.max(
        invoiceNode.scrollWidth,
        invoiceNode.clientWidth,
        Math.ceil(invoiceNode.getBoundingClientRect().width),
      );
      const sourceHeight = Math.max(
        invoiceNode.scrollHeight,
        invoiceNode.clientHeight,
        Math.ceil(invoiceNode.getBoundingClientRect().height),
      );

      const captureHost = document.createElement("div");
      captureHost.style.position = "fixed";
      captureHost.style.left = "-10000px";
      captureHost.style.top = "0";
      captureHost.style.width = `${sourceWidth}px`;
      captureHost.style.background = "#ffffff";
      captureHost.style.opacity = "0";
      captureHost.style.pointerEvents = "none";

      const clonedInvoice = invoiceNode.cloneNode(true) as HTMLDivElement;
      clonedInvoice.style.width = `${sourceWidth}px`;
      clonedInvoice.style.maxWidth = `${sourceWidth}px`;
      if (selectedTemplate === "template-custom") {
        clonedInvoice.style.minHeight = `${sourceHeight}px`;
        clonedInvoice.style.height = `${sourceHeight}px`;
      } else {
        clonedInvoice.style.minHeight = "auto";
      }
      clonedInvoice.style.margin = "0";
      clonedInvoice.style.boxShadow = "none";
      clonedInvoice.style.overflow = "visible";

      const cloneScrollContainers = Array.from(
        clonedInvoice.querySelectorAll<HTMLElement>(".overflow-x-auto"),
      );
      const cloneTables = Array.from(clonedInvoice.querySelectorAll<HTMLTableElement>("table"));

      cloneScrollContainers.forEach((node) => {
        node.style.overflow = "visible";
      });

      if (selectedTemplate !== "template-custom") {
        cloneTables.forEach((table) => {
          table.style.minWidth = "0";
          table.style.width = "100%";
          table.style.tableLayout = "fixed";
        });
      }

      captureHost.appendChild(clonedInvoice);
      document.body.appendChild(captureHost);

      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      const captureScale = isMobile ? 1.6 : 2;

      const canvas = await (async () => {
        try {
          return await html2canvas(clonedInvoice, {
            scale: captureScale,
            backgroundColor: "#ffffff",
            useCORS: true,
            windowWidth: sourceWidth,
            windowHeight: sourceHeight,
            scrollX: 0,
            scrollY: 0,
          });
        } finally {
          captureHost.remove();
        }
      })();

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imageHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imageHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imageHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${bill.invoice_number}.pdf`);
    } catch {
      toast.error("Failed PDF generation");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!bill) return <LoadingComp />;

  return (
    <section className="space-y-5">
      <div className="no-print">
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
              <button
                className="btn-secondary"
                onClick={shareByWhatsApp}
                type="button"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </button>
              <a
                className="btn-secondary"
                href={`mailto:${encodeURIComponent(bill.customer?.email ?? "")}?subject=${encodeURIComponent(`Invoice ${bill.invoice_number} from ${settings.company_name}`)}&body=${encodeURIComponent(getShareMessage())}`}
                onClick={(event) => {
                  if (!bill.customer?.email) {
                    event.preventDefault();
                    toast.error("Add an email address to this customer before sharing by email.");
                    return;
                  }
                  if (adminRestricted || staffBillActionRestricted) {
                    event.preventDefault();
                    toast.error(getRestrictedActionMessage("download-report"));
                  }
                }}
              >
                <Mail className="h-4 w-4" /> Email
              </a>
              <button
                className="btn-primary"
                onClick={downloadPdf}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Download PDF
                  </>
                )}
              </button>
            </div>
          }
        />
      </div>

      {paymentSummary && (
        <div className="no-print panel-surface p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Grand Total</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(paymentSummary.grand_total)}</p>
            </article>
            <article className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Collected</p>
              <p className="mt-1 text-lg font-bold text-emerald-700">{formatCurrency(paymentSummary.paid_total)}</p>
            </article>
            <article className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Outstanding</p>
              <p className="mt-1 text-lg font-bold text-amber-700">{formatCurrency(paymentSummary.outstanding_total)}</p>
            </article>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Payment History</h3>
              {paymentSummary.payments.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No payments recorded yet.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="py-2">Date</th>
                        <th className="py-2">Method</th>
                        <th className="py-2">Reference</th>
                        <th className="py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentSummary.payments.map((payment) => (
                        <tr className="border-b border-slate-100" key={payment.id}>
                          <td className="py-2">{payment.paid_on}</td>
                          <td className="py-2">{payment.payment_method}</td>
                          <td className="py-2">{payment.reference || "-"}</td>
                          <td className="py-2 text-right font-semibold">{formatCurrency(payment.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <form className="rounded-lg border border-slate-200 bg-white p-4" onSubmit={recordPayment}>
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
                <Wallet className="h-4 w-4" /> Record Payment
              </h3>
              <div className="mt-3 space-y-3">
                <label className="label">
                  Amount
                  <input
                    className="field mt-1"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    required
                  />
                </label>
                <label className="label">
                  Payment Date
                  <input
                    className="field mt-1"
                    type="date"
                    value={paymentDate}
                    onChange={(event) => setPaymentDate(event.target.value)}
                    required
                  />
                </label>
                <label className="label">
                  Method
                  <select
                    className="field mt-1"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                  >
                    {[
                      "CASH",
                      "BANK",
                      "UPI",
                      "CARD",
                      "CHEQUE",
                      "OTHER",
                    ].map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="label">
                  Reference
                  <input
                    className="field mt-1"
                    placeholder="Txn ID / cheque no."
                    value={paymentReference}
                    onChange={(event) => setPaymentReference(event.target.value)}
                  />
                </label>
                <label className="label">
                  Notes
                  <textarea
                    className="field mt-1"
                    rows={2}
                    value={paymentNotes}
                    onChange={(event) => setPaymentNotes(event.target.value)}
                  />
                </label>
                <button
                  className="btn-primary w-full"
                  type="submit"
                  disabled={
                    recordingPayment ||
                    paymentSummary.outstanding_total <= 0 ||
                    adminRestricted ||
                    staffBillActionRestricted
                  }
                >
                  {recordingPayment ? "Recording..." : "Add Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <InvoicePreview
        bill={bill}
        settings={settings}
        refNode={invoiceRef}
        templateId={selectedTemplate}
        customTemplate={customTemplate}
      />
    </section>
  );
}

function InvoicePreview({
  bill,
  settings,
  refNode,
  templateId,
  customTemplate,
}: {
  bill: Bill;
  settings: InvoiceSettings;
  refNode: React.RefObject<HTMLDivElement | null>;
  templateId: InvoiceTemplateId;
  customTemplate: UserInvoiceTemplate;
}) {
  if (templateId === "template-custom") {
    return (
      <CustomInvoicePreview
        bill={bill}
        settings={settings}
        refNode={refNode}
        customTemplate={customTemplate}
      />
    );
  }

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

function resolveCustomFieldValue(
  key: string,
  label: string,
  bill: Bill,
  settings: InvoiceSettings,
): string {
  const compactAddress = [bill.customer?.address, bill.customer?.city, bill.customer?.state]
    .filter(Boolean)
    .join(", ");
  const map: Record<string, string> = {
    company_name: settings.company_name,
    company_address: settings.address ?? "",
    company_phone: settings.phone ?? "",
    company_email: settings.email ?? "",
    company_gst: settings.gst_number ? `GST: ${settings.gst_number}` : "",
    invoice_title: "INVOICE",
    invoice_prefix: settings.invoice_prefix,
    invoice_number_with_prefix: `${settings.invoice_prefix}-${bill.invoice_number}`,
    invoice_number: bill.invoice_number,
    invoice_date: `Date: ${bill.invoice_date}`,
    due_date: `Due: ${bill.due_date || "-"}`,
    bill_to: "Bill To",
    customer_name: bill.customer?.name ?? "Deleted customer",
    customer_address: compactAddress,
    customer_phone: bill.customer?.phone ?? "",
    customer_email: bill.customer?.email ?? "",
    customer_gst: bill.customer?.gst_number ? `GST: ${bill.customer.gst_number}` : "",
    subtotal: `Subtotal: ${formatCurrency(bill.subtotal)}`,
    cgst: `CGST: ${formatCurrency(bill.cgst)}`,
    sgst: `SGST: ${formatCurrency(bill.sgst)}`,
    transportation: `Transportation: ${formatCurrency(bill.transportation)}`,
    discount: `Discount: ${formatCurrency(bill.discount)}`,
    total_label: "Grand Total",
    grand_total: formatCurrency(bill.grand_total),
    amount_words: amountToWords(bill.grand_total),
    bank_details: settings.bank_details ?? "",
    upi_id: settings.upi_id ?? "",
    footer_text: settings.footer_text ?? "",
    signature: settings.signature || "Authorized Signature",
    notes: bill.notes ?? "",
  };
  return map[key] ?? label;
}

function CustomInvoicePreview({
  bill,
  settings,
  refNode,
  customTemplate,
}: {
  bill: Bill;
  settings: InvoiceSettings;
  refNode: React.RefObject<HTMLDivElement | null>;
  customTemplate: UserInvoiceTemplate;
}) {
  const width = customTemplate.page_width || 794;
  const height = customTemplate.page_height || 1123;

  return (
    <div className="invoice-print overflow-x-auto rounded-md border border-slate-200 bg-white p-3 shadow-soft sm:p-4">
      <div
        className="relative mx-auto bg-white"
        ref={refNode}
        style={{
          width: `${width}px`,
          minHeight: `${height}px`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: customTemplate.use_background_gradient
              ? `linear-gradient(${customTemplate.background_gradient_angle ?? 180}deg, ${customTemplate.background_gradient_from ?? "#ffffff"}, ${customTemplate.background_gradient_to ?? "#f8fafc"})`
              : "#ffffff",
          }}
        />
        {customTemplate.background_image && (
          <div className="absolute inset-0 overflow-hidden">
            <img
              alt="Background template"
              className="h-full w-full"
              src={customTemplate.background_image}
              style={{
                objectFit: customTemplate.background_fit,
                objectPosition: `${customTemplate.background_x}% ${customTemplate.background_y}%`,
                opacity: customTemplate.background_opacity,
                transform: `scale(${customTemplate.background_zoom / 100})`,
                transformOrigin: `${customTemplate.background_x}% ${customTemplate.background_y}%`,
              }}
            />
          </div>
        )}

        {customTemplate.images.map((image) => (
          <div
            className="absolute overflow-hidden"
            key={image.id}
            style={{
              left: `${image.x}px`,
              top: `${image.y}px`,
              width: `${image.width}px`,
              height: `${image.height}px`,
              opacity: image.opacity,
              transform: `rotate(${image.rotation}deg)`,
              transformOrigin: "center center",
            }}
          >
            <img
              alt="Template layer"
              className="h-full w-full"
              src={image.data_url}
              style={{
                objectFit: image.fit,
                objectPosition: `${image.crop_x}% ${image.crop_y}%`,
                transform: `scale(${image.zoom / 100})`,
                transformOrigin: `${image.crop_x}% ${image.crop_y}%`,
              }}
            />
          </div>
        ))}

        {customTemplate.fields.map((field) => {
          if (field.key === "items_table") {
            const tableTextColor = field.text_color ?? "#0f172a";
            const tableFontFamily = field.font_family ?? "Poppins, sans-serif";
            const tableFontWeight = field.font_weight ?? 500;
            const tableFontSize = field.font_size ?? 11;
            return (
              <div
                className="absolute overflow-hidden rounded border border-slate-300 bg-white"
                key={field.key}
                style={{
                  left: `${field.x}px`,
                  top: `${field.y}px`,
                  width: `${field.width ?? 714}px`,
                  minHeight: "150px",
                  color: tableTextColor,
                  fontFamily: tableFontFamily,
                  fontStyle: field.font_style ?? "normal",
                }}
              >
                <table className="w-full border-collapse text-left" style={{ fontSize: `${tableFontSize}px` }}>
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-100">
                      <th className="px-2 py-1" style={{ width: "56px", fontWeight: tableFontWeight }}>S.No</th>
                      <th className="px-2 py-1" style={{ fontWeight: tableFontWeight }}>Description</th>
                      <th className="px-2 py-1 text-right" style={{ width: "80px", fontWeight: tableFontWeight }}>Qty</th>
                      <th className="px-2 py-1 text-right" style={{ width: "110px", fontWeight: tableFontWeight }}>Rate</th>
                      <th className="px-2 py-1 text-right" style={{ width: "120px", fontWeight: tableFontWeight }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((item, index) => (
                      <tr className="border-b border-slate-200" key={`${item.description}-${index}`}>
                        <td className="px-2 py-1.5">{index + 1}</td>
                        <td className="px-2 py-1.5">{item.description}</td>
                        <td className="px-2 py-1.5 text-right">{item.quantity}</td>
                        <td className="px-2 py-1.5 text-right">{formatCurrency(item.rate)}</td>
                        <td className="px-2 py-1.5 text-right">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          if (field.key === "signature" && settings.signature?.startsWith("data:image/")) {
            return (
              <img
                alt="Authorized signature"
                className="absolute object-contain"
                key={field.key}
                src={settings.signature}
                style={{
                  left: `${field.x}px`,
                  top: `${field.y}px`,
                  width: `${field.width ?? 150}px`,
                  height: "56px",
                }}
              />
            );
          }
          if (field.key === "logo" && settings.logo) {
            return (
              <img
                alt="Company logo"
                className="absolute object-contain"
                key={field.key}
                src={settings.logo}
                style={{
                  left: `${field.x}px`,
                  top: `${field.y}px`,
                  width: `${field.width ?? 120}px`,
                  height: "80px",
                }}
              />
            );
          }

          return (
            <p
              className="absolute whitespace-pre-line break-words text-slate-900"
              key={field.key}
              style={{
                left: `${field.x}px`,
                top: `${field.y}px`,
                width: `${field.width ?? 180}px`,
                fontSize: `${field.font_size}px`,
                textAlign: field.align,
                fontFamily: field.font_family ?? "Poppins, sans-serif",
                fontWeight: field.font_weight ?? 500,
                fontStyle: field.font_style ?? "normal",
                color: field.use_gradient ? "transparent" : (field.text_color ?? "#0f172a"),
                backgroundImage: field.use_gradient
                  ? `linear-gradient(${field.gradient_angle ?? 90}deg, ${field.gradient_from ?? "#0f172a"}, ${field.gradient_to ?? "#334155"})`
                  : undefined,
                WebkitBackgroundClip: field.use_gradient ? "text" : undefined,
                backgroundClip: field.use_gradient ? "text" : undefined,
                WebkitTextFillColor: field.use_gradient ? "transparent" : undefined,
              }}
            >
              {resolveCustomFieldValue(field.key, field.label, bill, settings)}
            </p>
          );
        })}
      </div>
    </div>
  );
}
