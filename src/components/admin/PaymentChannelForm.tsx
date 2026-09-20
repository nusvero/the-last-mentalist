"use client";

import { useActionState, useEffect, useState } from "react";

import {
  createPaymentChannelAction,
  updatePaymentChannelAction,
} from "@/actions/adminPaymentChannels";
import { ADMIN_ACTION_IDLE } from "@/lib/adminActionResult";
import type { AdminPaymentChannel } from "@/lib/payment/adminQueries";

const inputClass =
  "w-full rounded-md border border-border-dark bg-obsidian px-3 py-2 text-body-sm text-ivory " +
  "placeholder:text-muted focus:border-gold focus:outline-none";

export function PaymentChannelForm({
  channel,
  onSaved,
}: {
  channel?: AdminPaymentChannel;
  onSaved?: () => void;
}) {
  const action = channel
    ? updatePaymentChannelAction.bind(null, channel.id, channel.qris_image_url)
    : createPaymentChannelAction;
  const [state, formAction, pending] = useActionState(action, ADMIN_ACTION_IDLE);

  const [type, setType] = useState(channel?.type ?? "BANK_TRANSFER");

  useEffect(() => {
    if (state.status === "success" && !channel) onSaved?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-caption text-muted">Jenis</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className={inputClass}
          >
            <option value="BANK_TRANSFER">Transfer Bank</option>
            <option value="EWALLET">E-Wallet</option>
            <option value="QRIS">QRIS</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-caption text-muted">Nama (mis. BCA, GoPay)</label>
          <input
            name="name"
            required
            defaultValue={channel?.name ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      {type === "QRIS" ? (
        <div className="space-y-1">
          <label className="text-caption text-muted">
            Gambar QRIS
            {channel?.qris_image_url ? " (kosongkan untuk pakai yang lama)" : ""}
          </label>
          <input
            name="qrisImage"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="text-body-sm text-ivory"
          />
          {channel?.qris_image_url && (
            // eslint-disable-next-line @next/next/no-img-element -- pratinjau QRIS yang sudah tersimpan.
            <img
              src={channel.qris_image_url}
              alt="QRIS saat ini"
              className="mt-2 h-24 w-24 rounded-md border border-border-dark object-contain"
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-caption text-muted">Atas Nama</label>
            <input
              name="accountHolder"
              defaultValue={channel?.account_holder ?? ""}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className="text-caption text-muted">Nomor Rekening/Akun</label>
            <input
              name="accountNumber"
              required
              defaultValue={channel?.account_number ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-caption text-muted">Instruksi tambahan (opsional)</label>
        <input
          name="instructions"
          defaultValue={channel?.instructions ?? ""}
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-body-sm text-ivory">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={channel?.is_active ?? true}
        />
        Aktif
      </label>

      {state.status === "error" && (
        <p className="text-body-sm text-ritual">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="text-body-sm text-mystic">Channel tersimpan.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gold px-4 py-2 text-body-sm font-semibold text-obsidian disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
