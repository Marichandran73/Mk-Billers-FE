import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ChangeEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { ArrowLeft, Save, Undo2, Upload } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import { settingsApi } from "../../services/settingsApi";
import type {
  InvoiceFieldAlign,
  InvoiceImageFit,
  UserInvoiceTemplate,
  UserInvoiceTemplateField,
  UserInvoiceTemplateImage,
} from "../../types";
import { PageTitle } from "./PageTitle";
import {
  defaultUserCustomTemplate,
  normalizeUserCustomTemplate,
} from "./shared";

const MIN_FONT = 8;
const MAX_FONT = 48;
const MIN_ZOOM = 20;
const MAX_ZOOM = 400;
const FONT_FAMILY_OPTIONS = [
  "Poppins, sans-serif",
  "Merriweather, serif",
  "Montserrat, sans-serif",
  "Lora, serif",
  "JetBrains Mono, monospace",
  "Nunito Sans, sans-serif",
];

const CUSTOM_FIELD_LIBRARY: { key: string; label: string }[] = [
  { key: "items_table", label: "Items Table (S.No, Description, Qty, Rate, Amount)" },
  { key: "invoice_title", label: "Invoice Title" },
  { key: "invoice_prefix", label: "Invoice Prefix" },
  { key: "invoice_number_with_prefix", label: "Invoice Number With Prefix" },
  { key: "invoice_number", label: "Invoice Number" },
  { key: "invoice_date", label: "Invoice Date" },
  { key: "due_date", label: "Due Date" },
  { key: "company_name", label: "Company Name" },
  { key: "company_address", label: "Company Address" },
  { key: "company_phone", label: "Company Phone" },
  { key: "company_email", label: "Company Email" },
  { key: "company_gst", label: "Company GST" },
  { key: "logo", label: "Company Logo" },
  { key: "bill_to", label: "Bill To" },
  { key: "customer_name", label: "Customer Name" },
  { key: "customer_address", label: "Customer Address" },
  { key: "customer_phone", label: "Customer Phone" },
  { key: "customer_email", label: "Customer Email" },
  { key: "customer_gst", label: "Customer GST" },
  { key: "subtotal", label: "Subtotal" },
  { key: "cgst", label: "CGST" },
  { key: "sgst", label: "SGST" },
  { key: "transportation", label: "Transportation" },
  { key: "discount", label: "Discount" },
  { key: "total_label", label: "Grand Total Label" },
  { key: "grand_total", label: "Grand Total Amount" },
  { key: "amount_words", label: "Amount In Words" },
  { key: "upi_id", label: "UPI ID" },
  { key: "bank_details", label: "Bank Details" },
  { key: "notes", label: "Notes" },
  { key: "footer_text", label: "Footer Text" },
  { key: "signature", label: "Signature" },
];

type DragState = {
  kind: "field" | "image";
  id: string;
  offsetX: number;
  offsetY: number;
  pointerId: number;
};

function getFieldPreviewHeight(fieldKey: string): number {
  if (fieldKey === "items_table") return 170;
  return 28;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeImage(image: UserInvoiceTemplateImage): UserInvoiceTemplateImage {
  return {
    ...image,
    fit: image.fit ?? "contain",
    crop_x: clamp(image.crop_x ?? 50, 0, 100),
    crop_y: clamp(image.crop_y ?? 50, 0, 100),
    zoom: clamp(image.zoom ?? 100, MIN_ZOOM, MAX_ZOOM),
    opacity: clamp(image.opacity ?? 1, 0.1, 1),
    rotation: clamp(image.rotation ?? 0, -180, 180),
  };
}

function cloneTemplate(template: UserInvoiceTemplate): UserInvoiceTemplate {
  return normalizeUserCustomTemplate(template);
}

function normalizeTemplate(template: UserInvoiceTemplate | null): UserInvoiceTemplate {
  return normalizeUserCustomTemplate(template);
}

export function CustomTemplatePage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState<UserInvoiceTemplate>(() =>
    cloneTemplate(defaultUserCustomTemplate),
  );
  const [activeFieldKey, setActiveFieldKey] = useState<string>(
    defaultUserCustomTemplate.fields[0]?.key ?? "",
  );
  const [activeImageId, setActiveImageId] = useState<string>("");
  const [newFieldKey, setNewFieldKey] = useState<string>(
    CUSTOM_FIELD_LIBRARY[0]?.key ?? "",
  );
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const activeField = useMemo(
    () => template.fields.find((field) => field.key === activeFieldKey) ?? null,
    [template.fields, activeFieldKey],
  );
  const activeImage = useMemo(
    () => template.images.find((image) => image.id === activeImageId) ?? null,
    [template.images, activeImageId],
  );
  const usedFieldKeys = useMemo(
    () => new Set(template.fields.map((field) => field.key)),
    [template.fields],
  );

  const fieldLibraryOptions = useMemo(
    () =>
      CUSTOM_FIELD_LIBRARY.filter(
        (field) => !usedFieldKeys.has(field.key),
      ),
    [usedFieldKeys],
  );

  useEffect(() => {
    if (!fieldLibraryOptions.length) return;
    if (!fieldLibraryOptions.some((field) => field.key === newFieldKey)) {
      setNewFieldKey(fieldLibraryOptions[0].key);
    }
  }, [fieldLibraryOptions, newFieldKey]);

  useEffect(() => {
    settingsApi
      .customTemplate()
      .then((data) => {
        const normalized = normalizeTemplate(data);
        setTemplate(normalized);
        if (normalized.fields.length > 0) {
          setActiveFieldKey(normalized.fields[0].key);
        }
        if (normalized.images.length > 0) {
          setActiveImageId(normalized.images[0].id);
        }
      })
      .catch(() => {
        setTemplate(cloneTemplate(defaultUserCustomTemplate));
        toast.error("Unable to load custom template, using defaults");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== dragging.pointerId) return;
      if (!canvasRef.current) return;
      const bounds = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - bounds.left - dragging.offsetX;
      const y = event.clientY - bounds.top - dragging.offsetY;

      setTemplate((previous) => {
        if (dragging.kind === "field") {
          return {
            ...previous,
            fields: previous.fields.map((field) => {
              if (field.key !== dragging.id) return field;
              const maxX = previous.page_width - (field.width ?? 140);
              const fieldHeight = getFieldPreviewHeight(field.key);
              return {
                ...field,
                x: clamp(x, 0, Math.max(0, maxX)),
                y: clamp(y, 0, Math.max(0, previous.page_height - fieldHeight)),
              };
            }),
          };
        }

        return {
          ...previous,
          images: previous.images.map((image) => {
            if (image.id !== dragging.id) return image;
            const maxX = previous.page_width - image.width;
            const maxY = previous.page_height - image.height;
            return {
              ...image,
              x: clamp(x, 0, Math.max(0, maxX)),
              y: clamp(y, 0, Math.max(0, maxY)),
            };
          }),
        };
      });
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId === dragging.pointerId) {
        setDragging(null);
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [dragging]);

  const startDrag = (
    event: ReactPointerEvent,
    kind: DragState["kind"],
    id: string,
    x: number,
    y: number,
  ) => {
    if (!canvasRef.current) return;
    event.preventDefault();
    const bounds = canvasRef.current.getBoundingClientRect();
    setDragging({
      kind,
      id,
      offsetX: event.clientX - bounds.left - x,
      offsetY: event.clientY - bounds.top - y,
      pointerId: event.pointerId,
    });
  };

  const updateField = (
    key: string,
    patch: Partial<UserInvoiceTemplateField>,
  ) => {
    setTemplate((previous) => ({
      ...previous,
      fields: previous.fields.map((field) =>
        field.key === key ? { ...field, ...patch } : field,
      ),
    }));
  };

  const updateImage = (id: string, patch: Partial<UserInvoiceTemplateImage>) => {
    setTemplate((previous) => ({
      ...previous,
      images: previous.images.map((image) =>
        image.id === id ? normalizeImage({ ...image, ...patch }) : image,
      ),
    }));
  };

  const addFieldByKey = (fieldKey: string) => {
    if (!fieldKey) return;
    if (template.fields.some((field) => field.key === fieldKey)) {
      toast.info("This field already exists in template");
      return;
    }
    const libraryField = CUSTOM_FIELD_LIBRARY.find((field) => field.key === fieldKey);
    const nextY =
      template.fields.length > 0
        ? Math.min(
            template.page_height - 36,
            Math.max(...template.fields.map((field) => field.y)) + 34,
          )
        : 40;

    const newField: UserInvoiceTemplateField = {
      key: fieldKey,
      label: libraryField?.label ?? fieldKey,
      x: 40,
      y: nextY,
      font_size: fieldKey === "items_table" ? 11 : 12,
      width: fieldKey === "items_table" ? Math.max(420, template.page_width - 80) : 260,
      align: "left",
      font_family: "Poppins, sans-serif",
      font_weight: 500,
      font_style: "normal",
      text_color: "#0f172a",
      use_gradient: false,
      gradient_from: "#0f172a",
      gradient_to: "#334155",
      gradient_angle: 90,
    };

    setTemplate((previous) => ({
      ...previous,
      fields: [...previous.fields, newField],
    }));
    setActiveFieldKey(fieldKey);
  };

  const addAllMissingFields = () => {
    const missing = CUSTOM_FIELD_LIBRARY.filter(
      (field) => !template.fields.some((current) => current.key === field.key),
    );
    if (!missing.length) {
      toast.info("All available fields are already added");
      return;
    }
    let nextY =
      template.fields.length > 0
        ? Math.min(
            template.page_height - 36,
            Math.max(...template.fields.map((field) => field.y)) + 34,
          )
        : 40;

    const fieldsToAdd: UserInvoiceTemplateField[] = missing.map((field, index) => {
      const candidateY = nextY + index * 32;
      return {
        key: field.key,
        label: field.label,
        x: 40,
        y: Math.min(template.page_height - 36, candidateY),
        font_size: field.key === "items_table" ? 11 : 12,
        width:
          field.key === "items_table"
            ? Math.max(420, template.page_width - 80)
            : 260,
        align: "left",
        font_family: "Poppins, sans-serif",
        font_weight: 500,
        font_style: "normal",
        text_color: "#0f172a",
        use_gradient: false,
        gradient_from: "#0f172a",
        gradient_to: "#334155",
        gradient_angle: 90,
      };
    });

    setTemplate((previous) => ({
      ...previous,
      fields: [...previous.fields, ...fieldsToAdd],
    }));
    setActiveFieldKey(fieldsToAdd[0].key);
    toast.success(`${fieldsToAdd.length} fields added`);
  };

  const changeFieldDataSource = (currentKey: string, nextKey: string) => {
    if (currentKey === nextKey) return;
    if (template.fields.some((field) => field.key === nextKey)) {
      toast.error("This data field is already present");
      return;
    }
    const nextLabel =
      CUSTOM_FIELD_LIBRARY.find((field) => field.key === nextKey)?.label ?? nextKey;
    setTemplate((previous) => ({
      ...previous,
      fields: previous.fields.map((field) =>
        field.key === currentKey
          ? { ...field, key: nextKey, label: nextLabel }
          : field,
      ),
    }));
    setActiveFieldKey(nextKey);
  };

  const onUploadBackground = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl === "string") {
        setTemplate((previous) => ({
          ...previous,
          background_image: dataUrl,
        }));
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const onUploadImageLayer = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl === "string") {
        const imageId = `img-${Date.now()}`;
        setTemplate((previous) => ({
          ...previous,
          images: [
            ...previous.images,
            {
              id: imageId,
              data_url: dataUrl,
              x: 40,
              y: 320,
              width: 140,
              height: 90,
              fit: "contain",
              crop_x: 50,
              crop_y: 50,
              zoom: 100,
              opacity: 1,
              rotation: 0,
            },
          ],
        }));
        setActiveImageId(imageId);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const saveTemplate = async () => {
    setSaving(true);
    try {
      const payload = normalizeTemplate(template);
      await settingsApi.updateCustomTemplate(payload);
      toast.success("Custom template saved");
    } catch {
      toast.error("Unable to save custom template");
    } finally {
      setSaving(false);
    }
  };

  const resetTemplate = () => {
    const defaults = cloneTemplate(defaultUserCustomTemplate);
    setTemplate(defaults);
    setActiveFieldKey(defaults.fields[0]?.key ?? "");
    setActiveImageId(defaults.images[0]?.id ?? "");
  };

  if (loading) {
    return <section className="text-sm text-slate-600">Loading custom template...</section>;
  }

  return (
    <section className="space-y-4">
      <PageTitle
        title="Custom Invoice Template"
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => navigate("/settings")}>
              <ArrowLeft className="h-4 w-4" /> Back to Settings
            </button>
            <button className="btn-secondary" onClick={resetTemplate} type="button">
              <Undo2 className="h-4 w-4" /> Reset
            </button>
            <button className="btn-primary" onClick={saveTemplate} disabled={saving} type="button">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Template"}
            </button>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Canvas</p>
            <label className="label text-xs">
              Page Width (px)
              <input
                className="field mt-1"
                type="number"
                min={400}
                max={1600}
                value={template.page_width}
                onChange={(event) =>
                  setTemplate((previous) => ({
                    ...previous,
                    page_width: Number(event.target.value || previous.page_width),
                  }))
                }
              />
            </label>
            <label className="label text-xs">
              Page Height (px)
              <input
                className="field mt-1"
                type="number"
                min={500}
                max={2400}
                value={template.page_height}
                onChange={(event) =>
                  setTemplate((previous) => ({
                    ...previous,
                    page_height: Number(event.target.value || previous.page_height),
                  }))
                }
              />
            </label>
            <label className="label text-xs">
              Background Image
              <input
                className="field mt-1"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onUploadBackground}
              />
            </label>
            <label className="label text-xs">
              <span className="flex items-center gap-2">
                <input
                  checked={template.use_background_gradient ?? true}
                  onChange={(event) =>
                    setTemplate((previous) => ({
                      ...previous,
                      use_background_gradient: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                Use Background Gradient
              </span>
            </label>
            {template.use_background_gradient && (
              <>
                <label className="label text-xs">
                  Gradient From
                  <input
                    className="field mt-1 h-10"
                    type="color"
                    value={template.background_gradient_from ?? "#ffffff"}
                    onChange={(event) =>
                      setTemplate((previous) => ({
                        ...previous,
                        background_gradient_from: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="label text-xs">
                  Gradient To
                  <input
                    className="field mt-1 h-10"
                    type="color"
                    value={template.background_gradient_to ?? "#f8fafc"}
                    onChange={(event) =>
                      setTemplate((previous) => ({
                        ...previous,
                        background_gradient_to: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="label text-xs">
                  Gradient Angle ({Math.round(template.background_gradient_angle ?? 180)} deg)
                  <input
                    className="field mt-1"
                    type="range"
                    min={0}
                    max={360}
                    value={template.background_gradient_angle ?? 180}
                    onChange={(event) =>
                      setTemplate((previous) => ({
                        ...previous,
                        background_gradient_angle: Number(event.target.value),
                      }))
                    }
                  />
                </label>
              </>
            )}
            {template.background_image && (
              <>
                <label className="label text-xs">
                  Background Fit
                  <select
                    className="field mt-1"
                    value={template.background_fit}
                    onChange={(event) =>
                      setTemplate((previous) => ({
                        ...previous,
                        background_fit: event.target.value as InvoiceImageFit,
                      }))
                    }
                  >
                    <option value="cover">Cover</option>
                    <option value="contain">Contain</option>
                  </select>
                </label>
                <label className="label text-xs">
                  Background Focus X ({Math.round(template.background_x)}%)
                  <input
                    className="field mt-1"
                    type="range"
                    min={0}
                    max={100}
                    value={template.background_x}
                    onChange={(event) =>
                      setTemplate((previous) => ({
                        ...previous,
                        background_x: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label className="label text-xs">
                  Background Focus Y ({Math.round(template.background_y)}%)
                  <input
                    className="field mt-1"
                    type="range"
                    min={0}
                    max={100}
                    value={template.background_y}
                    onChange={(event) =>
                      setTemplate((previous) => ({
                        ...previous,
                        background_y: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label className="label text-xs">
                  Background Zoom ({Math.round(template.background_zoom)}%)
                  <input
                    className="field mt-1"
                    type="range"
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    value={template.background_zoom}
                    onChange={(event) =>
                      setTemplate((previous) => ({
                        ...previous,
                        background_zoom: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label className="label text-xs">
                  Background Opacity ({Math.round(template.background_opacity * 100)}%)
                  <input
                    className="field mt-1"
                    type="range"
                    min={10}
                    max={100}
                    value={Math.round(template.background_opacity * 100)}
                    onChange={(event) =>
                      setTemplate((previous) => ({
                        ...previous,
                        background_opacity: Number(event.target.value) / 100,
                      }))
                    }
                  />
                </label>
                <button
                  className="btn-secondary"
                  onClick={() =>
                    setTemplate((previous) => ({ ...previous, background_image: "" }))
                  }
                  type="button"
                >
                  Remove Background
                </button>
              </>
            )}
            <label className="label text-xs">
              Upload Image Layer
              <input
                className="field mt-1"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onUploadImageLayer}
              />
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Fields</p>
            <div className="rounded-md border border-slate-200 p-2">
              <p className="mb-2 text-xs font-medium text-slate-600">Add Data Fields</p>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <select
                  className="field"
                  value={newFieldKey}
                  onChange={(event) => setNewFieldKey(event.target.value)}
                  disabled={!fieldLibraryOptions.length}
                >
                  {fieldLibraryOptions.length === 0 && (
                    <option value="">All fields added</option>
                  )}
                  {fieldLibraryOptions.map((field) => (
                    <option key={field.key} value={field.key}>
                      {field.label}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-secondary"
                  onClick={() => addFieldByKey(newFieldKey)}
                  type="button"
                  disabled={!fieldLibraryOptions.length}
                >
                  Add
                </button>
              </div>
              <button
                className="btn-secondary mt-2 w-full"
                onClick={addAllMissingFields}
                type="button"
              >
                Add All Missing Fields
              </button>
            </div>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
              {template.fields.map((field) => (
                <div className="flex items-center gap-1" key={field.key}>
                  <button
                    className={`w-full rounded-md border px-2 py-1 text-left text-xs ${
                      field.key === activeFieldKey
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                    onClick={() => setActiveFieldKey(field.key)}
                    type="button"
                  >
                    {field.label} ({field.key})
                  </button>
                  <button
                    className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700"
                    onClick={() => {
                      const nextFields = template.fields.filter((item) => item.key !== field.key);
                      setTemplate((previous) => ({
                        ...previous,
                        fields: nextFields,
                      }));
                      if (activeFieldKey === field.key) {
                        setActiveFieldKey(nextFields[0]?.key ?? "");
                      }
                    }}
                    type="button"
                    title="Delete field"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Image Layers</p>
            <div className="max-h-52 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
              {template.images.length === 0 && (
                <p className="text-xs text-slate-500">No image layers yet.</p>
              )}
              {template.images.map((image, index) => (
                <button
                  className={`w-full rounded-md border px-2 py-1 text-left text-xs ${
                    image.id === activeImageId
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                  key={image.id}
                  onClick={() => setActiveImageId(image.id)}
                  type="button"
                >
                  Image {index + 1} ({Math.round(image.width)}x{Math.round(image.height)})
                </button>
              ))}
            </div>
          </div>

          {activeField && (
            <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-700">Edit Selected Field</p>
              <label className="label text-xs">
                Data Field
                <select
                  className="field mt-1"
                  value={activeField.key}
                  onChange={(event) =>
                    changeFieldDataSource(activeField.key, event.target.value)
                  }
                >
                  {(!CUSTOM_FIELD_LIBRARY.some((field) => field.key === activeField.key)) && (
                    <option value={activeField.key}>{activeField.key}</option>
                  )}
                  {CUSTOM_FIELD_LIBRARY.map((field) => (
                    <option
                      key={field.key}
                      value={field.key}
                      disabled={
                        field.key !== activeField.key &&
                        template.fields.some((item) => item.key === field.key)
                      }
                    >
                      {field.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="label text-xs">
                Label
                <input
                  className="field mt-1"
                  value={activeField.label}
                  onChange={(event) =>
                    updateField(activeField.key, { label: event.target.value })
                  }
                />
              </label>
              <label className="label text-xs">
                X
                <input
                  className="field mt-1"
                  type="number"
                  value={activeField.x}
                  onChange={(event) =>
                    updateField(activeField.key, {
                      x: Number(event.target.value || 0),
                    })
                  }
                />
              </label>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      const nextFields = template.fields.filter(
                        (field) => field.key !== activeField.key,
                      );
                      setTemplate((previous) => ({
                        ...previous,
                        fields: nextFields,
                      }));
                      setActiveFieldKey(nextFields[0]?.key ?? "");
                    }}
                    type="button"
                  >
                    Remove Selected Field
                  </button>
              <label className="label text-xs">
                Y
                <input
                  className="field mt-1"
                  type="number"
                  value={activeField.y}
                  onChange={(event) =>
                    updateField(activeField.key, {
                      y: Number(event.target.value || 0),
                    })
                  }
                />
              </label>
              <label className="label text-xs">
                Width
                <input
                  className="field mt-1"
                  type="number"
                  min={40}
                  value={activeField.width ?? 160}
                  onChange={(event) =>
                    updateField(activeField.key, {
                      width: Number(event.target.value || 160),
                    })
                  }
                />
              </label>
              <label className="label text-xs">
                Font Size
                <input
                  className="field mt-1"
                  type="number"
                  min={MIN_FONT}
                  max={MAX_FONT}
                  value={activeField.font_size}
                  onChange={(event) =>
                    updateField(activeField.key, {
                      font_size: clamp(
                        Number(event.target.value || 14),
                        MIN_FONT,
                        MAX_FONT,
                      ),
                    })
                  }
                />
              </label>
              <label className="label text-xs">
                Align
                <select
                  className="field mt-1"
                  value={activeField.align}
                  onChange={(event) =>
                    updateField(activeField.key, {
                      align: event.target.value as InvoiceFieldAlign,
                    })
                  }
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
              <label className="label text-xs">
                Font Family
                <select
                  className="field mt-1"
                  value={activeField.font_family ?? "Poppins, sans-serif"}
                  onChange={(event) =>
                    updateField(activeField.key, {
                      font_family: event.target.value,
                    })
                  }
                >
                  {FONT_FAMILY_OPTIONS.map((family) => (
                    <option key={family} value={family}>
                      {family}
                    </option>
                  ))}
                </select>
              </label>
              <label className="label text-xs">
                Font Weight
                <input
                  className="field mt-1"
                  type="range"
                  min={100}
                  max={900}
                  step={100}
                  value={activeField.font_weight ?? 500}
                  onChange={(event) =>
                    updateField(activeField.key, {
                      font_weight: Number(event.target.value),
                    })
                  }
                />
                <span className="text-[11px] text-slate-500">{activeField.font_weight ?? 500}</span>
              </label>
              <label className="label text-xs">
                Font Style
                <select
                  className="field mt-1"
                  value={activeField.font_style ?? "normal"}
                  onChange={(event) =>
                    updateField(activeField.key, {
                      font_style: event.target.value as "normal" | "italic",
                    })
                  }
                >
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                </select>
              </label>
              <label className="label text-xs">
                Text Color
                <input
                  className="field mt-1 h-10"
                  type="color"
                  value={activeField.text_color ?? "#0f172a"}
                  onChange={(event) =>
                    updateField(activeField.key, {
                      text_color: event.target.value,
                    })
                  }
                />
              </label>
              <label className="label text-xs">
                <span className="flex items-center gap-2">
                  <input
                    checked={activeField.use_gradient ?? false}
                    type="checkbox"
                    onChange={(event) =>
                      updateField(activeField.key, {
                        use_gradient: event.target.checked,
                      })
                    }
                  />
                  Use Text Gradient
                </span>
              </label>
              {(activeField.use_gradient ?? false) && (
                <>
                  <label className="label text-xs">
                    Gradient From
                    <input
                      className="field mt-1 h-10"
                      type="color"
                      value={activeField.gradient_from ?? "#0f172a"}
                      onChange={(event) =>
                        updateField(activeField.key, {
                          gradient_from: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="label text-xs">
                    Gradient To
                    <input
                      className="field mt-1 h-10"
                      type="color"
                      value={activeField.gradient_to ?? "#334155"}
                      onChange={(event) =>
                        updateField(activeField.key, {
                          gradient_to: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="label text-xs">
                    Gradient Angle ({Math.round(activeField.gradient_angle ?? 90)} deg)
                    <input
                      className="field mt-1"
                      type="range"
                      min={0}
                      max={360}
                      value={activeField.gradient_angle ?? 90}
                      onChange={(event) =>
                        updateField(activeField.key, {
                          gradient_angle: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                </>
              )}
            </div>
          )}

          {activeImage && (
            <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-700">Edit Selected Image</p>
              <label className="label text-xs">
                X
                <input
                  className="field mt-1"
                  type="number"
                  value={activeImage.x}
                  onChange={(event) =>
                    updateImage(activeImage.id, { x: Number(event.target.value || 0) })
                  }
                />
              </label>
              <label className="label text-xs">
                Y
                <input
                  className="field mt-1"
                  type="number"
                  value={activeImage.y}
                  onChange={(event) =>
                    updateImage(activeImage.id, { y: Number(event.target.value || 0) })
                  }
                />
              </label>
              <label className="label text-xs">
                Width
                <input
                  className="field mt-1"
                  type="number"
                  min={20}
                  value={activeImage.width}
                  onChange={(event) =>
                    updateImage(activeImage.id, { width: Number(event.target.value || 20) })
                  }
                />
              </label>
              <label className="label text-xs">
                Height
                <input
                  className="field mt-1"
                  type="number"
                  min={20}
                  value={activeImage.height}
                  onChange={(event) =>
                    updateImage(activeImage.id, { height: Number(event.target.value || 20) })
                  }
                />
              </label>
              <label className="label text-xs">
                Fit
                <select
                  className="field mt-1"
                  value={activeImage.fit}
                  onChange={(event) =>
                    updateImage(activeImage.id, {
                      fit: event.target.value as InvoiceImageFit,
                    })
                  }
                >
                  <option value="contain">Contain</option>
                  <option value="cover">Cover</option>
                </select>
              </label>
              <label className="label text-xs">
                Crop X ({Math.round(activeImage.crop_x)}%)
                <input
                  className="field mt-1"
                  type="range"
                  min={0}
                  max={100}
                  value={activeImage.crop_x}
                  onChange={(event) =>
                    updateImage(activeImage.id, {
                      crop_x: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label className="label text-xs">
                Crop Y ({Math.round(activeImage.crop_y)}%)
                <input
                  className="field mt-1"
                  type="range"
                  min={0}
                  max={100}
                  value={activeImage.crop_y}
                  onChange={(event) =>
                    updateImage(activeImage.id, {
                      crop_y: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label className="label text-xs">
                Zoom ({Math.round(activeImage.zoom)}%)
                <input
                  className="field mt-1"
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  value={activeImage.zoom}
                  onChange={(event) =>
                    updateImage(activeImage.id, {
                      zoom: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label className="label text-xs">
                Opacity ({Math.round(activeImage.opacity * 100)}%)
                <input
                  className="field mt-1"
                  type="range"
                  min={10}
                  max={100}
                  value={Math.round(activeImage.opacity * 100)}
                  onChange={(event) =>
                    updateImage(activeImage.id, {
                      opacity: Number(event.target.value) / 100,
                    })
                  }
                />
              </label>
              <label className="label text-xs">
                Rotation ({Math.round(activeImage.rotation)} deg)
                <input
                  className="field mt-1"
                  type="range"
                  min={-180}
                  max={180}
                  value={activeImage.rotation}
                  onChange={(event) =>
                    updateImage(activeImage.id, {
                      rotation: Number(event.target.value),
                    })
                  }
                />
              </label>
              <button
                className="btn-secondary"
                onClick={() => {
                  setTemplate((previous) => {
                    const nextImages = previous.images.filter((image) => image.id !== activeImage.id);
                    setActiveImageId(nextImages[0]?.id ?? "");
                    return { ...previous, images: nextImages };
                  });
                }}
                type="button"
              >
                Remove Selected Image
              </button>
            </div>
          )}
        </aside>

        <div className="overflow-auto rounded-md border border-slate-200 bg-slate-100 p-3">
          <div
            className="mx-auto origin-top-left bg-white shadow-lg"
            ref={canvasRef}
            style={{
              width: `${template.page_width}px`,
              height: `${template.page_height}px`,
              position: "relative",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: template.use_background_gradient
                  ? `linear-gradient(${template.background_gradient_angle ?? 180}deg, ${template.background_gradient_from ?? "#ffffff"}, ${template.background_gradient_to ?? "#f8fafc"})`
                  : "#ffffff",
              }}
            />
            {template.background_image && (
              <div className="absolute inset-0 overflow-hidden">
                <img
                  alt="Background template"
                  className="h-full w-full"
                  src={template.background_image}
                  style={{
                    objectFit: template.background_fit,
                    objectPosition: `${template.background_x}% ${template.background_y}%`,
                    opacity: template.background_opacity,
                    transform: `scale(${template.background_zoom / 100})`,
                    transformOrigin: `${template.background_x}% ${template.background_y}%`,
                  }}
                />
              </div>
            )}

            {template.fields.map((field) => (
              <div
                className="absolute cursor-move select-none rounded border border-dashed border-brand-300 bg-brand-50/70 px-2 py-1 text-brand-800"
                key={field.key}
                onPointerDown={(event) => {
                  setActiveFieldKey(field.key);
                  startDrag(event, "field", field.key, field.x, field.y);
                }}
                style={{
                  left: `${field.x}px`,
                  top: `${field.y}px`,
                  width: `${field.width ?? 160}px`,
                  minHeight: `${getFieldPreviewHeight(field.key)}px`,
                  fontSize: `${field.font_size}px`,
                  textAlign: field.align,
                  fontFamily: field.font_family ?? "Poppins, sans-serif",
                  fontWeight: field.font_weight ?? 500,
                  fontStyle: field.font_style ?? "normal",
                  color:
                    field.use_gradient
                      ? "transparent"
                      : (field.text_color ?? "#0f172a"),
                  backgroundImage: field.use_gradient
                    ? `linear-gradient(${field.gradient_angle ?? 90}deg, ${field.gradient_from ?? "#0f172a"}, ${field.gradient_to ?? "#334155"})`
                    : undefined,
                  WebkitBackgroundClip: field.use_gradient ? "text" : undefined,
                  backgroundClip: field.use_gradient ? "text" : undefined,
                  WebkitTextFillColor: field.use_gradient ? "transparent" : undefined,
                  touchAction: "none",
                }}
                title="Drag to reposition"
              >
                {field.key === "items_table" ? (
                  <div className="space-y-2 text-left">
                    <p className="font-semibold">{field.label}</p>
                    <div className="overflow-hidden rounded border border-slate-300 bg-white text-[11px] text-slate-700">
                      <div className="grid grid-cols-[60px_1fr_80px_100px_120px] border-b border-slate-200 bg-slate-100 px-2 py-1 font-medium">
                        <span>S.No</span>
                        <span>Description</span>
                        <span className="text-right">Qty</span>
                        <span className="text-right">Rate</span>
                        <span className="text-right">Amount</span>
                      </div>
                      <div className="px-2 py-2 text-[10px] text-slate-500">
                        Items rows will render here in invoice preview
                      </div>
                    </div>
                  </div>
                ) : (
                  field.label
                )}
              </div>
            ))}

            {template.images.map((image) => {
              const selected = image.id === activeImageId;
              return (
                <div
                  className={`absolute cursor-move overflow-hidden border bg-white/30 ${
                    selected ? "border-brand-500 ring-2 ring-brand-300" : "border-slate-300"
                  }`}
                  key={image.id}
                  onPointerDown={(event) => {
                    setActiveImageId(image.id);
                    startDrag(event, "image", image.id, image.x, image.y);
                  }}
                  style={{
                    left: `${image.x}px`,
                    top: `${image.y}px`,
                    width: `${image.width}px`,
                    height: `${image.height}px`,
                    opacity: image.opacity,
                    transform: `rotate(${image.rotation}deg)`,
                    transformOrigin: "center center",
                    touchAction: "none",
                  }}
                  title="Drag image"
                >
                  <img
                    className="h-full w-full"
                    src={image.data_url}
                    alt="Template layer"
                    style={{
                      objectFit: image.fit,
                      objectPosition: `${image.crop_x}% ${image.crop_y}%`,
                      transform: `scale(${image.zoom / 100})`,
                      transformOrigin: `${image.crop_x}% ${image.crop_y}%`,
                    }}
                  />
                  <button
                    className="absolute -right-2 -top-2 rounded-full bg-red-600 px-1 text-xs text-white"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setTemplate((previous) => {
                        const nextImages = previous.images.filter((item) => item.id !== image.id);
                        setActiveImageId(nextImages[0]?.id ?? "");
                        return {
                          ...previous,
                          images: nextImages,
                        };
                      });
                    }}
                    type="button"
                  >
                    x
                  </button>
                </div>
              );
            })}

            {!template.background_image && template.images.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Upload className="h-5 w-5" />
                <p className="text-sm">Blank canvas. Upload image or drag fields to design layout.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
