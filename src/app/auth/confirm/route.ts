import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { safeRedirectPath } from "@/lib/auth/redirect";
import { getClientEnv } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const OTP_TYPES: readonly string[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function isOtpType(value: string | null): value is EmailOtpType {
  return value !== null && OTP_TYPES.includes(value);
}

/**
 * Tujuan tautan dari email Supabase (verifikasi akun & reset password).
 * Mendukung dua format: token_hash + type, atau code (PKCE).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  // Pakai SITE_URL, bukan origin request: di Codespaces origin bisa "localhost".
  const base = getClientEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const next = safeRedirectPath(searchParams.get("next"));

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");

  const supabase = await createSupabaseServerClient();
  let verified = false;

  if (tokenHash && isOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    verified = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    verified = !error;
  }

  if (verified) return NextResponse.redirect(`${base}${next}`);
  return NextResponse.redirect(`${base}/login?error=link_invalid`);
}
