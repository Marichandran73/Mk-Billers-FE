import { useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { Eye, EyeOff, ReceiptIndianRupee } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import DashboardLogo from "../../assets/Images/Dashboard-logo2.png";
import { authApi } from "../../services/authApi";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.login(
        email.trim().toLowerCase(),
        password,
      );
      localStorage.setItem("MKbillers_token", response.access_token);
      localStorage.setItem("MKbillers_user", JSON.stringify(response.user));
      toast.success("Login successful");
      navigate("/dashboard");
    } catch (error) {
      let message = "Unable to login. Check your email and password.";

      if (isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (typeof detail === "string") {
          message = detail;
        } else if (Array.isArray(detail) && detail[0]?.msg) {
          message = detail[0].msg;
        }
      }

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
              <ReceiptIndianRupee className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-950">
              Login to MK-BILLERS
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Use your invited company credentials to continue. No public registration.
            </p>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Company Email
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              type="email"
              autoComplete="username"
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
          <button
            className="mt-6 w-full rounded-md bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60 cursor-pointer"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
          <p className="mt-3 text-right text-sm text-slate-500">
            <Link
              to="/forgot-password"
              className="font-medium text-brand-700 underline"
            >
              Forgot password?
            </Link>
          </p>
          <p className="mt-2 text-right text-sm text-slate-500">
            <Link
              to="/register"
              className="font-medium text-brand-700 underline"
            >
              New company? Register here
            </Link>
          </p>
          <p className="mt-2 text-right text-sm text-slate-500">
            <Link
              to="/set-password"
              className="font-medium text-brand-700 underline"
            >
              First time login? Verify OTP and set password
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
