import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import AdminShell from "@/components/admin/AdminShell";

/**
 * Server layout for the entire admin/cashier area.
 * Verifies the JWT session (middleware only checks the cookie exists) and
 * frames every page with the sidebar + top bar. No footer here (per spec).
 */
export default async function AdminLayout({ children }) {
  const session = getSession();
  if (!session) redirect("/login");

  const settings = await getSettings();

  const user = {
    username: session.username,
    role: session.role,
    pageAccess: session.pageAccess || [],
  };

  return (
    <AdminShell
      user={user}
      salonName={settings.salonName}
      logoUrl={settings.logo?.url || null}
    >
      {children}
    </AdminShell>
  );
}
