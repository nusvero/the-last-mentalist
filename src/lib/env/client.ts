import { z } from "zod";

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

let cached: ClientEnv | undefined;

// Env publik (aman di browser). Next.js hanya menyisipkan NEXT_PUBLIC_* yang ditulis lengkap.
export function getClientEnv(): ClientEnv {
  if (cached) return cached;

  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
  });

  if (!parsed.success) {
    const names = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Env publik tidak valid: ${names}`);
  }

  cached = parsed.data;
  return cached;
}
