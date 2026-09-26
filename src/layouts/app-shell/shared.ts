import type {
  BillItem,
  InvoiceSettings,
  InvoiceTemplateId,
  UserInvoiceTemplateField,
  UserInvoiceTemplateImage,
  UserInvoiceTemplate,
} from "../../types";
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
  { id: "template-custom", label: "Custom Template (My Layout)" },
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
    "template-custom": {
      shell: "border border-slate-300 bg-white",
      header: "border-slate-300",
      tableHead: "border-slate-300 bg-slate-100 text-slate-700",
      summary: "border-slate-300 bg-white",
      qrCard: "border-slate-300 bg-slate-50",
      footer: "border-slate-300 text-slate-700",
    },
  };
  return map[templateId];
}

export const defaultUserCustomTemplate: UserInvoiceTemplate = {
  page_width: 794,
  page_height: 1123,
  background_image: "",
  background_fit: "cover",
  background_x: 50,
  background_y: 50,
  background_zoom: 100,
  background_opacity: 1,
  use_background_gradient: true,
  background_gradient_from: "#ffffff",
  background_gradient_to: "#f8fafc",
  background_gradient_angle: 180,
  fields: [
    {
      key: "company_name",
      label: "Company Name",
      x: 40,
      y: 40,
      font_size: 24,
      width: 320,
      align: "left",
    },
    {
      key: "company_address",
      label: "Company Address",
      x: 40,
      y: 76,
      font_size: 12,
      width: 360,
      align: "left",
    },
    {
      key: "invoice_title",
      label: "INVOICE",
      x: 600,
      y: 40,
      font_size: 22,
      width: 160,
      align: "right",
    },
    {
      key: "invoice_number",
      label: "Invoice Number",
      x: 560,
      y: 76,
      font_size: 12,
      width: 200,
      align: "right",
    },
    {
      key: "invoice_date",
      label: "Invoice Date",
      x: 560,
      y: 96,
      font_size: 12,
      width: 200,
      align: "right",
    },
    {
      key: "bill_to",
      label: "Bill To",
      x: 40,
      y: 156,
      font_size: 16,
      width: 220,
      align: "left",
    },
    {
      key: "customer_name",
      label: "Customer Name",
      x: 40,
      y: 182,
      font_size: 14,
      width: 320,
      align: "left",
    },
    {
      key: "customer_address",
      label: "Customer Address",
      x: 40,
      y: 204,
      font_size: 12,
      width: 360,
      align: "left",
    },
    {
      key: "items_table",
      label: "Items Table",
      x: 40,
      y: 280,
      font_size: 11,
      width: 714,
      align: "left",
    },
    {
      key: "total_label",
      label: "Grand Total",
      x: 560,
      y: 760,
      font_size: 13,
      width: 120,
      align: "left",
    },
    {
      key: "grand_total",
      label: "Amount",
      x: 680,
      y: 760,
      font_size: 16,
      width: 80,
      align: "right",
    },
    {
      key: "footer_text",
      label: "Footer",
      x: 40,
      y: 1060,
      font_size: 12,
      width: 520,
      align: "left",
    },
    {
      key: "signature",
      label: "Authorized Signature",
      x: 580,
      y: 1032,
      font_size: 12,
      width: 180,
      align: "right",
    },
  ],
  images: [],
};

function normalizeTemplateField(
  field: UserInvoiceTemplateField,
): UserInvoiceTemplateField {
  return {
    ...field,
    font_family: field.font_family ?? "Poppins, sans-serif",
    font_weight: field.font_weight ?? 500,
    font_style: field.font_style ?? "normal",
    text_color: field.text_color ?? "#0f172a",
    use_gradient: field.use_gradient ?? false,
    gradient_from: field.gradient_from ?? "#0f172a",
    gradient_to: field.gradient_to ?? "#334155",
    gradient_angle: field.gradient_angle ?? 90,
  };
}

function normalizeTemplateImage(
  image: UserInvoiceTemplateImage,
): UserInvoiceTemplateImage {
  return {
    ...image,
    fit: image.fit ?? "contain",
    crop_x: image.crop_x ?? 50,
    crop_y: image.crop_y ?? 50,
    zoom: image.zoom ?? 100,
    opacity: image.opacity ?? 1,
    rotation: image.rotation ?? 0,
  };
}

export function normalizeUserCustomTemplate(
  template: UserInvoiceTemplate | null | undefined,
): UserInvoiceTemplate {
  const source = template ?? defaultUserCustomTemplate;
  const fallbackFields = defaultUserCustomTemplate.fields;
  return {
    page_width: source.page_width || defaultUserCustomTemplate.page_width,
    page_height: source.page_height || defaultUserCustomTemplate.page_height,
    background_image: source.background_image ?? "",
    background_fit: source.background_fit ?? "cover",
    background_x: source.background_x ?? 50,
    background_y: source.background_y ?? 50,
    background_zoom: source.background_zoom ?? 100,
    background_opacity: source.background_opacity ?? 1,
    use_background_gradient: source.use_background_gradient ?? true,
    background_gradient_from: source.background_gradient_from ?? "#ffffff",
    background_gradient_to: source.background_gradient_to ?? "#f8fafc",
    background_gradient_angle: source.background_gradient_angle ?? 180,
    fields: (source.fields?.length ? source.fields : fallbackFields).map(
      normalizeTemplateField,
    ),
    images: (source.images ?? []).map(normalizeTemplateImage),
  };
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
