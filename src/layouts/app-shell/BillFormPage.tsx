import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";

import { billApi } from "../../services/billApi";
import { customerApi } from "../../services/customerApi";
import type { BillItem, BillPayload, BillStatus, Customer } from "../../types";
import { calculateBillTotals, formatCurrency } from "../../utils/billing";
import {
  // getRestrictedActionMessage,
  hasStaffReachedBillLimit,
  isInactiveAdmin,
  isStaffUser,
} from "../../utils/permissions";
import { PageTitle } from "./PageTitle";
import { SummaryBox } from "./SummaryBox";
import { emptyItem } from "./shared";

export function BillFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState("");
  const [transportation, setTransportation] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [status, setStatus] = useState<BillStatus>("Pending");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [staffBillActionRestricted, setStaffBillActionRestricted] = useState(false);
  const adminRestricted = isInactiveAdmin();
  const staffUser = isStaffUser();
  const saveBlocked = adminRestricted || staffBillActionRestricted;
  const [items, setItems] = useState<Omit<BillItem, "id" | "amount">[]>([
    { ...emptyItem },
  ]);

  useEffect(() => {
    customerApi
      .list()
      .then(setCustomers)
      .catch(() => toast.error("Unable to load customers"));
    if (id) {
      billApi
        .get(Number(id))
        .then((bill) => {
          setInvoiceNumber(bill.invoice_number);
          setCustomerId(String(bill.customer_id));
          setInvoiceDate(bill.invoice_date);
          setDueDate(bill.due_date ?? "");
          setTransportation(bill.transportation);
          setDiscount(bill.discount);
          setStatus(bill.status);
          setNotes(bill.notes ?? "");
          setItems(
            bill.items.map(
              ({ description, quantity, unit, rate, gst_percent }) => ({
                description,
                quantity,
                unit,
                rate,
                gst_percent,
              }),
            ),
          );
        })
        .catch(() => toast.error("Unable to load bill"));
    }

    if (staffUser) {
      billApi
        .list({ page: 1, limit: 1 })
        .then((response) =>
          setStaffBillActionRestricted(hasStaffReachedBillLimit(response.total)),
        )
        .catch(() => setStaffBillActionRestricted(false));
    }
  }, [id]);

  const totals = useMemo(
    () => calculateBillTotals(items, transportation, discount),
    [items, transportation, discount],
  );

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saveBlocked) {
      toast.error("Save bill is disabled. Please contact MKBillers.");
      return;
    }
    if (!customerId) {
      toast.error("Select a customer");
      return;
    }
    if (
      items.some(
        (item) =>
          !item.description ||
          item.quantity <= 0 ||
          item.rate < 0 ||
          item.gst_percent < 0,
      )
    ) {
      toast.error("Check item descriptions, quantity, rate, and GST");
      return;
    }
    if (discount > totals.subtotal + totals.gst + transportation) {
      toast.error("Discount cannot exceed invoice value");
      return;
    }
    const payload: BillPayload = {
      invoice_number: invoiceNumber || undefined,
      customer_id: Number(customerId),
      invoice_date: invoiceDate,
      due_date: dueDate || undefined,
      transportation,
      discount,
      status,
      notes,
      items,
    };
    setSaving(true);
    try {
      const bill = editing
        ? await billApi.update(Number(id), payload)
        : await billApi.create(payload);
      toast.success(
        editing ? "Bill updated successfully" : "Bill created successfully",
      );
      navigate(`/bills/${bill.id}`);
    } catch (error) {
      if (isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (typeof detail === "string" && detail.trim()) {
          toast.error(detail);
          return;
        }
      }
      toast.error("Unable to save bill. Invoice number may already exist.");
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (
    index: number,
    key: keyof Omit<BillItem, "id" | "amount">,
    value: string,
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: ["quantity", "rate", "gst_percent"].includes(key)
                ? Number(value)
                : value,
            }
          : item,
      ),
    );
  };

  return (
    <form className="space-y-5" onSubmit={save}>
      <PageTitle
        title={editing ? "Edit Bill" : "Create Bill"}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-secondary"
              type="button"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              className={`btn-primary ${saveBlocked ? "opacity-60" : ""}`}
              type="submit"
              disabled={saving}
              onClick={(event) => {
                if (!saveBlocked) return;
                event.preventDefault();
                toast.error("Save bill is disabled. Please contact MKBillers.");
              }}
            >
              <FileText className="h-4 w-4" /> {saving ? "Saving..." : "Save Bill"}
            </button>
          </div>
        }
      />
      <div className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-4">
        <label className="label">
          Invoice Number
          <input
            className="field mt-1"
            placeholder="Auto generated"
            value={invoiceNumber}
            onChange={(event) => setInvoiceNumber(event.target.value)}
          />
        </label>
        <label className="label">
          Invoice Date
          <input
            className="field mt-1"
            type="date"
            value={invoiceDate}
            onChange={(event) => setInvoiceDate(event.target.value)}
            required
          />
        </label>
        <label className="label">
          Due Date
          <input
            className="field mt-1"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
        <label className="label lg:col-span-2">
          Customer
          <select
            className="field mt-1"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            required
          >
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option value={customer.id} key={customer.id}>
                {customer.name} {customer.phone ? `- ${customer.phone}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="label">
          Transportation
          <input
            className="field mt-1"
            type="number"
            min="0"
            value={transportation}
            onChange={(event) => setTransportation(Number(event.target.value))}
          />
        </label>
        <label className="label">
          Discount
          <input
            className="field mt-1"
            type="number"
            min="0"
            value={discount}
            onChange={(event) => setDiscount(Number(event.target.value))}
          />
        </label>
        {!staffUser && (
          <label className="label">
            Status
            <select
              className="field mt-1"
              value={status}
              onChange={(event) => setStatus(event.target.value as BillStatus)}
            >
              <option value="Pending">Pending</option>
              <option value="Paid">Done</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>
        )}
      </div>
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Items</h2>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => setItems([...items, { ...emptyItem }])}
          >
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th>SI No</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Rate</th>
                <th>GST %</th>
                <th>Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="py-2 pr-3">{index + 1}</td>
                  <td className="py-2 pr-3">
                    <input
                      className="field"
                      value={item.description}
                      onChange={(event) =>
                        updateItem(index, "description", event.target.value)
                      }
                      required
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      className="field"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(index, "quantity", event.target.value)
                      }
                      required
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      className="field"
                      value={item.unit}
                      onChange={(event) =>
                        updateItem(index, "unit", event.target.value)
                      }
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      className="field"
                      type="number"
                      min="0"
                      value={item.rate}
                      onChange={(event) =>
                        updateItem(index, "rate", event.target.value)
                      }
                      required
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      className="field"
                      type="number"
                      min="0"
                      value={item.gst_percent}
                      onChange={(event) =>
                        updateItem(index, "gst_percent", event.target.value)
                      }
                    />
                  </td>
                  <td className="py-2 pr-3 font-medium">
                    {formatCurrency(item.quantity * item.rate)}
                  </td>
                  <td className="py-2">
                    <button
                      className="icon-btn text-red-600"
                      type="button"
                      onClick={() =>
                        setItems(
                          items.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <label className="label rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          Notes
          <textarea
            className="field mt-2 min-h-32"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <SummaryBox
          subtotal={totals.subtotal}
          cgst={totals.cgst}
          sgst={totals.sgst}
          transportation={transportation}
          discount={discount}
          grandTotal={totals.grandTotal}
        />
      </div>
    </form>
  );
}
