import { useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { Eye, EyeOff, ReceiptIndianRupee } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { authApi } from "../../services/authApi";

export function RegisterPage() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Password and confirm password must match");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.register(
        companyName.trim(),
        email.trim().toLowerCase(),
        password,
      );
      localStorage.setItem("MKbillers_token", response.access_token);
      localStorage.setItem("MKbillers_user", JSON.stringify(response.user));
      toast.success("Account created successfully");
      navigate("/dashboard");
    } catch (error) {
      let message = "Unable to register account.";
      if (isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (typeof detail === "string") {
          message = detail;
        }
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <form
        className="w-full max-w-md rounded-md border border-slate-200 bg-white p-8 shadow-soft"
        onSubmit={submit}
      >
        <div className="mb-8">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-md bg-brand-50 text-brand-700">
            <ReceiptIndianRupee className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-950">
            Register Company Account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Create your company admin login to start using MK-BILLERS.
          </p>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Company Name
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            required
            minLength={2}
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Email
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            type="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Password
          <div className="relative mt-2">
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-2 inline-flex items-center text-slate-500 transition hover:text-slate-700"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
          </div>
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Confirm Password
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
          />
        </label>

        <button
          className="mt-6 w-full rounded-md bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="mt-3 text-right text-sm text-slate-500">
          <Link to="/login" className="font-medium text-brand-700 underline">
            Already have an account? Login
          </Link>
        </p>
      </form>
    </main>
  );
}
