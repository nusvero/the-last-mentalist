"use client";

import { useState, useTransition } from "react";

import { removeCartItemAction, updateCartItemQuantityAction } from "@/actions/cart";
import type { CartLine } from "@/lib/cart/queries";
import { formatRupiah } from "@/lib/format";

export function CartItemRow({ line }: { line: CartLine }) {
  const [quantity, setQuantity] = useState(line.quantity);
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);

  function changeQuantity(next: number) {
    const clamped = Math.min(99, Math.max(1, next));
    setQuantity(clamped);
    startTransition(() => {
      void updateCartItemQuantityAction(line.id, clamped);
    });
  }

  function handleRemove() {
    setRemoved(true);
    startTransition(() => {
      void removeCartItemAction(line.id);
    });
  }

  if (removed) return null;

  const lineTotal = Number(line.unitPrice) * quantity;
  const stockWarning = line.stockQuantity !== null && line.stockQuantity < quantity;

  return (
    <div className="flex items-center gap-4 border-b border-border-dark py-4">
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-border-dark bg-charcoal">
        {line.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- lihat catatan di ProductCard.
          <img
            src={line.imageUrl}
            alt={line.productName}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-body text-ivory">{line.productName}</p>
        {!line.isActive && (
          <p className="text-body-sm text-ritual">Produk ini sudah tidak tersedia lagi</p>
        )}
        {stockWarning && (
          <p className="text-body-sm text-ritual">Stok tersisa {line.stockQuantity}</p>
        )}
        <p className="text-body-sm text-gold-pale">{formatRupiah(line.unitPrice)}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => changeQuantity(quantity - 1)}
          disabled={pending}
          className="h-8 w-8 rounded-md border border-border-dark text-ivory hover:border-gold"
          aria-label="Kurangi jumlah"
        >
          −
        </button>
        <span className="w-8 text-center text-body text-ivory">{quantity}</span>
        <button
          type="button"
          onClick={() => changeQuantity(quantity + 1)}
          disabled={pending}
          className="h-8 w-8 rounded-md border border-border-dark text-ivory hover:border-gold"
          aria-label="Tambah jumlah"
        >
          +
        </button>
      </div>

      <p className="w-28 shrink-0 text-right text-body text-ivory">
        {formatRupiah(lineTotal)}
      </p>

      <button
        type="button"
        onClick={handleRemove}
        disabled={pending}
        className="shrink-0 text-body-sm text-muted hover:text-ritual"
      >
        Hapus
      </button>
    </div>
  );
}
