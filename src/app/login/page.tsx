import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";
import { safeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ? safeRedirectPath(params.next) : undefined;

  return (
    <main className="mx-auto max-w-md px-5 py-16 sm:px-8">
      <p className="font-display text-eyebrow tracking-arcane text-gold">Masuk</p>
      <h1 className="mt-2 font-display text-h1 text-ivory">Selamat datang kembali</h1>

      {params.error === "link_invalid" && (
        <p className="mt-4 rounded-md border border-crimson bg-crimson-dark/30 px-4 py-3 text-body-sm text-ivory">
          Tautan sudah tidak berlaku. Silakan masuk kembali.
        </p>
      )}

      <div className="mt-8">
        <LoginForm next={next} />
      </div>
    </main>
  );
}
