import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isCurrentUserOrderStaff } from "@/lib/auth/roles";
import { getAllOrdersForStaff } from "@/lib/orders/adminQueries";
import { ORDER_STATUS_LABEL } from "@/lib/orders/labels";
import { formatRupiah } from "@/lib/format";
import { ORDER_STATUS_VALUES } from "@/lib/validation/order";
import type { Tables } from "@/types/database";

export const metadata: Metadata = { title: "Kelola Pesanan" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!(await isCurrentUserOrderStaff())) redirect("/admin");

  const { status } = await searchParams;
  const validStatus = ORDER_STATUS_VALUES.includes(status as Tables<"orders">["status"])
    ? (status as Tables<"orders">["status"])
    : undefined;

  const orders = await getAllOrdersForStaff({ status: validStatus });

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-h1 text-ivory">Kelola Pesanan</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/admin/pesanan"
          className={`rounded-full border px-4 py-2 text-body-sm ${
            !validStatus
              ? "border-gold bg-gold text-obsidian"
              : "border-border-dark text-ivory"
          }`}
        >
          Semua
        </Link>
        {ORDER_STATUS_VALUES.map((s) => (
          <Link
            key={s}
            href={`/admin/pesanan?status=${s}`}
            className={`rounded-full border px-4 py-2 text-body-sm ${
              validStatus === s
                ? "border-gold bg-gold text-obsidian"
                : "border-border-dark text-ivory"
            }`}
          >
            {ORDER_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="mt-8 text-body text-muted">Tidak ada pesanan.</p>
      ) : (
        <div className="mt-8 divide-y divide-border-dark border-y border-border-dark">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/admin/pesanan/${o.orderNumber}`}
              className="flex items-center justify-between px-2 py-4 hover:bg-charcoal"
            >
              <div>
                <p className="text-body text-ivory">{o.orderNumber}</p>
                <p className="text-body-sm text-muted">{o.customerName ?? "-"}</p>
              </div>
              <div className="text-right">
                <p className="text-body text-ivory">{formatRupiah(o.total)}</p>
                <p className="text-body-sm text-gold-pale">
                  {ORDER_STATUS_LABEL[o.status]}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
