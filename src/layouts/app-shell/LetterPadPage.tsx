import { useEffect, useMemo, useState } from "react";
import { FilePlus2, Printer, Save, Search, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { customerApi } from "../../services/customerApi";
import { letterApi } from "../../services/letterApi";
import type { Customer, LetterPad, LetterPadPayload, LetterType } from "../../types";
import { getRestrictedActionMessage, isInactiveAdmin } from "../../utils/permissions";
import { PageTitle } from "./PageTitle";

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
  const restricted = isInactiveAdmin();

  useEffect(() => {
    Promise.all([letterApi.list(), customerApi.list()])
      .then(([lettersData, customersData]) => {
        setLetters(lettersData);
        setCustomers(customersData);
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
    () => customers.find((customer) => customer.id === (draft.customer_id ?? -1)) ?? null,
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
          draft.quotation_amount === null || Number.isNaN(draft.quotation_amount)
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
      setLetters((previous) => previous.filter((item) => item.id !== selectedId));
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
              <button className="btn-secondary" onClick={printLetter} type="button">
                <Printer className="h-4 w-4" /> Print Letter
              </button>
              <button className="btn-primary" disabled={saving} onClick={save} type="button">
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
              </button>
              <button
                className="btn-secondary border-red-200 text-red-700"
                disabled={!selectedId || deleting}
                onClick={remove}
                type="button"
              >
                <Trash2 className="h-4 w-4" /> {deleting ? "Deleting..." : "Delete"}
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
            {loading && <p className="text-sm text-slate-500">Loading letters...</p>}
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
                <p className="truncate text-sm font-semibold text-slate-800">{letter.title}</p>
                <p className="truncate text-xs text-slate-500">{letter.customer?.name ?? "No customer"}</p>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-4">
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
                    customer_id: event.target.value ? Number(event.target.value) : null,
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
                  setDraft((previous) => ({ ...previous, title: event.target.value }))
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
                  setDraft((previous) => ({ ...previous, subject: event.target.value }))
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
                  setDraft((previous) => ({ ...previous, valid_until: event.target.value }))
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
                  setDraft((previous) => ({ ...previous, content: event.target.value }))
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
                  setDraft((previous) => ({ ...previous, footer_text: event.target.value }))
                }
              />
            </label>
          </form>

          <article className="invoice-print rounded-md border border-slate-200 bg-white p-8 shadow-soft">
            <p className="text-xs uppercase tracking-wide text-slate-500">{draft.letter_type}</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">{draft.title || "Untitled Letter"}</h2>

            <div className="mt-6 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p>
                <span className="font-medium text-slate-800">Customer:</span>{" "}
                {selectedCustomer?.name ?? selectedLetter?.customer?.name ?? "N/A"}
              </p>
              <p>
                <span className="font-medium text-slate-800">Date:</span>{" "}
                {new Date().toLocaleDateString()}
              </p>
              {!!draft.valid_until && (
                <p>
                  <span className="font-medium text-slate-800">Valid Until:</span> {draft.valid_until}
                </p>
              )}
              {draft.quotation_amount !== null && draft.quotation_amount !== undefined && (
                <p>
                  <span className="font-medium text-slate-800">Quoted Amount:</span> Rs. {draft.quotation_amount.toFixed(2)}
                </p>
              )}
            </div>

            {!!draft.subject?.trim() && (
              <p className="mt-6 text-base font-medium text-slate-900">Subject: {draft.subject}</p>
            )}

            <div className="mt-5 whitespace-pre-line text-[15px] leading-7 text-slate-700">
              {draft.content || "Letter content preview"}
            </div>

            {!!draft.footer_text?.trim() && (
              <p className="mt-10 whitespace-pre-line text-sm text-slate-600">{draft.footer_text}</p>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
