import type { InviteCompanyResponse } from "../types";

export function InviteResultCard({ result }: { result: InviteCompanyResponse }) {
  const sent = Boolean(result.email_sent);
  return (
    <div
      className={`rounded-md border p-5 text-sm ${
        sent
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-200 bg-amber-50 text-amber-900"
      }`}
    >
      <p className="font-semibold">{result.message}</p>
      <p className="mt-2">
        OTP recipient: {result.email} ({result.role}). Expires at{" "}
        {new Date(`${result.expires_at}Z`).toLocaleString()}.
      </p>
      {result.email_error && (
        <p className="mt-2 rounded border border-amber-300 bg-white/60 p-2 text-xs">
          Email error: {result.email_error}
        </p>
      )}
      {result.verification_code && (
        <p className="mt-3 font-mono text-lg tracking-widest">
          OTP: {result.verification_code}
        </p>
      )}
      {result.setup_link && (
        <a className="mt-2 block break-all underline" href={result.setup_link}>
          {result.setup_link}
        </a>
      )}
      <p className="mt-3 opacity-80">
        The user enters their email and this OTP on the Set Password page to
        activate the account.
      </p>
    </div>
  );
}
