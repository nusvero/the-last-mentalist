"use client";

import { useState, useTransition } from "react";

import type { AdminActionResult } from "@/lib/adminActionResult";

export function ActiveToggleButton({
  isActive,
  onToggle,
}: {
  isActive: boolean;
  onToggle: (next: boolean) => Promise<AdminActionResult>;
}) {
  const [active, setActive] = useState(isActive);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const next = !active;
    setError(null);
    startTransition(async () => {
      const result = await onToggle(next);
      if (result.status === "error") {
        setError(result.message ?? "Gagal mengubah status.");
        return;
      }
      setActive(next);
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`rounded-full px-3 py-1 text-caption font-semibold disabled:opacity-60 ${
          active ? "bg-mystic text-obsidian" : "border border-border-dark text-muted"
        }`}
      >
        {pending ? "..." : active ? "Aktif" : "Nonaktif"}
      </button>
      {error && <span className="text-caption text-ritual">{error}</span>}
    </span>
  );
}
