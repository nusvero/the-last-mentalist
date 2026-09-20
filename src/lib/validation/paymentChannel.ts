import { z } from "zod";

export const paymentChannelSchema = z
  .object({
    type: z.enum(["BANK_TRANSFER", "EWALLET", "QRIS"]),
    name: z.string().trim().min(1, "Nama wajib diisi.").max(80),
    accountHolder: z.string().trim().max(120).optional(),
    accountNumber: z.string().trim().max(50).optional(),
    instructions: z.string().trim().max(500).optional(),
    isActive: z.boolean(),
  })
  .refine((data) => data.type === "QRIS" || !!data.accountNumber, {
    message: "Nomor rekening/akun wajib diisi untuk transfer bank atau e-wallet.",
    path: ["accountNumber"],
  });
