"use client";

import { useRef, useState, useTransition } from "react";

import { addProductImageAction, deleteProductImageAction } from "@/actions/adminProducts";

export function ProductImageManager({
  productId,
  images,
}: {
  productId: string;
  images: { id: string; url: string; altText: string | null }[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addProductImageAction(productId, formData);
      if (result.status === "error") {
        setError(result.message ?? "Gagal mengupload gambar.");
        return;
      }
      formRef.current?.reset();
    });
  }

  function handleDelete(imageId: string) {
    startTransition(async () => {
      await deleteProductImageAction(imageId, productId);
    });
  }

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- URL publik dari Supabase Storage. */}
              <img
                src={img.url}
                alt={img.altText ?? ""}
                className="aspect-square rounded-md border border-border-dark object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                disabled={pending}
                className="absolute top-1 right-1 rounded-full bg-crimson-dark px-2 py-0.5 text-caption text-ivory disabled:opacity-60"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleUpload}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="space-y-1.5">
          <label htmlFor="file" className="text-body-sm text-muted">
            Tambah gambar
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
            className="text-body-sm text-ivory"
          />
        </div>
        <input
          name="altText"
          placeholder="Teks alternatif (opsional)"
          className="rounded-md border border-border-dark bg-obsidian px-3 py-2 text-body-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gold px-4 py-2 text-body-sm font-semibold text-obsidian disabled:opacity-60"
        >
          {pending ? "Mengupload..." : "Upload"}
        </button>
      </form>

      {error && <p className="text-body-sm text-ritual">{error}</p>}
    </div>
  );
}
