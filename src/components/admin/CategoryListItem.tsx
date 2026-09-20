"use client";

import { useState } from "react";

import { toggleCategoryActiveAction } from "@/actions/adminCategories";
import { ActiveToggleButton } from "@/components/admin/ActiveToggleButton";
import { CategoryForm } from "@/components/admin/CategoryForm";
import type { AdminCategory } from "@/lib/catalog/adminQueries";

export function CategoryListItem({ category }: { category: AdminCategory }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="px-2 py-4">
        <CategoryForm category={category} />
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="mt-2 text-body-sm text-muted"
        >
          Tutup
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 px-2 py-4">
      <div>
        <p className="text-body text-ivory">{category.name}</p>
        <p className="text-body-sm text-muted">/{category.slug}</p>
      </div>
      <div className="flex items-center gap-3">
        <ActiveToggleButton
          isActive={category.is_active}
          onToggle={(next) => toggleCategoryActiveAction(category.id, next)}
        />
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-body-sm text-gold-pale"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
