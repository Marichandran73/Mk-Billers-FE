import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  FilePlus2,
  Loader2,
  Printer,
  ReceiptIndianRupee,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

import { customerApi } from "../../services/customerApi";
import { letterApi } from "../../services/letterApi";
import { settingsApi } from "../../services/settingsApi";
import type {
  Customer,
  InvoiceSettings,
  LetterPad,
  LetterPadPayload,
  LetterType,
} from "../../types";
import {
  getRestrictedActionMessage,
  isInactiveAdmin,
} from "../../utils/permissions";
import { PageTitle } from "./PageTitle";
import { defaultSettings } from "./shared";

const emptyDraft: LetterPadPayload = {
  customer_id: null,
  letter_type: "QUOTATION",
  title: "",
  subject: "",
  content: "",
  quotation_amount: null,
  valid_until: "",
  footer_text: "",
};

type LetterTheme =
  "classic" | "centered" | "banner" | "modern" | "elegant" | "minimal";

const LETTER_THEME_OPTIONS: { id: LetterTheme; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "centered", label: "Centered" },
  { id: "banner", label: "Banner" },
  { id: "modern", label: "Modern" },
  { id: "elegant", label: "Elegant" },
  { id: "minimal", label: "Minimal" },
];

const LETTER_THEMES: Record<
  LetterTheme,
  { swatch: string; accentText: string; font: string }
> = {
  classic: { swatch: "bg-brand-600", accentText: "text-brand-700", font: "" },
  centered: { swatch: "bg-slate-800", accentText: "text-slate-600", font: "" },
  banner: { swatch: "bg-brand-600", accentText: "text-brand-700", font: "" },
  modern: { swatch: "bg-teal-500", accentText: "text-teal-700", font: "" },
  elegant: {
    swatch: "bg-amber-600",
    accentText: "text-amber-700",
    font: "font-serif",
  },
  minimal: { swatch: "bg-slate-300", accentText: "text-slate-500", font: "" },
};

const LETTER_THEME_STORAGE_KEY = "fe_bills_letter_theme";

function getStoredLetterTheme(): LetterTheme {
  const raw = localStorage.getItem(LETTER_THEME_STORAGE_KEY);
  return LETTER_THEME_OPTIONS.some((option) => option.id === raw)
    ? (raw as LetterTheme)
    : "classic";
}

function LetterHead({
  settings,
  theme,
}: {
  settings: InvoiceSettings;
  theme: LetterTheme;
}) {
  const contacts = [
    settings.gst_number && `GST: ${settings.gst_number}`,
    settings.phone && `Phone: ${settings.phone}`,
    settings.email && `Email: ${settings.email}`,
  ].filter(Boolean) as string[];

  const logo = (boxClass: string) =>
    settings.logo ? (
      <img
        className="h-16 w-16 shrink-0 rounded-md object-contain"
        src={settings.logo}
        alt="Company logo"
      />
    ) : (
      <div
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-md ${boxClass}`}
      >
        <ReceiptIndianRupee />
      </div>
    );

  if (theme === "centered") {
    return (
      <header className="mx-8 border-b-4 border-double border-slate-800 pb-5 pt-8 text-center sm:mx-10 sm:pt-10">
        <div className="flex justify-center">
          {logo("bg-slate-800 text-white")}
        </div>
        <h1 className="mt-3 text-3xl font-bold uppercase tracking-wide text-slate-900">
          {settings.company_name}
        </h1>
        {!!settings.address && (
          <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
            {settings.address}
          </p>
        )}
        {contacts.length > 0 && (
          <p className="mt-1 text-sm text-slate-600">
            {contacts.join("  |  ")}
          </p>
        )}
      </header>
    );
  }

  if (theme === "banner") {
    return (
      <header className="flex flex-col gap-4 bg-brand-600 px-8 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div className="flex min-w-0 items-center gap-4">
          {logo("bg-white text-brand-600")}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{settings.company_name}</h1>
            {!!settings.address && (
              <p className="whitespace-pre-line text-sm text-white/85">
                {settings.address}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-0.5 text-sm text-white/90 sm:text-right">
          {contacts.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </header>
    );
  }

  if (theme === "modern") {
    return (
      <header className="border-b-4 border-teal-500 bg-slate-900 px-8 py-6 text-white sm:px-10">
        <div className="flex items-center gap-4">
          {logo("bg-teal-500 text-white")}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">
              {settings.company_name}
            </h1>
            {!!settings.address && (
              <p className="whitespace-pre-line text-sm text-slate-300">
                {settings.address}
              </p>
            )}
          </div>
        </div>
        {contacts.length > 0 && (
          <p className="mt-3 text-sm text-teal-300">{contacts.join("  •  ")}</p>
        )}
      </header>
    );
  }

  if (theme === "elegant") {
    return (
      <header className="mx-8 pt-8 text-center sm:mx-10 sm:pt-10">
        <h1 className="text-3xl font-semibold italic text-amber-800">
          {settings.company_name}
        </h1>
        <div className="mx-auto mt-2 h-px w-40 bg-amber-600" />
        {!!settings.address && (
          <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
            {settings.address}
          </p>
        )}
        {contacts.length > 0 && (
          <p className="mt-1 text-sm text-slate-600">
            {contacts.join("  ·  ")}
          </p>
        )}
        <div className="mt-5 h-0.5 bg-amber-600" />
      </header>
    );
  }

  if (theme === "minimal") {
    return (
      <header className="mx-8 flex flex-col gap-2 border-b border-slate-200 pb-4 pt-8 sm:mx-10 sm:flex-row sm:items-end sm:justify-between sm:pt-10">
        <div>
          <h1 className="text-xl font-semibold uppercase tracking-[0.2em] text-slate-800">
            {settings.company_name}
          </h1>
          {!!settings.address && (
            <p className="whitespace-pre-line text-xs text-slate-500">
              {settings.address}
            </p>
          )}
        </div>
        <div className="text-xs text-slate-500 sm:text-right">
          {contacts.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </header>
    );
  }

  return (
    <header className="mx-8 flex flex-col gap-4 border-b-2 border-brand-600 pb-5 pt-8 sm:mx-10 sm:flex-row sm:items-center sm:justify-between sm:pt-10">
      <div className="flex min-w-0 items-center gap-4">
        {logo("bg-brand-600 text-white")}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900">
            {settings.company_name}
          </h1>
          {!!settings.address && (
            <p className="whitespace-pre-line text-sm text-slate-600">
              {settings.address}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-0.5 text-sm text-slate-600 sm:text-right">
        {contacts.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </header>
  );
}

function toPayload(letter: LetterPad): LetterPadPayload {
  return {
    customer_id: letter.customer_id ?? null,
    letter_type: letter.letter_type,
    title: letter.title,
    subject: letter.subject ?? "",
    content: letter.content,
    quotation_amount: letter.quotation_amount ?? null,
    valid_until: letter.valid_until ?? "",
    footer_text: letter.footer_text ?? "",
  };
}

export function LetterPadPage() {
  const [letters, setLetters] = useState<LetterPad[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<LetterPadPayload>(emptyDraft);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings);
  const [theme, setTheme] = useState<LetterTheme>(getStoredLetterTheme);
  const letterRef = useRef<HTMLElement>(null);
  const restricted = isInactiveAdmin();
  const themeStyle = LETTER_THEMES[theme];

  const changeTheme = (value: LetterTheme) => {
    setTheme(value);
    localStorage.setItem(LETTER_THEME_STORAGE_KEY, value);
  };

  useEffect(() => {
    Promise.all([
      letterApi.list(),
      customerApi.list(),
      settingsApi.invoice().catch(() => defaultSettings),
    ])
      .then(([lettersData, customersData, settingsData]) => {
        setLetters(lettersData);
        setCustomers(customersData);
        setSettings({ ...defaultSettings, ...settingsData });
      })
      .catch(() => toast.error("Unable to load letter pad data"))
      .finally(() => setLoading(false));
  }, []);

  const filteredLetters = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return letters;
    return letters.filter((letter) => {
      const customerName = letter.customer?.name ?? "";
      return (
        letter.title.toLowerCase().includes(term) ||
        (letter.subject ?? "").toLowerCase().includes(term) ||
        customerName.toLowerCase().includes(term)
      );
    });
  }, [letters, search]);

  const selectedLetter = useMemo(
    () => letters.find((letter) => letter.id === selectedId) ?? null,
    [letters, selectedId],
  );

  const selectedCustomer = useMemo(
    () =>
      customers.find((customer) => customer.id === (draft.customer_id ?? -1)) ??
      null,
    [customers, draft.customer_id],
  );

  const onSelectLetter = (letter: LetterPad) => {
    setSelectedId(letter.id);
    setDraft(toPayload(letter));
  };

  const onNew = () => {
    setSelectedId(null);
    setDraft(emptyDraft);
  };

  const save = async () => {
    if (restricted) {
      toast.error(getRestrictedActionMessage("save-settings"));
      return;
    }
    if (!draft.title.trim() || !draft.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSaving(true);
    try {
      const payload: LetterPadPayload = {
        ...draft,
        title: draft.title.trim(),
        content: draft.content.trim(),
        subject: draft.subject?.trim() ?? "",
        footer_text: draft.footer_text?.trim() ?? "",
        valid_until: draft.valid_until || undefined,
        quotation_amount:
          draft.quotation_amount === null ||
          Number.isNaN(draft.quotation_amount)
            ? null
            : Number(draft.quotation_amount),
      };

      if (selectedId) {
        const updated = await letterApi.update(selectedId, payload);
        setLetters((previous) =>
          previous.map((item) => (item.id === updated.id ? updated : item)),
        );
        setDraft(toPayload(updated));
        toast.success("Letter updated");
        return;
      }

      const created = await letterApi.create(payload);
      setLetters((previous) => [created, ...previous]);
      setSelectedId(created.id);
      setDraft(toPayload(created));
      toast.success("Letter created");
    } catch {
      toast.error("Unable to save letter");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selectedId) return;
    if (restricted) {
      toast.error(getRestrictedActionMessage("save-settings"));
      return;
    }
    setDeleting(true);
    try {
      await letterApi.remove(selectedId);
      setLetters((previous) =>
        previous.filter((item) => item.id !== selectedId),
      );
      setSelectedId(null);
      setDraft(emptyDraft);
      toast.success("Letter deleted");
    } catch {
      toast.error("Unable to delete letter");
    } finally {
      setDeleting(false);
    }
  };

  const printLetter = () => {
    window.print();
  };

  const downloadPdf = async () => {
    if (!letterRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(letterRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imageHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imageHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imageHeight);
        heightLeft -= pageHeight;
      }

      const fileName = (draft.title.trim() || "letter").replace(
        /[^\w-]+/g,
        "_",
      );
      pdf.save(`${fileName}.pdf`);
    } catch {
      toast.error("Failed PDF generation");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="no-print">
        <PageTitle
          title="Letter Pad"
          action={
            <div className="flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={onNew} type="button">
                <FilePlus2 className="h-4 w-4" /> New Letter
              </button>
              <button
                className="btn-secondary"
                onClick={printLetter}
                type="button"
              >
                <Printer className="h-4 w-4" /> Print Letter
              </button>
              <button
                className="btn-secondary"
                disabled={downloading}
                onClick={downloadPdf}
                type="button"
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Download PDF
                  </>
                )}
              </button>
              <button
                className="btn-primary"
                disabled={saving}
                onClick={save}
                type="button"
              >
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
              </button>
              <button
                className="btn-secondary border-red-200 text-red-700"
                disabled={!selectedId || deleting}
                onClick={remove}
                type="button"
              >
                <Trash2 className="h-4 w-4" />{" "}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[330px_1fr]">
        <aside className="no-print rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <label className="label">
            Search Letters
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                className="field pl-9"
                placeholder="Search by title or customer"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </label>

          <div className="mt-4 max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            {loading && (
              <p className="text-sm text-slate-500">Loading letters...</p>
            )}
            {!loading && filteredLetters.length === 0 && (
              <p className="text-sm text-slate-500">No letters found</p>
            )}
            {filteredLetters.map((letter) => (
              <button
                className={`w-full rounded-md border px-3 py-2 text-left ${
                  selectedId === letter.id
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 bg-white"
                }`}
                key={letter.id}
                onClick={() => onSelectLetter(letter)}
                type="button"
              >
                <p className="truncate text-sm font-semibold text-slate-800">
                  {letter.title}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {letter.customer?.name ?? "No customer"}
                </p>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="no-print rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <p className="label">Letterhead Theme</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {LETTER_THEME_OPTIONS.map((option) => (
                <button
                  className={`rounded-md border p-2 text-left text-xs font-medium ${
                    theme === option.id
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                  key={option.id}
                  onClick={() => changeTheme(option.id)}
                  type="button"
                >
                  <span
                    className={`mb-1.5 block h-2 rounded-full ${LETTER_THEMES[option.id].swatch}`}
                  />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <form
            className="no-print grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <label className="label">
              Letter Type
              <select
                className="field mt-1"
                value={draft.letter_type}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    letter_type: event.target.value as LetterType,
                  }))
                }
              >
                <option value="QUOTATION">Quotation</option>
                <option value="LETTER">Letter</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </label>

            <label className="label">
              Customer
              <select
                className="field mt-1"
                value={draft.customer_id ?? ""}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    customer_id: event.target.value
                      ? Number(event.target.value)
                      : null,
                  }))
                }
              >
                <option value="">Select customer (optional)</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="label md:col-span-2">
              Title
              <input
                className="field mt-1"
                placeholder="Quotation for interior supplies"
                value={draft.title}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    title: event.target.value,
                  }))
                }
              />
            </label>

            <label className="label md:col-span-2">
              Subject
              <input
                className="field mt-1"
                placeholder="Subject line"
                value={draft.subject ?? ""}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    subject: event.target.value,
                  }))
                }
              />
            </label>

            <label className="label">
              Quotation Amount
              <input
                className="field mt-1"
                type="number"
                min={0}
                step="0.01"
                value={draft.quotation_amount ?? ""}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    quotation_amount: event.target.value
                      ? Number(event.target.value)
                      : null,
                  }))
                }
              />
            </label>

            <label className="label">
              Valid Until
              <input
                className="field mt-1"
                type="date"
                value={draft.valid_until ?? ""}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    valid_until: event.target.value,
                  }))
                }
              />
            </label>

            <label className="label md:col-span-2">
              Letter Content
              <textarea
                className="field mt-1 min-h-40"
                placeholder="Write your quotation/letter text here..."
                value={draft.content}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    content: event.target.value,
                  }))
                }
              />
            </label>

            <label className="label md:col-span-2">
              Footer Text
              <textarea
                className="field mt-1 min-h-24"
                placeholder="Regards,\nMK Billers Team"
                value={draft.footer_text ?? ""}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    footer_text: event.target.value,
                  }))
                }
              />
            </label>
          </form>

          <article
            className={`invoice-print overflow-hidden rounded-md border border-slate-200 bg-white shadow-soft ${themeStyle.font}`}
            ref={letterRef}
          >
            <LetterHead settings={settings} theme={theme} />

            <div className="px-8 pb-8 pt-6 sm:px-10 sm:pb-10">
              <p
                className={`text-xs font-semibold uppercase tracking-wide ${themeStyle.accentText}`}
              >
                {draft.letter_type}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                {draft.title || "Untitled Letter"}
              </h2>

              <div className="mt-6 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <p>
                  <span className="font-medium text-slate-800">Customer:</span>{" "}
                  {selectedCustomer?.name ??
                    selectedLetter?.customer?.name ??
                    "N/A"}
                </p>
                <p>
                  <span className="font-medium text-slate-800">Date:</span>{" "}
                  {new Date().toLocaleDateString()}
                </p>
                {!!draft.valid_until && (
                  <p>
                    <span className="font-medium text-slate-800">
                      Valid Until:
                    </span>{" "}
                    {draft.valid_until}
                  </p>
                )}
                {draft.quotation_amount !== null &&
                  draft.quotation_amount !== undefined && (
                    <p>
                      <span className="font-medium text-slate-800">
                        Quoted Amount:
                      </span>{" "}
                      Rs. {draft.quotation_amount.toFixed(2)}
                    </p>
                  )}
              </div>

              {!!draft.subject?.trim() && (
                <p className="mt-6 text-base font-medium text-slate-900">
                  Subject: {draft.subject}
                </p>
              )}

              <div className="mt-5 whitespace-pre-line text-[15px] leading-7 text-slate-700">
                {draft.content || "Letter content preview"}
              </div>

              {!!draft.footer_text?.trim() && (
                <p className="mt-10 whitespace-pre-line text-sm text-slate-600">
                  {draft.footer_text}
                </p>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
