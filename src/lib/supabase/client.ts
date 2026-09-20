import { createBrowserClient } from "@supabase/ssr";

import { getClientEnv } from "@/lib/env/client";
import type { Database } from "@/types/database";

/** Klien Supabase untuk Client Component. Hanya memakai publishable key. */
export function createSupabaseBrowserClient() {
  const env = getClientEnv();

  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
