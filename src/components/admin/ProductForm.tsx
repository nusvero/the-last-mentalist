"use client";

import { useActionState, useState } from "react";

import { createProductAction, updateProductAction } from "@/actions/adminProducts";
import { ADMIN_ACTION_IDLE } from "@/lib/adminActionResult";
import type { AdminProductDetail } from "@/lib/catalog/adminQueries";

const inputClass =
  "w-full rounded-md border border-border-dark bg-obsidian px-4 py-3 text-body text-ivory " +
  "placeholder:text-muted focus:border-gold focus:outline-none";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function ProductForm({
  categories,
  product,
}: {
  categories: { id: string; name: string }[];
  product?: AdminProductDetail;
}) {
  const action = product
    ? updateProductAction.bind(null, product.id)
    : createProductAction;
  const [state, formAction, pending] = useActionState(action, ADMIN_ACTION_IDLE);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [fulfillmentType, setFulfillmentType] = useState(
    product?.fulfillmentType ?? "PHYSICAL",
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-body-sm text-muted">
          Nama produk
        </label>
        <input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="slug" className="text-body-sm text-muted">
          Slug (untuk URL)
        </label>
        <input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="categoryId" className="text-body-sm text-muted">
            Kategori
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={product?.categoryId ?? ""}
            className={inputClass}
          >
            <option value="">Tanpa kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="fulfillmentType" className="text-body-sm text-muted">
            Jenis produk
          </label>
          <select
            id="fulfillmentType"
            name="fulfillmentType"
            value={fulfillmentType}
            onChange={(e) => setFulfillmentType(e.target.value as "PHYSICAL" | "DIGITAL")}
            className={inputClass}
          >
            <option value="PHYSICAL">Fisik (butuh ongkir)</option>
            <option value="DIGITAL">Digital (tanpa ongkir)</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="shortDescription" className="text-body-sm text-muted">
          Deskripsi singkat
        </label>
        <input
          id="shortDescription"
          name="shortDescription"
          defaultValue={product?.shortDescription ?? ""}
          maxLength={300}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-body-sm text-muted">
          Deskripsi lengkap
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={product?.description ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="price" className="text-body-sm text-muted">
            Harga (Rp)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={product?.price ?? ""}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="compareAtPrice" className="text-body-sm text-muted">
            Harga coret (opsional)
          </label>
          <input
            id="compareAtPrice"
            name="compareAtPrice"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.compareAtPrice ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="sku" className="text-body-sm text-muted">
            SKU (opsional)
          </label>
          <input
            id="sku"
            name="sku"
            defaultValue={product?.sku ?? ""}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="stockQuantity" className="text-body-sm text-muted">
            Stok (kosongkan = tak terbatas)
          </label>
          <input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.stockQuantity ?? ""}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="weightGrams" className="text-body-sm text-muted">
            Berat (gram){fulfillmentType === "PHYSICAL" && " *"}
          </label>
          <input
            id="weightGrams"
            name="weightGrams"
            type="number"
            min="1"
            step="1"
            required={fulfillmentType === "PHYSICAL"}
            defaultValue={product?.weightGrams ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-body-sm text-ivory">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={product?.isActive ?? true}
            className="h-4 w-4"
          />
          Aktif (tampil di etalase)
        </label>
        <label className="flex items-center gap-2 text-body-sm text-ivory">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={product?.isFeatured ?? false}
            className="h-4 w-4"
          />
          Unggulan
        </label>
      </div>

      {state.status === "error" && (
        <p className="text-body-sm text-ritual">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="text-body-sm text-mystic">Produk tersimpan.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gold px-6 py-3 font-semibold text-obsidian disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Simpan Produk"}
      </button>
    </form>
  );
}
