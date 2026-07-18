"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

/**
 * Client shell for the whole admin area. The server layout passes the verified
 * user + salon identity; this component owns the mobile drawer state and frames
 * every admin page with the sidebar and top bar.
 */
export default function AdminShell({ user, salonName, logoUrl, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        user={user}
        salonName={salonName}
        logoUrl={logoUrl}
        open={open}
        onClose={() => setOpen(false)}
      />

      <div className="lg:pl-64">
        <Topbar user={user} onMenu={() => setOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
