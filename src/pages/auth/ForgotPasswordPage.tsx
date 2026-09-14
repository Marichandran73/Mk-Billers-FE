import { useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { KeyRound, ReceiptIndianRupee } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import DashboardLogo from "../../assets/Images/Dashboard-logo2.png";
import { authApi } from "../../services/authApi";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.forgotPassword(email);
      setResetLink(response.reset_link ?? "");
      toast.success(response.message);
    } catch (error) {
      const message = isAxiosError<{ detail?: string }>(error)
        ? error.response?.data?.detail ?? "Unable to process password reset request"
        : "Unable to process password reset request";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-1 bg-slate-50 lg:grid-cols-[1fr_480px]">
      <section className="hidden text-white lg:flex lg:flex-col lg:justify-between py-1 px-6">
        <img
          src={DashboardLogo}
          alt="MK-BILLERS"
          className="object-contain rounded-md h-full w-full"
        />
      </section>
      <section className="flex items-center justify-center p-6">
        <form
          className="w-full max-w-md rounded-md border border-slate-200 bg-white p-8 shadow-soft"
          onSubmit={submit}
        >
          <div className="mb-8">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-md bg-brand-50 text-brand-700">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-950">
              Reset Password
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter your email and we will generate a secure reset link.
            </p>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Company Email
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
            />
          </label>

          <button
            className="mt-6 w-full rounded-md bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Generating link..." : "Generate Reset Link"}
          </button>

          {resetLink && (
            <div className="mt-5 rounded-md border border-brand-200 bg-brand-50 p-3 text-sm">
              <p className="mb-1 font-medium text-brand-800">Reset link</p>
              <a
                className="break-all text-brand-700 underline"
                href={resetLink}
              >
                {resetLink}
              </a>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-500">
            <ReceiptIndianRupee className="mr-1 inline h-3.5 w-3.5" />
            Return to{" "}
            <Link to="/login" className="font-medium text-brand-700 underline">
              Login
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
