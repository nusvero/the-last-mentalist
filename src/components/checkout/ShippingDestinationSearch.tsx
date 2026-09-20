"use client";

import { useEffect, useState } from "react";

import { searchShippingDestinationAction } from "@/actions/shipping";
import type { ShippingDestination } from "@/lib/shipping/rajaongkir";

const inputClass =
  "w-full rounded-md border border-border-dark bg-charcoal px-4 py-3 text-body text-ivory " +
  "placeholder:text-muted focus:border-gold focus:outline-none";

export function ShippingDestinationSearch({
  onSelect,
}: {
  onSelect: (destination: ShippingDestination) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [results, setResults] = useState<ShippingDestination[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Turunan, bukan state terpisah: kalau sudah dipilih atau ketikan masih
  // pendek, tidak ada hasil yang relevan untuk ditampilkan -- tidak perlu
  // efek untuk mereset "results" tiap kali kondisi ini berubah.
  const shouldSearch = !selectedLabel && query.trim().length >= 3;

  useEffect(() => {
    if (!shouldSearch) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      searchShippingDestinationAction(query).then((result) => {
        if (cancelled) return;
        setLoading(false);
        if (result.status === "error") {
          setError(result.message);
          setResults([]);
          return;
        }
        setError(null);
        setResults(result.data);
      });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, shouldSearch]);

  function handleSelect(destination: ShippingDestination) {
    setSelectedLabel(destination.label);
    setQuery(destination.label);
    onSelect(destination);
  }

  const visibleResults = shouldSearch ? results : [];

  return (
    <div className="relative space-y-1.5">
      <label htmlFor="destination-search" className="text-body-sm text-muted">
        Cari kelurahan/kecamatan tujuan
      </label>
      <input
        id="destination-search"
        type="text"
        value={query}
        onChange={(e) => {
          setSelectedLabel(null);
          setQuery(e.target.value);
        }}
        placeholder="Contoh: Kebayoran Baru"
        className={inputClass}
        autoComplete="off"
      />
      {shouldSearch && loading && <p className="text-body-sm text-muted">Mencari...</p>}
      {shouldSearch && error && <p className="text-body-sm text-ritual">{error}</p>}
      {visibleResults.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border-dark bg-charcoal shadow-lg">
          {visibleResults.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => handleSelect(d)}
                className="w-full px-4 py-2 text-left text-body-sm text-ivory hover:bg-raised"
              >
                {d.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
