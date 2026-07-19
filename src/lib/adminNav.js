/**
 * Admin/cashier navigation config — the single source of truth for which
 * pages exist and who may see them. The sidebar, the access checkboxes on the
 * Staff page, and the server-side guard all read from here so they never drift.
 *
 * `key` also doubles as the pageAccess permission key stored on each user.
 */
export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { key: "billing", label: "Billing", href: "/admin/billing", icon: "Receipt" },
  { key: "orders", label: "Orders", href: "/admin/orders", icon: "ClipboardList" },
  { key: "summary", label: "Summary", href: "/admin/summary", icon: "BarChart3" },
  { key: "categories", label: "Categories", href: "/admin/categories", icon: "Tags" },
  { key: "services", label: "Our Services", href: "/admin/services", icon: "Scissors" },
  { key: "calendar", label: "Calendar", href: "/admin/calendar", icon: "CalendarDays" },
  { key: "staff", label: "Staff", href: "/admin/staff", icon: "Users" },
  { key: "customers", label: "Customers", href: "/admin/customers", icon: "UserRound" },
  { key: "gallery", label: "Gallery", href: "/admin/gallery", icon: "Images" },
  { key: "invoices", label: "Invoices", href: "/admin/invoices", icon: "FileText" },
  { key: "settings", label: "Settings", href: "/admin/settings", icon: "Settings" },
];

// Pages a cashier can ALWAYS access. Admin can grant more via user.pageAccess.
export const DEFAULT_CASHIER_PAGES = ["dashboard", "billing", "orders"];

// Pages only an admin may ever access, regardless of granted permissions.
export const ADMIN_ONLY_PAGES = ["staff", "settings"];

/** Pure predicate (no cookies) — safe to use on client and server. */
export function isAllowed(user, key) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (ADMIN_ONLY_PAGES.includes(key)) return false;
  const allowed = new Set([...DEFAULT_CASHIER_PAGES, ...(user.pageAccess || [])]);
  return allowed.has(key);
}

/** The nav items a given user is allowed to see. */
export function allowedNav(user) {
  return NAV_ITEMS.filter((item) => isAllowed(user, item.key));
}
