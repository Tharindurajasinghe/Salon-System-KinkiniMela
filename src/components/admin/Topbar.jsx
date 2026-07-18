"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, LogOut, ChevronDown } from "lucide-react";
import { api } from "@/lib/utils/apiClient";
import { NAV_ITEMS } from "@/lib/adminNav";

// Best-match page title from the current path (longest matching href wins).
function titleFromPath(pathname) {
  const match = [...NAV_ITEMS]
    .filter((i) => (i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label || "Admin";
}

/**
 * Top bar for the admin area: mobile menu button, current page title, and a
 * user menu with logout. (Admin/cashier area has a top bar but NO footer.)
 */
export default function Topbar({ user, onMenu }) {
  const router = useRouter();
  const pathname = usePathname();
  const title = titleFromPath(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await api.post("/api/auth/logout", {});
      router.replace("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-100 bg-white/80 px-4 backdrop-blur lg:px-6">
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="font-display text-xl text-gray-900">{title}</h1>

      <div className="relative ml-auto">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-600">
            {user?.username?.[0]?.toUpperCase()}
          </span>
          <span className="hidden text-sm font-medium text-gray-700 sm:block">
            {user?.username}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
              <div className="px-4 py-2 text-xs text-gray-400">
                Signed in as <span className="font-medium text-gray-600">{user?.role}</span>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
