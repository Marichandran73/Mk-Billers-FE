import { useEffect, useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";

import { authApi } from "../services/authApi";
import type { EmailTemplate, EmailTemplateId } from "../types";
import { EMAIL_TEMPLATE_STORAGE_KEY } from "../utils/emailTemplates";

type EmailTemplatePickerProps = {
  purpose: "invite" | "company";
  value: EmailTemplateId;
  onChange: (value: EmailTemplateId) => void;
};

export function EmailTemplatePicker({
  purpose,
  value,
  onChange,
}: EmailTemplatePickerProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .emailTemplates(purpose)
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, [purpose]);

  const select = (id: EmailTemplateId) => {
    onChange(id);
    localStorage.setItem(EMAIL_TEMPLATE_STORAGE_KEY, id);
  };

  const selected = templates.find((template) => template.id === value);

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Mail className="h-4 w-4" /> Email Template
      </p>
      {loading && <p className="text-sm text-slate-500">Loading templates...</p>}
      {!loading && templates.length === 0 && (
        <p className="text-sm text-slate-500">
          Templates unavailable. The default template will be used.
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {templates.map((template) => (
          <button
            className={`relative rounded-md border p-3 text-left transition ${
              value === template.id
                ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
            key={template.id}
            onClick={() => select(template.id)}
            type="button"
          >
            {value === template.id && (
              <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-brand-600" />
            )}
            <p className="text-sm font-semibold text-slate-800">{template.name}</p>
            <p className="mt-1 text-xs text-slate-500">{template.description}</p>
          </button>
        ))}
      </div>
      {selected && (
        <div className="overflow-hidden rounded-md border border-slate-200">
          <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
            Preview: {selected.name}
          </p>
          <iframe
            className="h-[460px] w-full bg-white"
            sandbox=""
            srcDoc={selected.preview_html}
            title={`${selected.name} email preview`}
          />
        </div>
      )}
    </div>
  );
}
