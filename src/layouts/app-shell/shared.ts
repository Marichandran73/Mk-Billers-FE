import type { BillItem, InvoiceSettings, InvoiceTemplateId } from "../../types";
import type { CustomerPayload } from "../../services/customerApi";

export const INVOICE_TEMPLATE_OPTIONS: {
  id: InvoiceTemplateId;
  label: string;
}[] = [
  { id: "template-1", label: "Structure 1 (Classic)" },
  { id: "template-2", label: "Structure 2 (Bordered)" },
  { id: "template-3", label: "Structure 3 (Soft)" },
  { id: "template-4", label: "Structure 4 (Minimal)" },
  { id: "template-5", label: "Structure 5 (Compact)" },
  { id: "template-6", label: "Structure 6 (Modern)" },
  { id: "template-7", label: "Structure 7 (Mono)" },
  { id: "template-8", label: "Structure 8 (Slate)" },
  { id: "template-9", label: "Structure 9 (Warm)" },
  { id: "template-10", label: "Structure 10 (Bold)" },
];

export const TEMPLATE_STORAGE_KEY = "fe_bills_invoice_template";

export function getStoredInvoiceTemplate(): InvoiceTemplateId {
  const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
  const valid = INVOICE_TEMPLATE_OPTIONS.some(
    (template) => template.id === raw,
  );
  return valid ? (raw as InvoiceTemplateId) : "template-1";
}

export function getInvoiceTemplateClasses(templateId: InvoiceTemplateId) {
  const map: Record<
    InvoiceTemplateId,
    {
      shell: string;
      header: string;
      tableHead: string;
      summary: string;
      qrCard: string;
      footer: string;
    }
  > = {
    "template-1": {
      shell: "border border-slate-200 bg-white",
      header: "border-slate-200",
      tableHead: "border-slate-200 bg-slate-50 text-slate-500",
      summary: "border-slate-200 bg-slate-50",
      qrCard: "border-slate-200 bg-white",
      footer: "border-slate-200 text-slate-500",
    },
    "template-2": {
      shell: "border-2 border-slate-300 bg-white",
      header: "border-slate-300",
      tableHead: "border-slate-300 bg-slate-100 text-slate-600",
      summary: "border-slate-300 bg-white",
      qrCard: "border-slate-300 bg-slate-50",
      footer: "border-slate-300 text-slate-600",
    },
    "template-3": {
      shell: "border border-blue-100 bg-blue-50/30",
      header: "border-blue-200",
      tableHead: "border-blue-200 bg-blue-100/60 text-blue-700",
      summary: "border-blue-200 bg-white",
      qrCard: "border-blue-200 bg-blue-50/60",
      footer: "border-blue-200 text-blue-700",
    },
    "template-4": {
      shell: "border border-slate-100 bg-white",
      header: "border-slate-100",
      tableHead: "border-slate-100 bg-white text-slate-500",
      summary: "border-slate-100 bg-white",
      qrCard: "border-slate-100 bg-white",
      footer: "border-slate-100 text-slate-500",
    },
    "template-5": {
      shell: "border border-amber-200 bg-amber-50/30",
      header: "border-amber-200",
      tableHead: "border-amber-200 bg-amber-100/60 text-amber-800",
      summary: "border-amber-200 bg-white",
      qrCard: "border-amber-200 bg-amber-50/50",
      footer: "border-amber-200 text-amber-800",
    },
    "template-6": {
      shell: "border border-teal-200 bg-teal-50/30",
      header: "border-teal-200",
      tableHead: "border-teal-200 bg-teal-100/60 text-teal-800",
      summary: "border-teal-200 bg-white",
      qrCard: "border-teal-200 bg-teal-50/50",
      footer: "border-teal-200 text-teal-800",
    },
    "template-7": {
      shell: "border border-zinc-300 bg-white",
      header: "border-zinc-300",
      tableHead: "border-zinc-300 bg-zinc-100 text-zinc-700",
      summary: "border-zinc-300 bg-zinc-50",
      qrCard: "border-zinc-300 bg-white",
      footer: "border-zinc-300 text-zinc-700",
    },
    "template-8": {
      shell: "border border-slate-300 bg-slate-50/30",
      header: "border-slate-300",
      tableHead: "border-slate-300 bg-slate-200/70 text-slate-700",
      summary: "border-slate-300 bg-white",
      qrCard: "border-slate-300 bg-slate-100",
      footer: "border-slate-300 text-slate-700",
    },
    "template-9": {
      shell: "border border-rose-200 bg-rose-50/20",
      header: "border-rose-200",
      tableHead: "border-rose-200 bg-rose-100/60 text-rose-800",
      summary: "border-rose-200 bg-white",
      qrCard: "border-rose-200 bg-rose-50/40",
      footer: "border-rose-200 text-rose-800",
    },
    "template-10": {
      shell: "border-2 border-indigo-300 bg-white",
      header: "border-indigo-300",
      tableHead: "border-indigo-300 bg-indigo-100/70 text-indigo-800",
      summary: "border-indigo-300 bg-indigo-50/40",
      qrCard: "border-indigo-300 bg-white",
      footer: "border-indigo-300 text-indigo-800",
    },
  };
  return map[templateId];
}

export const emptyItem: Omit<BillItem, "id" | "amount"> = {
  description: "",
  quantity: 1,
  unit: "Nos",
  rate: 0,
  gst_percent: 18,
};

export const emptyCustomer: CustomerPayload = {
  name: "",
  company_name: "",
  email: "",
  phone: "",
  address: "",
  gst_number: "",
  city: "",
  state: "",
  pincode: "",
};

export const defaultSettings: InvoiceSettings = {
  logo: "",
  company_name: "MK-BILLERS",
  invoice_prefix: "INV",
  address: "",
  phone: "",
  email: "",
  gst_number: "",
  upi_id: "",
  bank_details: "",
  signature: "",
  footer_text: "Thank you for your business.",
  invoice_template: "template-1",
};
