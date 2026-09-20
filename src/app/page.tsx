// HALAMAN SEMENTARA — cek design tokens (Fase A1).
// Akan diganti homepage asli di fase berikutnya.

const swatches = [
  { name: "Obsidian", className: "bg-obsidian", hex: "#070707" },
  { name: "Deep", className: "bg-deep", hex: "#0B0B0B" },
  { name: "Charcoal", className: "bg-charcoal", hex: "#131313" },
  { name: "Raised", className: "bg-raised", hex: "#191817" },
  { name: "Border Dark", className: "bg-border-dark", hex: "#2B2925" },
  { name: "Ivory", className: "bg-ivory", hex: "#E8DECA" },
  { name: "Muted", className: "bg-muted", hex: "#A69E91" },
  { name: "Gold", className: "bg-gold", hex: "#C6A15B" },
  { name: "Pale Gold", className: "bg-gold-pale", hex: "#D8C08A" },
  { name: "Blood Crimson", className: "bg-crimson", hex: "#9E1825" },
  { name: "Ritual Red", className: "bg-ritual", hex: "#C32936" },
  { name: "Dark Crimson", className: "bg-crimson-dark", hex: "#571018" },
  { name: "Mystic Green", className: "bg-mystic", hex: "#4F9B58" },
  { name: "Toxic Glow", className: "bg-toxic", hex: "#74D66A" },
] as const;

export default function TokenPreviewPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
      <p className="font-display text-eyebrow tracking-arcane text-gold">
        GAMES WORTH GATHERING FOR
      </p>
      <h1 className="mt-4 font-display text-display-xl tracking-stage text-ivory">
        PARLOR GAME CO.
      </h1>
      <p className="mt-6 max-w-prose text-body-lg text-muted">
        Board games, party games, and everything in between. Ini halaman cek design token,
        bukan homepage final.
      </p>

      <section aria-labelledby="type-heading" className="mt-16 space-y-4">
        <h2 id="type-heading" className="font-display text-h2 text-gold-pale">
          Skala tipografi
        </h2>
        <p className="font-display text-display-lg">Display LG</p>
        <p className="font-display text-h1">Heading 1</p>
        <p className="font-display text-h2">Heading 2</p>
        <p className="font-display text-h3">Heading 3</p>
        <p className="text-body-lg">Body large — teks pembuka yang nyaman dibaca.</p>
        <p className="text-body">Body — Masukkan alamat pengiriman.</p>
        <p className="text-body-sm text-muted">Body small — info pendukung.</p>
        <p className="text-caption text-muted">Caption — keterangan gambar.</p>
      </section>

      <section aria-labelledby="color-heading" className="mt-16">
        <h2 id="color-heading" className="font-display text-h2 text-gold-pale">
          Palet warna
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {swatches.map((s) => (
            <li
              key={s.name}
              className="overflow-hidden rounded-card border border-border-dark bg-charcoal"
            >
              <div className={`h-20 ${s.className}`} aria-hidden="true" />
              <div className="px-3 py-2">
                <p className="text-body-sm text-ivory">{s.name}</p>
                <p className="text-caption text-muted">{s.hex}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="focus-heading" className="mt-16">
        <h2 id="focus-heading" className="font-display text-h2 text-gold-pale">
          Tes fokus keyboard
        </h2>
        <div className="mt-6 flex flex-wrap gap-4">
          <button
            type="button"
            className="rounded-md bg-gold px-5 py-3 font-semibold text-obsidian"
          >
            Masukkan ke Keranjang
          </button>
          <button
            type="button"
            className="rounded-md border border-gold px-5 py-3 font-semibold text-gold"
          >
            Lihat Kartu
          </button>
        </div>
      </section>
    </main>
  );
}
