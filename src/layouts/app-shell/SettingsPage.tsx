import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Settings } from "lucide-react";
import { toast } from "react-toastify";

import { authApi } from "../../services/authApi";
import { settingsApi } from "../../services/settingsApi";
import type { InvoiceSettings, InvoiceTemplateId } from "../../types";
import {
  getRestrictedActionMessage,
  isInactiveAdmin,
} from "../../utils/permissions";
import { PageTitle } from "./PageTitle";
import {
  defaultSettings,
  getStoredInvoiceTemplate,
  INVOICE_TEMPLATE_OPTIONS,
  TEMPLATE_STORAGE_KEY,
} from "./shared";

export function SettingsPage() {
  const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings);
  const [signatureMode, setSignatureMode] = useState<"text" | "image">("text");
  const [saving, setSaving] = useState(false);
  const settingsRestricted = isInactiveAdmin();
  useEffect(() => {
    const defaultTemplate = getStoredInvoiceTemplate();
    settingsApi
      .invoice()
      .then((serverSettings) => {
        const template = INVOICE_TEMPLATE_OPTIONS.some(
          (option) => option.id === serverSettings.invoice_template,
        )
          ? (serverSettings.invoice_template as InvoiceTemplateId)
          : defaultTemplate;
        localStorage.setItem(TEMPLATE_STORAGE_KEY, template);
        setSignatureMode(
          serverSettings.signature?.startsWith("data:image/")
            ? "image"
            : "text",
        );
        setSettings({
          ...defaultSettings,
          ...serverSettings,
          invoice_template: template,
        });
      })
      .catch(() => toast.error("Unable to load settings"));
  }, []);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (settingsRestricted) {
      toast.error(getRestrictedActionMessage("save-settings"));
      return;
    }
    setSaving(true);
    try {
      const updated = await settingsApi.updateInvoice(settings);
      const freshUser = await authApi.me();
      localStorage.setItem("MKbillers_user", JSON.stringify(freshUser));
      const template = INVOICE_TEMPLATE_OPTIONS.some(
        (option) => option.id === settings.invoice_template,
      )
        ? (settings.invoice_template as InvoiceTemplateId)
        : getStoredInvoiceTemplate();
      localStorage.setItem(TEMPLATE_STORAGE_KEY, template);
      setSettings({
        ...defaultSettings,
        ...updated,
        invoice_template: template,
      });
      toast.success("Invoice settings updated successfully");
    } catch {
      toast.error("Unable to save invoice settings");
    } finally {
      setSaving(false);
    }
  };
  return (
    <form
      className="max-w-4xl space-y-5 rounded-md border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={save}
    >
      <PageTitle
        title="Invoice Settings"
        action={
          <button className="btn-primary" disabled={saving}>
            <Settings className="h-4 w-4" /> {saving ? "Submitting..." : "Save Settings"}
          </button>
        }
      />
      <label className="label md:col-span-2">
        Default Invoice Template
        <select
          className="field mt-1"
          value={settings.invoice_template ?? "template-1"}
          onChange={(event) =>
            setSettings({
              ...settings,
              invoice_template: event.target.value as InvoiceTemplateId,
            })
          }
        >
          {INVOICE_TEMPLATE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        {Object.keys(defaultSettings)
          .filter((key) => key !== "invoice_template")
          .map((key) => (
            <label
              className={`label ${["address", "bank_details", "footer_text"].includes(key) ? "md:col-span-2" : ""}`}
              key={key}
            >
              {key
                .replace("_", " ")
                .replace(/\b\w/g, (char) => char.toUpperCase())}
              {key === "signature" ? (
                <div className="mt-1 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <select
                    className="field bg-white"
                    value={signatureMode}
                    onChange={(event) => {
                      const mode = event.target.value as "text" | "image";
                      setSignatureMode(mode);
                      setSettings({ ...settings, signature: "" });
                    }}
                  >
                    <option value="text">Text signature</option>
                    <option value="image">Signature image</option>
                  </select>
                  {signatureMode === "image" ? (
                    <input
                      className="field bg-white"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          toast.error(
                            "Signature image must be smaller than 2 MB",
                          );
                          event.target.value = "";
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === "string")
                            setSettings({
                              ...settings,
                              signature: reader.result,
                            });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  ) : (
                    <input
                      className="field bg-white"
                      placeholder="Authorized Signature"
                      value={settings.signature ?? ""}
                      onChange={(event) =>
                        setSettings({
                          ...settings,
                          signature: event.target.value,
                        })
                      }
                    />
                  )}
                  {settings.signature?.startsWith("data:image/") && (
                    <img
                      className="max-h-20 max-w-52 object-contain rounded-md border border-slate-200 bg-white p-2"
                      src={settings.signature}
                      alt="Signature preview"
                    />
                  )}
                </div>
              ) : key === "logo" ? (
                <div className="mt-1 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <input
                    className="field bg-white"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error("Logo image must be smaller than 2 MB");
                        event.target.value = "";
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === "string") {
                          setSettings({ ...settings, logo: reader.result });
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <p className="text-xs text-slate-500">
                    Upload logo to show near company name in printed invoice.
                  </p>
                  {settings.logo && (
                    <div className="space-y-2">
                      <img
                        className="max-h-20 max-w-52 object-contain rounded-md border border-slate-200 bg-white p-2"
                        src={settings.logo}
                        alt="Logo preview"
                      />
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => setSettings({ ...settings, logo: "" })}
                      >
                        Remove logo
                      </button>
                    </div>
                  )}
                </div>
              ) : ["address", "bank_details", "footer_text"].includes(key) ? (
                <textarea
                  className="field mt-1 min-h-24"
                  value={String(settings[key as keyof InvoiceSettings] ?? "")}
                  onChange={(event) =>
                    setSettings({ ...settings, [key]: event.target.value })
                  }
                />
              ) : (
                <input
                  className="field mt-1"
                  value={String(settings[key as keyof InvoiceSettings] ?? "")}
                  onChange={(event) =>
                    setSettings({ ...settings, [key]: event.target.value })
                  }
                  required={key === "company_name" || key === "invoice_prefix"}
                />
              )}
            </label>
          ))}
      </div>
    </form>
  );
}
