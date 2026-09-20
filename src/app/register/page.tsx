import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md px-5 py-16 sm:px-8">
      <p className="font-display text-eyebrow tracking-arcane text-gold">Daftar</p>
      <h1 className="mt-2 font-display text-h1 text-ivory">Buat akun baru</h1>
      <div className="mt-8">
        <RegisterForm />
      </div>
    </main>
  );
}
