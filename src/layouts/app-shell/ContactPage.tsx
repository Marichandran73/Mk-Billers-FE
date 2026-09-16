import { Mail, Phone } from "lucide-react";

import { PageTitle } from "./PageTitle";

export function ContactPage() {
  return (
    <section className="space-y-5">
      <PageTitle title="Contact Us" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">Support Email</h2>
          <p className="mt-2 text-sm text-slate-500">
            For account issues, upgrade help, or billing support.
          </p>
          <a
            href="mailto:mkbillers@gmail.com"
            className="mt-4 inline-flex items-center gap-2 text-brand-700 underline"
          >
            <Mail className="h-4 w-4" /> mkbillers@gmail.com
          </a>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">Phone / WhatsApp</h2>
          <p className="mt-2 text-sm text-slate-500">
            Talk to our team for quick onboarding and upgrades.
          </p>
          <a
            href="tel:+918778857604"
            className="mt-4 inline-flex items-center gap-2 text-brand-700 underline"
          >
            <Phone className="h-4 w-4" /> +91 87788 57604
          </a>
        </div>
      </div>
    </section>
  );
}
