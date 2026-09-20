"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signUpAction, type AuthFormState } from "@/actions/auth";

const initialState: AuthFormState = { status: "idle" };

const inputClass =
  "w-full rounded-md border border-border-dark bg-charcoal px-4 py-3 text-body text-ivory " +
  "placeholder:text-muted focus:border-gold focus:outline-none";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  if (state.status === "success") {
    return <p className="text-body text-mystic">{state.message}</p>;
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="fullName" className="text-body-sm text-muted">
          Nama lengkap
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          className={inputClass}
        />
        {state.status === "error" && state.fieldErrors?.fullName && (
          <p className="text-body-sm text-ritual">{state.fieldErrors.fullName}</p>
        )}
      </div>

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
          autoComplete="new-password"
          className={inputClass}
        />
        {state.status === "error" && state.fieldErrors?.password && (
          <p className="text-body-sm text-ritual">{state.fieldErrors.password}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-body-sm text-muted">
          Konfirmasi password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className={inputClass}
        />
        {state.status === "error" && state.fieldErrors?.confirmPassword && (
          <p className="text-body-sm text-ritual">{state.fieldErrors.confirmPassword}</p>
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
        {pending ? "Memproses..." : "Daftar"}
      </button>

      <p className="text-body-sm text-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-gold-pale underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}
