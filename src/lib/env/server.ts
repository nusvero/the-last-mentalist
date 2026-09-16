import "server-only";
import { z } from "zod";

// Env kosong ("KEY=") diperlakukan sebagai "tidak diisi".
const optionalString = z.preprocess(
  (v) => (v === "" ? undefined : v),
    z.string().min(1).optional(),
    );

    const serverEnvSchema = z.object({
      NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
        NEXT_PUBLIC_SITE_URL: z.string().url(),

          // Wajib sejak Fase A3
            NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
              NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
                SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

                  // Opsional sampai fasenya aktif; adapter akan menolak jalan jika kosong
                    MIDTRANS_SERVER_KEY: optionalString,
                      MIDTRANS_IS_PRODUCTION: z
                          .enum(["true", "false"])
                              .default("false")
                                  .transform((v) => v === "true"),
                                    RAJAONGKIR_API_KEY: optionalString,
                                      RAJAONGKIR_ORIGIN_ID: optionalString,
                                        WHATSAPP_NUMBER: z.preprocess(
                                            (v) => (v === "" ? undefined : v),
                                                z
                                                      .string()
                                                            .regex(/^62\d{8,13}$/, "Format harus 62xxxxxxxxxx")
                                                                  .optional(),
                                                                    ),
                                                                    });

                                                                    export type ServerEnv = z.infer<typeof serverEnvSchema>;

                                                                    let cached: ServerEnv | undefined;

                                                                    /** Membaca & memvalidasi env server. Hanya boleh dipanggil di server. */
                                                                    export function getServerEnv(): ServerEnv {
                                                                      if (cached) return cached;

                                                                        const parsed = serverEnvSchema.safeParse(process.env);
                                                                          if (!parsed.success) {
                                                                              // Hanya nama variabel yang ditampilkan, NILAI tidak pernah dicetak.
                                                                                  const issues = parsed.error.issues
                                                                                        .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
                                                                                              .join("\n");
                                                                                                  throw new Error(`Konfigurasi environment server tidak valid:\n${issues}`);
                                                                                                    }

                                                                                                      cached = parsed.data;
                                                                                                        return cached;
                                                                                                        }