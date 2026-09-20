import { z } from "zod";

export const ORDER_STATUS_VALUES = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;

export const updateOrderStatusSchema = z
  .object({
    orderId: z.string().uuid(),
    status: z.enum(ORDER_STATUS_VALUES),
    shippingCourier: z.string().trim().max(50).optional(),
    shippingTrackingNumber: z.string().trim().max(100).optional(),
    cancelledReason: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.status !== "CANCELLED" || !!data.cancelledReason, {
    message: "Alasan pembatalan wajib diisi.",
    path: ["cancelledReason"],
  });
