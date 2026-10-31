import { useEffect, useState } from "react";
import { Mail, Phone } from "lucide-react";

import { founderApi } from "../../services/founderApi";
import type { Founder } from "../../types";
import { PageTitle } from "./PageTitle";

const AVATAR_COLORS = ["bg-slate-900", "bg-orange-500", "bg-brand-600", "bg-teal-600"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ContactPage() {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    founderApi
      .list()
      .then(setFounders)
      .catch(() => setFounders([]))
      .finally(() => setLoading(false));
  }, []);

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

      {(loading || founders.length > 0) && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Meet the Founders</h2>
          <p className="mt-1 text-sm text-slate-500">
            The people building MK-BILLERS.
          </p>
          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Loading...</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {founders.map((founder, index) => (
                <article
                  className="flex items-center gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm"
                  key={founder.id}
                >
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white ${
                      AVATAR_COLORS[index % AVATAR_COLORS.length]
                    }`}
                  >
                    {initials(founder.name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-900">
                      {founder.name}
                    </h3>
                    <p className="mt-0.5 text-sm font-medium text-brand-700">
                      {founder.designation}
                    </p>
                    {founder.about && (
                      <p className="mt-1 text-sm text-slate-500">{founder.about}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
