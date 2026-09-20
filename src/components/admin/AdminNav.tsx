import Link from "next/link";

export function AdminNav({
  isCatalogManager,
  isOrderStaff,
  isAdmin,
}: {
  isCatalogManager: boolean;
  isOrderStaff: boolean;
  isAdmin: boolean;
}) {
  return (
    <nav className="border-b border-border-dark bg-charcoal">
      <div className="mx-auto flex max-w-6xl flex-wrap gap-5 px-5 py-3 text-body-sm sm:px-8">
        <Link href="/admin" className="text-ivory hover:text-gold">
          Dashboard
        </Link>
        {isCatalogManager && (
          <>
            <Link href="/admin/produk" className="text-ivory hover:text-gold">
              Produk
            </Link>
            <Link href="/admin/kategori" className="text-ivory hover:text-gold">
              Kategori
            </Link>
          </>
        )}
        {isOrderStaff && (
          <Link href="/admin/pesanan" className="text-ivory hover:text-gold">
            Pesanan
          </Link>
        )}
        {isAdmin && (
          <>
            <Link href="/admin/pembayaran" className="text-ivory hover:text-gold">
              Konfirmasi Bayar
            </Link>
            <Link href="/admin/channel-pembayaran" className="text-ivory hover:text-gold">
              Channel Pembayaran
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
