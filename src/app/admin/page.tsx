import Link from "next/link";
import type { Metadata } from "next";

import {
  isCurrentUserAdmin,
  isCurrentUserCatalogManager,
  isCurrentUserOrderStaff,
} from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin" };

async function countRows(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table: "products" | "orders" | "payment_proofs",
  filter?: { column: string; value: string },
) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) query = query.eq(filter.column, filter.value);
  const { count } = await query;
  return count ?? 0;
}

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const [isCatalogManager, isOrderStaff, isAdmin] = await Promise.all([
    isCurrentUserCatalogManager(),
    isCurrentUserOrderStaff(),
    isCurrentUserAdmin(),
  ]);

  const [productCount, pendingOrderCount, pendingProofCount] = await Promise.all([
    isCatalogManager ? countRows(supabase, "products") : Promise.resolve(0),
    isOrderStaff
      ? countRows(supabase, "orders", { column: "status", value: "PENDING_PAYMENT" })
      : Promise.resolve(0),
    isAdmin
      ? countRows(supabase, "payment_proofs", { column: "status", value: "PENDING" })
      : Promise.resolve(0),
  ]);

  const cards = [
    isCatalogManager && {
      href: "/admin/produk",
      label: "Produk",
      value: `${productCount} produk`,
    },
    isOrderStaff && {
      href: "/admin/pesanan",
      label: "Pesanan",
      value: `${pendingOrderCount} menunggu bayar`,
    },
    isAdmin && {
      href: "/admin/pembayaran",
      label: "Konfirmasi Pembayaran",
      value: `${pendingProofCount} antrean`,
    },
    isAdmin && {
      href: "/admin/channel-pembayaran",
      label: "Channel Pembayaran",
      value: "Kelola rekening/e-wallet/QRIS",
    },
  ].filter(Boolean) as { href: string; label: string; value: string }[];

  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-h1 text-ivory">Dashboard Admin</h1>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-card border border-border-dark bg-charcoal p-5 hover:border-gold"
          >
            <p className="font-display text-h3 text-gold-pale">{card.label}</p>
            <p className="mt-1 text-body-sm text-muted">{card.value}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
