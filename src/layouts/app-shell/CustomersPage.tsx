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
  const adminRestricted = isInactiveAdmin();

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
    if (adminRestricted) {
      toast.error(
        editing
          ? getRestrictedActionMessage("edit-user")
          : getRestrictedActionMessage("create-user"),
      );
      return;
    }
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
      }
      toast.error(
        "Unable to save customer. Duplicate customer details may exist.",
      );
    }
  };

  const remove = async (customer: Customer) => {
    if (adminRestricted) {
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
        {Object.keys(emptyCustomer).map((key) => (
          <label className="label" key={key}>
            {key
              .replace("_", " ")
              .replace(/\b\w/g, (char) => char.toUpperCase())}
            <input
              className="field mt-1"
              value={String(form[key as keyof CustomerPayload] ?? "")}
              onChange={(event) =>
                setForm({ ...form, [key]: event.target.value })
              }
              required={key === "name"}
            />
          </label>
        ))}
        <button className="btn-primary w-full">
          <Users className="h-4 w-4" />{" "}
          {editing ? "Update Customer" : "Add Customer"}
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
                          className={`icon-btn ${adminRestricted ? "opacity-50" : ""}`}
                          onClick={() => {
                            if (adminRestricted) {
                              toast.error(
                                getRestrictedActionMessage("edit-user"),
                              );
                              return;
                            }
                            setEditing(customer);
                            setForm(customer);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className={`icon-btn text-red-600 ${adminRestricted ? "opacity-50" : ""}`}
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
