export type InvoiceCompanyProfile = {
  name: string;
  tagline: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
  upiId: string;
};

export const COMPANY: InvoiceCompanyProfile = {
  name: "MK-BILLERS",
  tagline: "Billing and invoicing made simple",
  gstin: "N/A",
  address: "",
  phone: "",
  email: "",
  upiId: "febills@upi",
};
