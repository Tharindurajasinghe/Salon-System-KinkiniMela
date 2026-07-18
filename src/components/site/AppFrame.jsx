"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

/**
 * Wraps customer pages with the navbar + footer. The admin area (which has its
 * own AdminShell) and the login page render bare, with no customer chrome.
 */
export default function AppFrame({ children }) {
  const pathname = usePathname();
  const bare = pathname.startsWith("/admin") || pathname.startsWith("/login");

  if (bare) return children;

  return (
    <>
      <Navbar />
      <div className="min-h-[70vh]">{children}</div>
      <Footer />
    </>
  );
}
