"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addToCartAction } from "@/actions/cart";

export function AddToCartButton({
  productId,
  outOfStock,
}: {
  productId: string;
  outOfStock: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();

  function handleAdd() {
    setFeedback(null);
    startTransition(async () => {
      const result = await addToCartAction(productId, quantity);
      if (result.status === "unauthenticated") {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (result.status === "error") {
        setFeedback(result.message);
        return;
      }
      setFeedback("Ditambahkan ke keranjang.");
    });
  }

  if (outOfStock) {
    return (
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-md border border-border-dark px-5 py-3 font-semibold text-muted"
      >
        Stok Habis
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={1}
          max={99}
          value={quantity}
          onChange={(e) =>
            setQuantity(Math.min(99, Math.max(1, Number(e.target.value) || 1)))
          }
          className="w-20 rounded-md border border-border-dark bg-charcoal px-3 py-3 text-center text-ivory focus:border-gold focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending}
          className="flex-1 rounded-md bg-gold px-5 py-3 font-semibold text-obsidian disabled:opacity-60"
        >
          {pending ? "Menambahkan..." : "Masukkan ke Keranjang"}
        </button>
      </div>
      {feedback && <p className="text-body-sm text-muted">{feedback}</p>}
    </div>
  );
}
