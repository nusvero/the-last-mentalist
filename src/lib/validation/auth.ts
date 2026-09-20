import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email wajib diisi.")
  .max(254, "Email terlalu panjang.")
  .email("Format email tidak valid.");

// Batas 72 karakter mengikuti batas algoritma hash password (bcrypt).
const newPassword = z
  .string()
  .min(8, "Password minimal 8 karakter.")
  .max(72, "Password maksimal 72 karakter.");

export const signInSchema = z.object({
  email,
  password: z
    .string()
    .min(1, "Password wajib diisi.")
    .max(72, "Password terlalu panjang."),
});

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter.")
      .max(120, "Nama terlalu panjang."),
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  });

/** Ambil pesan error pertama per field, aman untuk ditampilkan di form. */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in result)) result[key] = issue.message;
  }
  return result;
}
