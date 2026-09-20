"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { safeRedirectPath } from "@/lib/auth/redirect";
import { getClientEnv } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  toFieldErrors,
} from "@/lib/validation/auth";

export type AuthFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
};

const RATE_LIMITED: AuthFormState = {
  status: "error",
  message: "Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.",
};

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function confirmUrl(next: string): string {
  const base = getClientEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return `${base}/auth/confirm?next=${encodeURIComponent(next)}`;
}

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: field(formData, "email"),
    password: field(formData, "password"),
  });
  if (!parsed.success)
    return { status: "error", fieldErrors: toFieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.status === 429) return RATE_LIMITED;
    if (error.code === "email_not_confirmed") {
      return {
        status: "error",
        message: "Email belum diverifikasi. Cek kotak masuk Anda.",
      };
    }
    // Pesan sengaja umum: tidak membocorkan apakah email terdaftar.
    return { status: "error", message: "Email atau password salah." };
  }

  revalidatePath("/", "layout");
  redirect(safeRedirectPath(field(formData, "next")));
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    fullName: field(formData, "fullName"),
    email: field(formData, "email"),
    password: field(formData, "password"),
    confirmPassword: field(formData, "confirmPassword"),
  });
  if (!parsed.success)
    return { status: "error", fieldErrors: toFieldErrors(parsed.error) };

  const { fullName, email, password } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: confirmUrl("/account"),
      data: { full_name: fullName },
    },
  });

  const checkEmail: AuthFormState = {
    status: "success",
    message: "Hampir selesai. Kami mengirim tautan verifikasi ke email Anda.",
  };

  if (error) {
    if (error.status === 429) return RATE_LIMITED;
    if (error.code === "weak_password") {
      return {
        status: "error",
        fieldErrors: {
          password: "Password terlalu lemah. Gunakan kombinasi yang lebih kuat.",
        },
      };
    }
    // Email yang sudah terdaftar dijawab sama seperti sukses (anti enumerasi akun).
    if (error.code === "user_already_exists") return checkEmail;
    return { status: "error", message: "Pendaftaran belum berhasil. Silakan coba lagi." };
  }

  // Jika verifikasi email dimatikan di Supabase, user langsung punya sesi.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/account");
  }

  return checkEmail;
}

export async function requestPasswordResetAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: field(formData, "email") });
  if (!parsed.success)
    return { status: "error", fieldErrors: toFieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: confirmUrl("/reset-password"),
  });

  if (error?.status === 429) return RATE_LIMITED;
  if (error) console.error("[auth] reset password gagal:", error.code ?? error.status);

  return {
    status: "success",
    message:
      "Jika email tersebut terdaftar, tautan untuk mengatur ulang password sudah dikirim.",
  };
}

export async function updatePasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: field(formData, "password"),
    confirmPassword: field(formData, "confirmPassword"),
  });
  if (!parsed.success)
    return { status: "error", fieldErrors: toFieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) {
    return {
      status: "error",
      message: "Sesi pengaturan ulang sudah kedaluwarsa. Silakan minta tautan baru.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") {
      return {
        status: "error",
        fieldErrors: { password: "Gunakan password yang berbeda dari sebelumnya." },
      };
    }
    if (error.code === "weak_password") {
      return {
        status: "error",
        fieldErrors: {
          password: "Password terlalu lemah. Gunakan kombinasi yang lebih kuat.",
        },
      };
    }
    return {
      status: "error",
      message: "Password belum dapat diperbarui. Silakan coba lagi.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/account");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
