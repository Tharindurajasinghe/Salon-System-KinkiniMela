"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import Tabs from "@/components/ui/Tabs";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { api } from "@/lib/utils/apiClient";
import { formatRs } from "@/lib/utils/currency";
import { todaySLKey, currentMonthSLKey } from "@/lib/utils/timezone";

const KIND_LABEL = { product: "Product", service: "Service", package: "Package" };

export default function SummaryPage() {
  const [scope, setScope] = useState("daily");
  const [date, setDate] = useState(todaySLKey());
  const [month, setMonth] = useState(currentMonthSLKey());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 32-day window for the daily picker.
  const minDate = useMemo(() => addDays(todaySLKey(), -31), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const url = scope === "daily"
      ? `/api/admin/summary?scope=daily&date=${date}`
      : `/api/admin/summary?scope=monthly&month=${month}`;
    api.get(url).then((d) => active && setData(d)).catch(() => active && setData(null)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [scope, date, month]);

  function printSummary() {
    document.body.classList.add("print-summary");
    const cleanup = () => { document.body.classList.remove("print-summary"); window.removeEventListener("afterprint", cleanup); };
    window.addEventListener("afterprint", cleanup);
    setTimeout(() => window.print(), 120);
  }

  const series = data?.series || [];
  const maxIncome = series.length ? Math.max(...series.map((s) => s.income), 1) : 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Tabs
          tabs={[{ key: "daily", label: "Daily" }, { key: "monthly", label: "Monthly" }]}
          active={scope}
          onChange={setScope}
        />
        <div className="flex items-center gap-2 sm:ml-auto">
          {scope === "daily" ? (
            <input type="date" min={minDate} max={todaySLKey()} value={date} onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
          ) : (
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
          )}
          <Button variant="outline" onClick={printSummary}><Printer className="h-4 w-4" /> Print</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16 text-brand-400"><Spinner className="h-7 w-7" /></div>
      ) : !data ? (
        <p className="py-14 text-center text-sm text-gray-400">Could not load summary.</p>
      ) : (
        <div id="summary-print" className="space-y-5">
          {/* Totals */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <p className="text-sm text-gray-500">Total income</p>
              <p className="mt-1 font-display text-3xl text-gray-900">{formatRs(data.grandIncome)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-500">Total profit</p>
              <p className="mt-1 font-display text-3xl text-green-600">{formatRs(data.grandProfit)}</p>
            </Card>
          </div>

          {/* Monthly income-by-day chart */}
          {scope === "monthly" && (
            <Card className="p-5">
              <p className="mb-4 text-sm font-medium text-gray-700">Income by day</p>
              {series.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">No sales recorded this month.</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[520px]">
                    {/* Bars — direct children of the fixed-height row so % heights work */}
                    <div className="flex h-40 items-end gap-1">
                      {series.map((s) => (
                        <div
                          key={s.date}
                          title={`${s.date}: ${formatRs(s.income)}`}
                          className="group flex-1 rounded-t bg-brand-400 transition-colors hover:bg-brand-500"
                          style={{ height: `${s.income > 0 ? Math.max(3, (s.income / maxIncome) * 100) : 0}%` }}
                        />
                      ))}
                    </div>
                    {/* Day labels row (aligned column-for-column with the bars) */}
                    <div className="mt-1 flex gap-1">
                      {series.map((s) => (
                        <span key={s.date} className="flex-1 text-center text-[9px] text-gray-400">{s.date.slice(-2)}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Per-item table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium text-right">Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Income</th>
                  <th className="px-4 py-3 font-medium text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No sales in this period.</td></tr>
                ) : (
                  data.items.map((it, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{KIND_LABEL[it.kind] || it.kind}</span></td>
                      <td className="px-4 py-3 font-medium text-gray-900">{it.name}</td>
                      <td className="px-4 py-3 text-right">{it.qty}</td>
                      <td className="px-4 py-3 text-right">{formatRs(it.income)}</td>
                      <td className="px-4 py-3 text-right text-green-600">{formatRs(it.profit)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {data.items.length > 0 && (
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50/50 font-semibold">
                    <td className="px-4 py-3" colSpan={3}>Grand total</td>
                    <td className="px-4 py-3 text-right">{formatRs(data.grandIncome)}</td>
                    <td className="px-4 py-3 text-right text-green-600">{formatRs(data.grandProfit)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}