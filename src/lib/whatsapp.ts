import "server-only";

import { getServerEnv } from "@/lib/env/server";

/** Nomor WA toko untuk tombol konfirmasi -- bukan rahasia, memang ditujukan
 * untuk dihubungi pembeli, jadi aman diteruskan ke Client Component. */
export function getStoreWhatsAppNumber(): string | null {
  return getServerEnv().WHATSAPP_NUMBER ?? null;
}
