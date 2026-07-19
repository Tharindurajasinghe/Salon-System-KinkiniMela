"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard, Receipt, ClipboardList, BarChart3, Tags,
  Scissors, CalendarDays, Users, UserRound, Settings, Images, FileText, X,
} from "lucide-react";
import { allowedNav } from "@/lib/adminNav";

// Map the icon names stored in adminNav.js to actual lucide components.
const ICONS = {
  LayoutDashboard, Receipt, ClipboardList, BarChart3, Tags,
  Scissors, CalendarDays, Users, UserRound, Settings, Images, FileText,
};

/**
 * Deep-plum admin sidebar. Shows only the pages this user may access.
 * Fixed on desktop; slides in as a drawer on mobile (controlled by AdminShell).
 */
export default function Sidebar({ user, salonName, logoUrl, open, onClose }) {
  const pathname = usePathname();
  const items = allowedNav(user);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-900 text-brand-50",
          "transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Salon lockup */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-gold-500/60"
            />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gold-500/20 font-display text-lg text-gold-400">
              {salonName?.[0]?.toUpperCase() || "S"}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-lg leading-tight">{salonName}</p>
            <p className="text-xs text-brand-200">Admin panel</p>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-white/10 font-medium text-white"
                    : "text-brand-100 hover:bg-white/5 hover:text-white"
                )}
              >
                {/* left accent bar on the active item */}
                <span
                  className={clsx(
                    "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-gold-500 transition-opacity",
                    active ? "opacity-100" : "opacity-0"
                  )}
                />
                {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-3 text-xs text-brand-200">
          {user?.role === "admin" ? "Administrator" : "Cashier"} · {user?.username}
        </div>
      </aside>
    </>
  );
}
