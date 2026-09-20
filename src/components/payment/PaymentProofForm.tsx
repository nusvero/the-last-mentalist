"use client";

import { useRef, useState, useTransition } from "react";

import { uploadPaymentProofAction } from "@/actions/payment";
import { formatRupiah } from "@/lib/format";
import type { PaymentChannel } from "@/lib/payment/queries";

const inputClass =
  "w-full rounded-md border border-border-dark bg-charcoal px-4 py-3 text-body text-ivory " +
  "placeholder:text-muted focus:border-gold focus:outline-none";

const CHANNEL_TYPE_LABEL: Record<PaymentChannel["type"], string> = {
  BANK_TRANSFER: "Transfer Bank",
  EWALLET: "E-Wallet",
  QRIS: "QRIS",
};

function channelDetail(channel: PaymentChannel): string {
  if (channel.type === "QRIS") return "Scan kode QRIS di bawah";
  return `${channel.account_holder ?? ""} - ${channel.account_number ?? ""}`;
}

export function PaymentProofForm({
  orderId,
  orderNumber,
  orderTotal,
  channels,
  whatsappNumber,
}: {
  orderId: string;
  orderNumber: string;
  orderTotal: string;
  channels: PaymentChannel[];
  whatsappNumber: string | null;
}) {
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel | null>(
    channels[0] ?? null,
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await uploadPaymentProofAction(formData);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setSuccess(true);
    });
  }

  if (channels.length === 0) {
    return (
      <p className="text-body-sm text-muted">
        Belum ada metode pembayaran yang aktif. Hubungi admin toko.
      </p>
    );
  }

  if (success) {
    const message = `Halo, saya sudah upload bukti pembayaran untuk pesanan ${orderNumber} sebesar ${formatRupiah(
      orderTotal,
    )}. Mohon dicek. Terima kasih.`;
    const waLink = whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
      : null;

    return (
      <div className="space-y-3 rounded-md border border-mystic bg-mystic/10 px-4 py-4">
        <p className="text-body text-ivory">
          Bukti bayar berhasil dikirim. Admin akan memeriksa dan mengonfirmasi pesananmu.
        </p>
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-mystic px-5 py-3 font-semibold text-obsidian"
          >
            Konfirmasi lewat WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="orderNumber" value={orderNumber} />

      <div className="space-y-2">
        <p className="text-body-sm text-muted">Pilih metode pembayaran</p>
        {channels.map((channel) => (
          <label
            key={channel.id}
            className={`block cursor-pointer rounded-md border px-4 py-3 ${
              selectedChannel?.id === channel.id
                ? "border-gold bg-raised"
                : "border-border-dark"
            }`}
          >
            <input
              type="radio"
              name="channelId"
              value={channel.id}
              checked={selectedChannel?.id === channel.id}
              onChange={() => setSelectedChannel(channel)}
              className="sr-only"
            />
            <p className="text-body-sm text-ivory">
              {CHANNEL_TYPE_LABEL[channel.type]} - {channel.name}
            </p>
            <p className="text-body-sm text-muted">{channelDetail(channel)}</p>
          </label>
        ))}
      </div>

      {selectedChannel?.type === "QRIS" && selectedChannel.qris_image_url && (
        // eslint-disable-next-line @next/next/no-img-element -- gambar QRIS dari URL yang diisi admin, domainnya bisa apa saja.
        <img
          src={selectedChannel.qris_image_url}
          alt={`QRIS ${selectedChannel.name}`}
          className="mx-auto h-56 w-56 rounded-md border border-border-dark object-contain"
        />
      )}

      {selectedChannel?.instructions && (
        <p className="text-body-sm text-muted">{selectedChannel.instructions}</p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="amount" className="text-body-sm text-muted">
          Nominal yang ditransfer
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="1"
          min="1"
          required
          defaultValue={orderTotal}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="senderName" className="text-body-sm text-muted">
          Nama pengirim (kalau beda dengan nama akun)
        </label>
        <input id="senderName" name="senderName" type="text" className={inputClass} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="file" className="text-body-sm text-muted">
          Screenshot bukti transfer
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="note" className="text-body-sm text-muted">
          Catatan (opsional)
        </label>
        <textarea id="note" name="note" rows={2} className={inputClass} />
      </div>

      {error && <p className="text-body-sm text-ritual">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-gold px-5 py-3 font-semibold text-obsidian disabled:opacity-60"
      >
        {pending ? "Mengirim..." : "Kirim Bukti Bayar"}
      </button>
    </form>
  );
}
