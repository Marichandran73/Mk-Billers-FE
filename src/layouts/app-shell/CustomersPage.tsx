import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { Edit, Trash2, Users } from "lucide-react";
import { toast } from "react-toastify";

import { customerApi } from "../../services/customerApi";
import type { Customer } from "../../types";
import type { CustomerPayload } from "../../services/customerApi";
import {
  getRestrictedActionMessage,
  isStaffUser,
  isInactiveAdmin,
} from "../../utils/permissions";
import { EmptyState } from "./EmptyState";
import { PageTitle } from "./PageTitle";
import { emptyCustomer } from "./shared";

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerPayload>(emptyCustomer);
  const [submitting, setSubmitting] = useState(false);
  const actionRestricted = isInactiveAdmin() || isStaffUser();
  const customerFields = Object.keys(emptyCustomer) as Array<keyof CustomerPayload>;
  const fieldConfig: Record<
    keyof CustomerPayload,
    {
      type?: string;
      inputMode?: "text" | "email" | "numeric";
      pattern?: string;
      title?: string;
      maxLength?: number;
      minLength?: number;
    }
  > = {
    name: {
      pattern: "[A-Za-z][A-Za-z .'-]*",
      title: "Only letters, spaces, dot, apostrophe and hyphen are allowed",
      minLength: 2,
      maxLength: 160,
    },
    company_name: {
      pattern: "[A-Za-z][A-Za-z .'-]*",
      title: "Only letters, spaces, dot, apostrophe and hyphen are allowed",
      minLength: 2,
      maxLength: 160,
    },
    email: {
      type: "email",
      inputMode: "email",
      maxLength: 255,
    },
    phone: {
      inputMode: "numeric",
      pattern: "[0-9]{10}",
      title: "Phone number must be exactly 10 digits",
      minLength: 10,
      maxLength: 10,
    },
    address: {
      minLength: 5,
      maxLength: 500,
    },
    gst_number: {
      pattern: "[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][1-9A-Za-z]Z[0-9A-Za-z]",
      title: "Enter valid GST format (example: 27ABCDE1234F1Z5)",
      minLength: 15,
      maxLength: 15,
    },
    city: {
      pattern: "[A-Za-z][A-Za-z .'-]*",
      title: "Only letters, spaces, dot, apostrophe and hyphen are allowed",
      minLength: 2,
      maxLength: 80,
    },
    state: {
      pattern: "[A-Za-z][A-Za-z .'-]*",
      title: "Only letters, spaces, dot, apostrophe and hyphen are allowed",
      minLength: 2,
      maxLength: 80,
    },
    pincode: {
      inputMode: "numeric",
      pattern: "[0-9]{6}",
      title: "Pincode must be exactly 6 digits",
      minLength: 6,
      maxLength: 6,
    },
  };

  const validateCustomerForm = (payload: CustomerPayload): string | null => {
    const requiredLabelMap: Record<keyof CustomerPayload, string> = {
      name: "Name",
      company_name: "Company Name",
      email: "Email",
      phone: "Phone",
      address: "Address",
      gst_number: "GST Number",
      city: "City",
      state: "State",
      pincode: "Pincode",
    };

    for (const [key, value] of Object.entries(payload) as Array<
      [keyof CustomerPayload, string]
    >) {
      if (!value.trim()) {
        return `${requiredLabelMap[key]} is required`;
      }
    }

    if (!/^[A-Za-z][A-Za-z .'-]*$/.test(payload.name.trim())) {
      return "Name can contain only letters, spaces, dot, apostrophe, and hyphen";
    }
    if (!/^[A-Za-z][A-Za-z .'-]*$/.test(payload.company_name.trim())) {
      return "Company Name can contain only letters, spaces, dot, apostrophe, and hyphen";
    }
    if (!/^\S+@\S+\.\S+$/.test(payload.email.trim())) {
      return "Enter a valid email address";
    }
    if (!/^\d{10}$/.test(payload.phone.trim())) {
      return "Phone number must be exactly 10 digits";
    }
    if (!/^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][1-9A-Za-z]Z[0-9A-Za-z]$/.test(payload.gst_number.trim())) {
      return "GST number format is invalid";
    }
    if (!/^\d{6}$/.test(payload.pincode.trim())) {
      return "Pincode must be exactly 6 digits";
    }

    return null;
  };

  const load = useCallback(
    () =>
      customerApi
        .list(search)
        .then(setCustomers)
        .catch(() => toast.error("Unable to load customers")),
    [search],
  );

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (actionRestricted) {
      toast.error(
        editing
          ? getRestrictedActionMessage("edit-user")
          : getRestrictedActionMessage("create-user"),
      );
      return;
    }
    const validationError = validateCustomerForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSubmitting(true);
    try {
      if (editing) await customerApi.update(editing.id, form);
      else await customerApi.create(form);
      toast.success(
        editing
          ? "Customer updated successfully"
          : "Customer added successfully",
      );
      setEditing(null);
      setForm(emptyCustomer);
      await load();
    } catch (error) {
      if (isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (typeof detail === "string") {
          toast.error(detail);
          return;
        }
        if (Array.isArray(detail) && detail.length > 0) {
          const firstIssue = detail[0] as { loc?: Array<string | number>; msg?: string };
          const fieldName = String(firstIssue.loc?.[firstIssue.loc.length - 1] ?? "field")
            .replace("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
          toast.error(`${fieldName}: ${firstIssue.msg ?? "Invalid value"}`);
          return;
        }
      }
      toast.error(
        "Unable to save customer. Duplicate customer details may exist.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (customer: Customer) => {
    if (actionRestricted) {
      toast.error(getRestrictedActionMessage("delete-user"));
      return;
    }
    if (
      !window.confirm(
        `Delete ${customer.name}? Existing bills will keep their invoice records.`,
      )
    )
      return;
    try {
      await customerApi.remove(customer.id);
      toast.success("Customer deleted successfully");
      await load();
    } catch {
      toast.error("Unable to delete customer");
    }
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <form
        className="space-y-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={save}
      >
        <h2 className="font-semibold">
          {editing ? "Edit Customer" : "Add Customer"}
        </h2>
        {customerFields.map((field) => (
          <label className="label" key={field}>
            {field
              .replace("_", " ")
              .replace(/\b\w/g, (char) => char.toUpperCase())}
            {(() => {
              const config = fieldConfig[field];
              return (
            <input
              className="field mt-1"
              type={config.type ?? "text"}
              inputMode={config.inputMode}
              pattern={config.pattern}
              title={config.title}
              minLength={config.minLength}
              maxLength={config.maxLength}
              value={String(form[field] ?? "")}
              onChange={(event) =>
                setForm({ ...form, [field]: event.target.value })
              }
              required
            />
              );
            })()}
          </label>
        ))}
        <button className="btn-primary w-full" disabled={submitting}>
          <Users className="h-4 w-4" />{" "}
          {submitting
            ? editing
              ? "Updating..."
              : "Submitting..."
            : editing
              ? "Update Customer"
              : "Add Customer"}
        </button>
      </form>
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <PageTitle
          title="Customers"
          action={
            <input
              className="field max-w-xs"
              placeholder="Search customer"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          }
        />
        {customers.length === 0 ? (
          <EmptyState
            title="No customers"
            description="Add customers before creating bills."
          />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3">Name</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>GST</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr className="border-b border-slate-100" key={customer.id}>
                    <td className="py-3 font-medium">{customer.name}</td>
                    <td>{customer.company_name}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.email}</td>
                    <td>{customer.gst_number}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className={`icon-btn ${actionRestricted ? "opacity-50" : ""}`}
                          onClick={() => {
                            if (actionRestricted) {
                              toast.error(
                                getRestrictedActionMessage("edit-user"),
                              );
                              return;
                            }
                            setEditing(customer);
                            setForm({
                              name: customer.name ?? "",
                              company_name: customer.company_name ?? "",
                              email: customer.email ?? "",
                              phone: customer.phone ?? "",
                              address: customer.address ?? "",
                              gst_number: customer.gst_number ?? "",
                              city: customer.city ?? "",
                              state: customer.state ?? "",
                              pincode: customer.pincode ?? "",
                            });
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className={`icon-btn text-red-600 ${actionRestricted ? "opacity-50" : ""}`}
                          onClick={() => remove(customer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
