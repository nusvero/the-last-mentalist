import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/AdminNav";
import {
  getCurrentUserRoles,
  isCurrentUserAdmin,
  isCurrentUserCatalogManager,
  isCurrentUserOrderStaff,
} from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const roles = await getCurrentUserRoles();
  const isStaff = roles.some(
    (r) => r === "EDITOR" || r === "ADMIN" || r === "SUPER_ADMIN" || r === "FULFILLMENT",
  );
  if (!isStaff) redirect("/");

  const [isCatalogManager, isOrderStaff, isAdmin] = await Promise.all([
    isCurrentUserCatalogManager(),
    isCurrentUserOrderStaff(),
    isCurrentUserAdmin(),
  ]);

  return (
    <div>
      <AdminNav
        isCatalogManager={isCatalogManager}
        isOrderStaff={isOrderStaff}
        isAdmin={isAdmin}
      />
      {children}
    </div>
  );
}
