import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getClientEnv } from "@/lib/env/client";
import type { Database } from "@/types/database";

/**
 * Klien Supabase di server yang bertindak SEBAGAI user yang sedang login.
  * Semua query tetap tunduk pada RLS.
   */
   export async function createSupabaseServerClient() {
     const cookieStore = await cookies();
       const env = getClientEnv();

         return createServerClient<Database>(
             env.NEXT_PUBLIC_SUPABASE_URL,
                 env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
                     {
                           cookies: {
                                   getAll() {
                                             return cookieStore.getAll();
                                                     },
                                                             setAll(cookiesToSet) {
                                                                       try {
                                                                                   cookiesToSet.forEach(({ name, value, options }) => {
                                                                                                 cookieStore.set(name, value, options);
                                                                                                             });
                                                                                                                       } catch {
                                                                                                                                   // Dipanggil dari Server Component (tidak boleh set cookie).
                                                                                                                                               // Aman diabaikan karena proxy yang memperbarui sesi.
                                                                                                                                                         }
                                                                                                                                                                 },
                                                                                                                                                                       },
                                                                                                                                                                           },
                                                                                                                                                                             );
                                                                                                                                                                             }