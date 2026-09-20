"use client";

import { useActionState, useEffect, useState } from "react";

import { createCategoryAction, updateCategoryAction } from "@/actions/adminCategories";
import { ADMIN_ACTION_IDLE } from "@/lib/adminActionResult";
import type { AdminCategory } from "@/lib/catalog/adminQueries";

const inputClass =
  "w-full rounded-md border border-border-dark bg-obsidian px-3 py-2 text-body-sm text-ivory " +
  "placeholder:text-muted focus:border-gold focus:outline-none";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function CategoryForm({
  category,
  onSaved,
}: {
  category?: AdminCategory;
  onSaved?: () => void;
}) {
  const action = category
    ? updateCategoryAction.bind(null, category.id)
    : createCategoryAction;
  const [state, formAction, pending] = useActionState(action, ADMIN_ACTION_IDLE);

  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category));

  useEffect(() => {
    if (state.status !== "success" || category) return;
    // Ditunda lewat microtask: mengosongkan form adalah reaksi ke hasil
    // action yang sudah selesai, bukan sinkronisasi langsung dgn render ini.
    queueMicrotask(() => {
      setName("");
      setSlug("");
      setSlugTouched(false);
      onSaved?.();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hanya reaksi ke perubahan status, bukan tiap render
  }, [state.status]);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="min-w-[10rem] flex-1 space-y-1">
        <label className="text-caption text-muted">Nama</label>
        <input
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
      <div className="min-w-[10rem] flex-1 space-y-1">
        <label className="text-caption text-muted">Slug</label>
        <input
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
      <div className="min-w-[12rem] flex-1 space-y-1">
        <label className="text-caption text-muted">Deskripsi (opsional)</label>
        <input
          name="description"
          defaultValue={category?.description ?? ""}
          className={inputClass}
        />
      </div>
      <label className="flex items-center gap-2 pb-2 text-body-sm text-ivory">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={category?.is_active ?? true}
        />
        Aktif
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gold px-4 py-2 text-body-sm font-semibold text-obsidian disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
      {state.status === "error" && (
        <p className="w-full text-body-sm text-ritual">{state.message}</p>
      )}
    </form>
  );
}
