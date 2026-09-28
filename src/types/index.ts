export type BillStatus = "Paid" | "Pending" | "Cancelled";

export type InvoiceTemplateId =
  | "template-1"
  | "template-2"
  | "template-3"
  | "template-4"
  | "template-5"
  | "template-6"
  | "template-7"
  | "template-8"
  | "template-9"
  | "template-10"
  | "template-custom";

export type InvoiceFieldAlign = "left" | "center" | "right";
export type InvoiceImageFit = "contain" | "cover";
export type InvoiceFontStyle = "normal" | "italic";

export interface UserInvoiceTemplateField {
  key: string;
  label: string;
  x: number;
  y: number;
  font_size: number;
  width?: number;
  align: InvoiceFieldAlign;
  font_family?: string;
  font_weight?: number;
  font_style?: InvoiceFontStyle;
  text_color?: string;
  use_gradient?: boolean;
  gradient_from?: string;
  gradient_to?: string;
  gradient_angle?: number;
}

export interface UserInvoiceTemplateImage {
  id: string;
  data_url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fit: InvoiceImageFit;
  crop_x: number;
  crop_y: number;
  zoom: number;
  opacity: number;
  rotation: number;
}

export interface UserInvoiceTemplate {
  page_width: number;
  page_height: number;
  background_image?: string;
  background_fit: InvoiceImageFit;
  background_x: number;
  background_y: number;
  background_zoom: number;
  background_opacity: number;
  use_background_gradient?: boolean;
  background_gradient_from?: string;
  background_gradient_to?: string;
  background_gradient_angle?: number;
  fields: UserInvoiceTemplateField[];
  images: UserInvoiceTemplateImage[];
}

export interface Company {
  id: number;
  name: string;
  email: string;
  plan_code?: string;
  is_active: boolean;
  phone?: string;
  address?: string;
  gst_number?: string;
  logo?: string;
}

export interface Plan {
  code: "FREE" | "PRO" | "PREMIUM" | "BUSINESS";
  name: string;
  monthly_price_inr: number;
  bill_limit?: number | null;
  user_limit?: number | null;
  features: string[];
  rules: string[];
  current: boolean;
}

export interface PlanUsage {
  bills_used: number;
  users_used: number;
  bill_limit?: number | null;
  user_limit?: number | null;
  bill_usage_percent?: number | null;
  user_usage_percent?: number | null;
}

export interface CurrentPlan {
  code: "FREE" | "PRO" | "PREMIUM" | "BUSINESS";
  name: string;
  monthly_price_inr: number;
  bill_limit?: number | null;
  user_limit?: number | null;
  features: string[];
  rules: string[];
  usage: PlanUsage;
}

export interface PlanSelectionResponse {
  message: string;
  current_plan: CurrentPlan;
}

export interface User {
  id: number;
  company_id: number;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "STAFF";
  company: Company;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ForgotPasswordResponse {
  message: string;
  reset_link?: string;
}

export interface InviteCompanyResponse {
  message: string;
  email: string;
  role: string;
  setup_link?: string;
  verification_code?: string;
  expires_at: string;
}

export interface CompanySummary {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  admin_email?: string;
  customer_count: number;
  bill_count: number;
  total_revenue: number;
  monthly_bills: { month: string; bill_count: number; revenue: number }[];
}

export interface SuperAdminOverview {
  companies: CompanySummary[];
  customers: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    company_id: number;
    company_name: string;
  }[];
  users: {
    id: number;
    email: string;
    role: "SUPER_ADMIN" | "ADMIN" | "STAFF";
    company_id: number;
    company_name: string;
    is_active: boolean;
  }[];
}

export interface Customer {
  id: number;
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  gst_number?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface BillItem {
  id?: number;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  gst_percent: number;
  amount: number;
}

export interface Bill {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer?: Customer;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  transportation: number;
  discount: number;
  grand_total: number;
  status: BillStatus;
  notes?: string;
  items: BillItem[];
}

export type PaymentMethod =
  | "CASH"
  | "BANK"
  | "UPI"
  | "CARD"
  | "CHEQUE"
  | "OTHER";

export interface BillPayment {
  id: number;
  bill_id: number;
  amount: number;
  paid_on: string;
  payment_method: PaymentMethod;
  reference?: string;
  notes?: string;
  created_at: string;
}

export interface BillPaymentPayload {
  amount: number;
  paid_on: string;
  payment_method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface BillPaymentSummary {
  bill_id: number;
  grand_total: number;
  paid_total: number;
  outstanding_total: number;
  fully_paid: boolean;
  payments: BillPayment[];
}

export interface BillPayload {
  invoice_number?: string;
  customer_id: number;
  invoice_date: string;
  due_date?: string;
  transportation: number;
  discount: number;
  status: BillStatus;
  notes?: string;
  items: Omit<BillItem, "id" | "amount">[];
}

export interface InvoiceSettings {
  logo?: string;
  company_name: string;
  address?: string;
  phone?: string;
  email?: string;
  gst_number?: string;
  upi_id?: string;
  bank_details?: string;
  signature?: string;
  footer_text?: string;
  invoice_prefix: string;
  invoice_template?: InvoiceTemplateId;
}

export interface DashboardStats {
  total_bills: number;
  total_revenue: number;
  total_customers: number;
  this_month_revenue: number;
  monthly_revenue: { month: string; revenue: number }[];
  recent_bills: Bill[];
  recent_customers: Customer[];
  pending_total: number;
}

export interface PaginatedBills {
  items: Bill[];
  total: number;
  page: number;
  limit: number;
}

export type LetterType = "QUOTATION" | "LETTER" | "CUSTOM";

export interface LetterPadPayload {
  customer_id?: number | null;
  letter_type: LetterType;
  title: string;
  subject?: string;
  content: string;
  quotation_amount?: number | null;
  valid_until?: string;
  footer_text?: string;
}

export interface LetterPad extends LetterPadPayload {
  id: number;
  customer?: Customer | null;
  created_at: string;
  updated_at: string;
}
