import Link from "next/link";
import { Receipt, ClipboardList, Scissors, Settings as SettingsIcon } from "lucide-react";
import { getSession } from "@/lib/auth";
import { allowedNav } from "@/lib/adminNav";
import Card from "@/components/ui/Card";

/**
 * Dashboard landing. For now it welcomes the user and offers quick access to
 * the sections they can reach. Live metrics (sales, pending orders) get wired
 * in during the Summary/Billing phase.
 */
const QUICK = [
  { key: "billing", href: "/admin/billing", label: "New sale", desc: "Open the billing counter", Icon: Receipt },
  { key: "orders", href: "/admin/orders", label: "Orders & bookings", desc: "Review and update statuses", Icon: ClipboardList },
  { key: "services", href: "/admin/services", label: "Catalogue", desc: "Products, services, packages", Icon: Scissors },
  { key: "settings", href: "/admin/settings", label: "Salon settings", desc: "Info & integrations", Icon: SettingsIcon },
];

export default function DashboardPage() {
  const session = getSession();
  const user = { role: session?.role, pageAccess: session?.pageAccess };
  const allowedKeys = new Set(allowedNav(user).map((i) => i.key));
  const cards = QUICK.filter((c) => allowedKeys.has(c.key));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString("en-LK", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h2 className="font-display text-2xl text-gray-900">
          Hello, {session?.username} 👋
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ key, href, label, desc, Icon }) => (
          <Link key={key} href={href}>
            <Card className="h-full p-5 transition-shadow hover:shadow-md">
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </span>
              <p className="font-medium text-gray-900">{label}</p>
              <p className="mt-0.5 text-sm text-gray-500">{desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
