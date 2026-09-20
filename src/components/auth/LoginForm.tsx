"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInAction, type AuthFormState } from "@/actions/auth";

const initialState: AuthFormState = { status: "idle" };

const inputClass =
  "w-full rounded-md border border-border-dark bg-charcoal px-4 py-3 text-body text-ivory " +
  "placeholder:text-muted focus:border-gold focus:outline-none";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-body-sm text-muted">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
        {state.status === "error" && state.fieldErrors?.email && (
          <p className="text-body-sm text-ritual">{state.fieldErrors.email}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-body-sm text-muted">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
        {state.status === "error" && state.fieldErrors?.password && (
          <p className="text-body-sm text-ritual">{state.fieldErrors.password}</p>
        )}
      </div>

      {state.status === "error" && state.message && (
        <p className="text-body-sm text-ritual">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-gold px-5 py-3 font-semibold text-obsidian disabled:opacity-60"
      >
        {pending ? "Memproses..." : "Masuk"}
      </button>

      <p className="text-body-sm text-muted">
        Belum punya akun?{" "}
        <Link href="/register" className="text-gold-pale underline">
          Daftar
        </Link>
      </p>
    </form>
  );
}
