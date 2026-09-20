"use client";

import { useActionState, useState } from "react";

import { updateOrderStatusAction } from "@/actions/adminOrders";
import { ADMIN_ACTION_IDLE } from "@/lib/adminActionResult";
import { ORDER_STATUS_LABEL } from "@/lib/orders/labels";
import type { OrderDetail } from "@/lib/orders/queries";
import { ORDER_STATUS_VALUES } from "@/lib/validation/order";

const inputClass =
  "w-full rounded-md border border-border-dark bg-obsidian px-4 py-3 text-body text-ivory " +
  "placeholder:text-muted focus:border-gold focus:outline-none";

export function OrderStatusForm({ order }: { order: OrderDetail }) {
  const action = updateOrderStatusAction.bind(null, order.id);
  const [state, formAction, pending] = useActionState(action, ADMIN_ACTION_IDLE);

  const [status, setStatus] = useState(order.status);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="status" className="text-body-sm text-muted">
          Status Pesanan
        </label>
        <select
          id="status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className={inputClass}
        >
          {ORDER_STATUS_VALUES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="shippingCourier" className="text-body-sm text-muted">
            Kurir
          </label>
          <input
            id="shippingCourier"
            name="shippingCourier"
            defaultValue={order.shippingCourier ?? ""}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="shippingTrackingNumber" className="text-body-sm text-muted">
            No. Resi
          </label>
          <input
            id="shippingTrackingNumber"
            name="shippingTrackingNumber"
            defaultValue={order.shippingTrackingNumber ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      {status === "CANCELLED" && (
        <div className="space-y-1.5">
          <label htmlFor="cancelledReason" className="text-body-sm text-muted">
            Alasan Pembatalan
          </label>
          <textarea
            id="cancelledReason"
            name="cancelledReason"
            rows={2}
            required
            className={inputClass}
          />
        </div>
      )}

      {state.status === "error" && (
        <p className="text-body-sm text-ritual">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="text-body-sm text-mystic">Status pesanan diperbarui.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gold px-5 py-2 font-semibold text-obsidian disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Perbarui Status"}
      </button>
    </form>
  );
}
