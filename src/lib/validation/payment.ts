import { z } from "zod";

export const MAX_PROOF_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ACCEPTED_PROOF_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const uploadPaymentProofSchema = z.object({
  orderId: z.string().uuid(),
  channelId: z.string().uuid(),
  amount: z.number().positive("Nominal harus lebih dari 0."),
  senderName: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
});

export const reviewPaymentProofSchema = z.object({
  proofId: z.string().uuid(),
});

export const rejectPaymentProofSchema = z.object({
  proofId: z.string().uuid(),
  rejectionReason: z.string().trim().min(1, "Alasan penolakan wajib diisi.").max(500),
});
