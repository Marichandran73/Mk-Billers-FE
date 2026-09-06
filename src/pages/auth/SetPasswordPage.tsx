import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { LockKeyhole, ReceiptIndianRupee } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import DashboardLogo from "../../assets/Images/Dashboard-logo2.png";
import { authApi } from "../../services/authApi";

export function SetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tokenInput, setTokenInput] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const tokenFromQuery = useMemo(
    () => searchParams.get("token") ?? "",
    [searchParams],
  );
  const token = (tokenFromQuery || tokenInput).trim();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      toast.error("Invalid setup link");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.setupPassword(token, password);
      localStorage.setItem("MKbillers_token", response.access_token);
      localStorage.setItem("MKbillers_user", JSON.stringify(response.user));
      toast.success("Password set successfully");
      navigate("/dashboard");
    } catch {
      toast.error("This setup link is invalid or expired");
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
              <LockKeyhole className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-950">
              Set Your Password
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Use a strong password to activate your account access.
            </p>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Verification Code
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              value={tokenFromQuery || tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              required
              minLength={6}
              disabled={Boolean(tokenFromQuery)}
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            New Password
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              type="password"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Confirm Password
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              type="password"
            />
          </label>

          <button
            className="mt-6 w-full rounded-md bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Saving..." : "Set Password"}
          </button>

          <p className="mt-4 text-xs text-slate-500">
            <ReceiptIndianRupee className="mr-1 inline h-3.5 w-3.5" />
            Back to{" "}
            <Link to="/login" className="font-medium text-brand-700 underline">
              Login
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
