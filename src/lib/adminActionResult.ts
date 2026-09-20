/** Bentuk hasil seragam untuk semua server action admin (produk, kategori,
 * pesanan, channel pembayaran) -- pola flat yang sama dengan AuthFormState
 * di src/actions/auth.ts, supaya kompatibel dengan initial state useActionState. */
export type AdminActionResult = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const ADMIN_ACTION_IDLE: AdminActionResult = { status: "idle" };
