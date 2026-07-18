"use client";

import { useState } from "react";
import { Search, Package, CalendarDays } from "lucide-react";
import PageHeader from "@/components/site/PageHeader";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { useLanguage } from "@/context/LanguageProvider";
import { api } from "@/lib/utils/apiClient";
import { formatRs } from "@/lib/utils/currency";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  confirm: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  paid: "bg-blue-100 text-blue-700",
};

export default function BookingsPage() {
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function track() {
    if (!phone.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.get(`/api/track?phone=${encodeURIComponent(phone.trim())}`);
      setResult(data);
    } catch {
      setResult({ orders: [], bookings: [] });
    } finally {
      setLoading(false);
    }
  }

  const statusLabel = (s) => t(`bookings.status.${s}`);
  const empty = searched && result && result.orders.length === 0 && result.bookings.length === 0;

  return (
    <div>
      <PageHeader title={t("bookings.title")} subtitle={t("bookings.subtitle")} />

      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && track()}
              placeholder={t("bookings.enterPhone")}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <Button onClick={track} disabled={loading} className="shrink-0">{t("bookings.track")}</Button>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16 text-brand-400"><Spinner className="h-7 w-7" /></div>
        ) : empty ? (
          <p className="py-16 text-center text-gray-400">{t("bookings.noResults")}</p>
        ) : result ? (
          <div className="mt-8 space-y-3">
            {result.bookings.map((b) => (
              <Row
                key={b._id}
                Icon={CalendarDays}
                id={b.bookingId}
                title={b.itemName}
                sub={`${t("bookings.booking")} · ${b.date} ${b.timeSlot}`}
                status={b.status}
                statusLabel={statusLabel(b.status)}
              />
            ))}
            {result.orders.map((o) => (
              <Row
                key={o._id}
                Icon={Package}
                id={o.orderId}
                title={o.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                sub={`${t("bookings.order")} · ${t("bookings.pickup")} ${o.pickupDate} · ${formatRs(o.total, 0)}`}
                status={o.status}
                statusLabel={statusLabel(o.status)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({ Icon, id, title, sub, status, statusLabel }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-gray-500">{id}</span>
        </div>
        <p className="line-clamp-1 font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
      <span className={"shrink-0 rounded-full px-3 py-1 text-xs font-medium " + (STATUS_STYLES[status] || "bg-gray-100 text-gray-600")}>
        {statusLabel}
      </span>
    </div>
  );
}
