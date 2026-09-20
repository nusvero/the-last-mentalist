import Link from "next/link";

import { signOutAction } from "@/actions/auth";
import { isCurrentUserAdmin } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let cartCount = 0;
  let isAdmin = false;
  if (user) {
    const [{ count }, adminStatus] = await Promise.all([
      supabase.from("cart_items").select("id", { count: "exact", head: true }),
      isCurrentUserAdmin(),
    ]);
    cartCount = count ?? 0;
    isAdmin = adminStatus;
  }

  return (
    <header className="border-b border-border-dark bg-obsidian">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="font-display text-h3 tracking-stage text-ivory">
          PARLOR GAME CO.
        </Link>
        <nav className="flex items-center gap-6 text-body-sm">
          <Link href="/produk" className="text-ivory hover:text-gold">
            Produk
          </Link>
          <Link href="/keranjang" className="text-ivory hover:text-gold">
            Keranjang
            {cartCount > 0 && (
              <span className="ml-1.5 rounded-full bg-gold px-2 py-0.5 text-caption font-semibold text-obsidian">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <>
              <Link href="/account" className="text-ivory hover:text-gold">
                Akun
              </Link>
              {isAdmin && (
                <Link href="/admin/pembayaran" className="text-ivory hover:text-gold">
                  Konfirmasi Bayar
                </Link>
              )}
              <form action={signOutAction}>
                <button type="submit" className="text-muted hover:text-gold">
                  Keluar
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="text-ivory hover:text-gold">
              Masuk
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
