"use client";

import { useState } from "react";

import { togglePaymentChannelActiveAction } from "@/actions/adminPaymentChannels";
import { ActiveToggleButton } from "@/components/admin/ActiveToggleButton";
import { PaymentChannelForm } from "@/components/admin/PaymentChannelForm";
import type { AdminPaymentChannel } from "@/lib/payment/adminQueries";

const TYPE_LABEL: Record<AdminPaymentChannel["type"], string> = {
  BANK_TRANSFER: "Transfer Bank",
  EWALLET: "E-Wallet",
  QRIS: "QRIS",
};

export function PaymentChannelListItem({ channel }: { channel: AdminPaymentChannel }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="px-2 py-4">
        <PaymentChannelForm channel={channel} />
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
        <p className="text-body text-ivory">{channel.name}</p>
        <p className="text-body-sm text-muted">
          {TYPE_LABEL[channel.type]}
          {channel.account_number && ` · ${channel.account_number}`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <ActiveToggleButton
          isActive={channel.is_active}
          onToggle={(next) => togglePaymentChannelActiveAction(channel.id, next)}
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
