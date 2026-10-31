import { useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { UserPlus } from "lucide-react";
import { toast } from "react-toastify";

import { EmailTemplatePicker } from "../../components/EmailTemplatePicker";
import { InviteResultCard } from "../../components/InviteResultCard";
import { authApi } from "../../services/authApi";
import type { EmailTemplateId, InviteCompanyResponse } from "../../types";
import { getStoredEmailTemplate } from "../../utils/emailTemplates";
import { PageTitle } from "./PageTitle";

export function TeamPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [template, setTemplate] = useState<EmailTemplateId>(
    getStoredEmailTemplate,
  );
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<InviteCompanyResponse | null>(null);

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const response = await authApi.inviteUser({
        email: email.trim(),
        role,
        email_template: template,
      });
      setResult(response);
      setEmail("");
      if (response.email_sent) {
        toast.success("Invite OTP sent");
      } else {
        toast.warning("User created, but email was not sent");
      }
    } catch (error) {
      const detail = isAxiosError<{ detail?: string }>(error)
        ? error.response?.data?.detail
        : undefined;
      toast.error(typeof detail === "string" ? detail : "Unable to invite user");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="space-y-5">
      <PageTitle title="Invite Team Member" />
      <form
        className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:grid-cols-[1fr_200px]"
        onSubmit={invite}
      >
        <p className="text-sm text-slate-500 md:col-span-2">
          The user receives a one-time OTP by email to set their password and
          join your company.
        </p>
        <label className="label">
          User Email
          <input
            className="field mt-1"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="label">
          Role
          <select
            className="field mt-1"
            value={role}
            onChange={(event) =>
              setRole(event.target.value as "ADMIN" | "STAFF")
            }
          >
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <div className="md:col-span-2">
          <EmailTemplatePicker
            purpose="invite"
            value={template}
            onChange={setTemplate}
          />
        </div>
        <button className="btn-primary md:col-span-2" disabled={sending}>
          <UserPlus className="h-4 w-4" />
          {sending ? "Sending..." : "Send Invite OTP"}
        </button>
      </form>
      {result && <InviteResultCard result={result} />}
    </section>
  );
}
