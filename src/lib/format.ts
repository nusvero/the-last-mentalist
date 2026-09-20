/** Format angka/string numeric(12,2) dari Postgres jadi "Rp 150.000". */
export function formatRupiah(value: string | number): string {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
