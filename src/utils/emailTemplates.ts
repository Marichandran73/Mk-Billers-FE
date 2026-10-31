import type { EmailTemplateId } from "../types";

export const EMAIL_TEMPLATE_STORAGE_KEY = "MKbillers_email_template";

export function getStoredEmailTemplate(): EmailTemplateId {
  const raw = localStorage.getItem(EMAIL_TEMPLATE_STORAGE_KEY);
  return raw === "modern" || raw === "minimal" || raw === "bold"
    ? raw
    : "classic";
}
