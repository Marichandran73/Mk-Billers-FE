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
  | "template-10";

export interface Company {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  phone?: string;
  address?: string;
  gst_number?: string;
  logo?: string;
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
