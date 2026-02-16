"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-8 py-12">
        <div className="mx-auto w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Password Updated
          </h1>
          <p className="mt-4 text-sm text-slate-600">
            Your password has been successfully reset. You can now sign in with
            your new password.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block h-12 rounded-sm bg-slate-900 px-8 text-sm font-medium leading-[3rem] text-white transition-colors hover:bg-slate-800"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-8 py-12">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-900">Set New Password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your new password below.
        </p>

        {error && (
          <div className="mt-6 border-l-4 border-red-500 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              New Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-sm border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder-slate-400 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              placeholder="••••••••"
            />
            <p className="mt-2 text-xs text-slate-500">
              Minimum 6 characters
            </p>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 w-full rounded-sm border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder-slate-400 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-sm bg-slate-900 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </main>
  );
}
