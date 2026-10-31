import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";

import { ConfirmDialog } from "../../components/ConfirmDialog";
import { founderApi } from "../../services/founderApi";
import type { Founder, FounderPayload } from "../../types";
import { PageTitle } from "./PageTitle";

const emptyDraft: FounderPayload = {
  name: "",
  designation: "",
  about: "",
  sort_order: 0,
};

function errorMessage(error: unknown, fallback: string) {
  const detail = isAxiosError<{ detail?: unknown }>(error)
    ? error.response?.data?.detail
    : undefined;
  return typeof detail === "string" ? detail : fallback;
}

export function FoundersManager() {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  // null = form closed, 0 = adding a new founder, otherwise the id being edited.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<FounderPayload>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Founder | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    founderApi
      .list()
      .then(setFounders)
      .catch(() => toast.error("Unable to load founders"))
      .finally(() => setLoading(false));
  }, []);

  const startAdd = () => {
    setEditingId(0);
    setDraft({ ...emptyDraft, sort_order: founders.length + 1 });
  };

  const startEdit = (founder: Founder) => {
    setEditingId(founder.id);
    setDraft({
      name: founder.name,
      designation: founder.designation,
      about: founder.about ?? "",
      sort_order: founder.sort_order,
    });
  };

  const closeForm = () => {
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const sortList = (list: Founder[]) =>
        [...list].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
      if (editingId) {
        const updated = await founderApi.update(editingId, draft);
        setFounders((previous) =>
          sortList(previous.map((item) => (item.id === updated.id ? updated : item))),
        );
        toast.success("Founder updated");
      } else {
        const created = await founderApi.create(draft);
        setFounders((previous) => sortList([...previous, created]));
        toast.success("Founder added");
      }
      closeForm();
    } catch (error) {
      toast.error(errorMessage(error, "Unable to save founder"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await founderApi.remove(pendingDelete.id);
      setFounders((previous) => previous.filter((item) => item.id !== pendingDelete.id));
      if (editingId === pendingDelete.id) closeForm();
      toast.success("Founder deleted");
      setPendingDelete(null);
    } catch (error) {
      toast.error(errorMessage(error, "Unable to delete founder"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 border-t border-slate-200 pt-6">
      <PageTitle
        title="Founders (Contact Page)"
        action={
          <button className="btn-primary" onClick={startAdd} type="button">
            <Plus className="h-4 w-4" /> Add Founder
          </button>
        }
      />

      {editingId !== null && (
        <form
          className="grid gap-4 rounded-md border border-brand-200 bg-brand-50/40 p-4 shadow-sm md:grid-cols-[1fr_1fr_120px]"
          onSubmit={save}
        >
          <label className="label">
            Name
            <input
              className="field mt-1"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              required
              maxLength={120}
            />
          </label>
          <label className="label">
            Designation
            <input
              className="field mt-1"
              value={draft.designation}
              onChange={(event) =>
                setDraft({ ...draft, designation: event.target.value })
              }
              placeholder="Architect of MK-BILLERS"
              required
              maxLength={160}
            />
          </label>
          <label className="label">
            Order
            <input
              className="field mt-1"
              type="number"
              value={draft.sort_order}
              onChange={(event) =>
                setDraft({ ...draft, sort_order: Number(event.target.value) || 0 })
              }
            />
          </label>
          <label className="label md:col-span-3">
            About (optional)
            <textarea
              className="field mt-1"
              rows={2}
              value={draft.about ?? ""}
              onChange={(event) => setDraft({ ...draft, about: event.target.value })}
              maxLength={500}
            />
          </label>
          <div className="flex gap-2 md:col-span-3">
            <button className="btn-primary" disabled={saving} type="submit">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : editingId ? "Update Founder" : "Add Founder"}
            </button>
            <button className="btn-secondary" onClick={closeForm} type="button">
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-4 py-3 text-slate-500" colSpan={4}>
                  Loading founders...
                </td>
              </tr>
            )}
            {!loading && founders.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-slate-500" colSpan={4}>
                  No founders yet. Add one to show it on the Contact page.
                </td>
              </tr>
            )}
            {founders.map((founder) => (
              <tr className="border-b border-slate-100" key={founder.id}>
                <td className="px-4 py-3">{founder.sort_order}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{founder.name}</td>
                <td className="px-4 py-3 text-slate-600">{founder.designation}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn-secondary"
                      onClick={() => startEdit(founder)}
                      type="button"
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                    <button
                      className="btn-secondary border-red-200 text-red-700"
                      onClick={() => setPendingDelete(founder)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete founder"
        message={`Remove ${pendingDelete?.name ?? "this founder"} from the Contact page?`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
