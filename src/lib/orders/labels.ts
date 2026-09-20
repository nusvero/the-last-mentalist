import type { Tables } from "@/types/database";

// File terpisah dari queries.ts SENGAJA: queries.ts punya `import "server-only"`,
// jadi kalau konstanta ini diekspor dari sana, komponen client yang import-nya
// (OrderStatusForm) ikut menarik seluruh modul server ke bundle browser dan build
// gagal. Ini cuma data tampilan, aman dipakai di server maupun client.
export const ORDER_STATUS_LABEL: Record<Tables<"orders">["status"], string> = {
  PENDING_PAYMENT: "Menunggu Pembayaran",
  PAID: "Sudah Dibayar",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};
