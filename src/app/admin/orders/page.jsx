"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Check, X, Printer, Trash2, MessageCircle } from "lucide-react";
import Tabs from "@/components/ui/Tabs";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Receipt from "@/components/billing/Receipt";
import { api } from "@/lib/utils/apiClient";
import { formatRs } from "@/lib/utils/currency";
import { formatSL } from "@/lib/utils/timezone";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "service", label: "Services" },
  { key: "package", label: "Packages" },
  { key: "product", label: "Products" },
  { key: "dressjewelry", label: "Dress & Jewelry" },
  { key: "bill", label: "Bills" },
];
const REJECT_PRESETS = [
  "This service is currently unavailable",
  "That day we are not working",
  "Already booked",
];
const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  confirm: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  paid: "bg-blue-100 text-blue-700",
  credit: "bg-orange-100 text-orange-700",
};
const TYPE_LABEL = { service: "Service", package: "Package", product: "Product", dressjewelry: "Dress/Jewelry", bill: "Bill" };

export default function OrdersPage() {
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rows, setRows] = useState(null);
  const [salon, setSalon] = useState(null);
  const [details, setDetails] = useState(null);
  const [rejecting, setRejecting] = useState(null); // row being rejected
  const [rejectReason, setRejectReason] = useState("");
  const [toRemove, setToRemove] = useState(null);
  const [busy, setBusy] = useState(false);
  const [printBill, setPrintBill] = useState(null);
  const [toast, setToast] = useState("");

  async function load() {
    setRows(null);
    const data = await api.get(`/api/admin/orders?type=${filter}`);
    setRows(data);
  }
  useEffect(() => { load().catch(() => setRows([])); }, [filter]); // eslint-disable-line
  useEffect(() => { api.get("/api/settings").then((d) => setSalon(d.settings)).catch(() => {}); }, []);

  function flash(m) { setToast(m); setTimeout(() => setToast(""), 2200); }

  async function setStatus(row, status, reason) {
    setBusy(true);
    try {
      await api.put("/api/admin/orders", { rowType: row.rowType, id: row._id, status, rejectReason: reason });
      flash(status === "confirm" ? "Confirmed — SMS sent." : "Rejected — SMS sent.");
      setRejecting(null); setRejectReason("");
      await load();
    } catch (e) { flash(e.message); }
    finally { setBusy(false); }
  }

  async function confirmRemove() {
    setBusy(true);
    try {
      await api.del(`/api/admin/orders?rowType=${toRemove.rowType}&id=${toRemove._id}`);
      setToRemove(null);
      await load();
      flash("Removed.");
    } catch (e) { flash(e.message); }
    finally { setBusy(false); }
  }

  function print(row) {
    setPrintBill(row.raw);
    setTimeout(() => window.print(), 120);
  }

  const list = useMemo(() => {
    let l = rows || [];
    if (statusFilter) l = l.filter((r) => r.status === statusFilter);
    if (dateFilter) l = l.filter((r) => (r.date || formatSL(r.createdAt, "yyyy-MM-dd")) === dateFilter);
    return l;
  }, [rows, statusFilter, dateFilter]);

  return (
    <div className="space-y-5">
      <Tabs tabs={FILTERS} active={filter} onChange={setFilter} />

      {/* Date + status filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirm">Confirmed</option>
          <option value="rejected">Rejected</option>
          <option value="paid">Paid</option>
        </select>
        {(dateFilter || statusFilter) && (
          <button onClick={() => { setDateFilter(""); setStatusFilter(""); }} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
        )}
      </div>

      {rows === null ? (
        <div className="grid place-items-center py-16 text-brand-400"><Spinner className="h-7 w-7" /></div>
      ) : list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-gray-400">Nothing here yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs uppercase tracking-wide text-gray-400">
                {["ID", "Type", "Name", "Date", "Customer", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map((row) => (
                <tr key={`${row.rowType}:${row._id}`} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.code}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{TYPE_LABEL[row.kind]}</span></td>
                  <td className="max-w-[220px] truncate px-4 py-3 font-medium text-gray-900">{row.name}</td>
                  <td className="px-4 py-3 text-gray-500">{row.date || formatSL(row.createdAt, "yyyy-MM-dd")}{row.timeSlot ? ` · ${row.timeSlot}` : ""}</td>
                  <td className="px-4 py-3 text-gray-600">{row.customerName || "—"}</td>
                  <td className="px-4 py-3"><span className={"rounded-full px-2.5 py-0.5 text-xs font-medium " + (STATUS_STYLES[row.status] || "bg-gray-100")}>{row.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn title="Details" onClick={() => setDetails(row)}><Eye className="h-4 w-4" /></IconBtn>
                      {row.rowType !== "bill" && row.customerWhatsapp && (
                        <a
                          href={`https://wa.me/${waNumber(row.customerWhatsapp)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Send WhatsApp"
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}
                      {row.rowType !== "bill" && (
                        <>
                          <IconBtn title="Confirm" onClick={() => setStatus(row, "confirm")} className="hover:text-green-600" disabled={row.status === "confirm"}><Check className="h-4 w-4" /></IconBtn>
                          <IconBtn title="Reject" onClick={() => { setRejecting(row); setRejectReason(""); }} className="hover:text-red-500" disabled={row.status === "rejected"}><X className="h-4 w-4" /></IconBtn>
                        </>
                      )}
                      {row.rowType === "bill" && (
                        <IconBtn title="Print" onClick={() => print(row)}><Printer className="h-4 w-4" /></IconBtn>
                      )}
                      <IconBtn title="Remove" onClick={() => setToRemove(row)} className="hover:text-red-500"><Trash2 className="h-4 w-4" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details modal */}
      <Modal open={!!details} onClose={() => setDetails(null)} title={details ? `${TYPE_LABEL[details.kind]} · ${details.code}` : ""}>
        {details && <OrderDetails row={details} />}
      </Modal>

      {/* Reject reason modal */}
      <Modal
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title="Reject — reason"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejecting(null)} disabled={busy}>Cancel</Button>
            <Button variant="danger" onClick={() => setStatus(rejecting, "rejected", rejectReason)} disabled={busy || !rejectReason.trim()}>
              {busy ? "..." : "Reject & SMS"}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          {REJECT_PRESETS.map((r) => (
            <button key={r} onClick={() => setRejectReason(r)} className={"block w-full rounded-lg border px-3 py-2 text-left text-sm " + (rejectReason === r ? "border-brand-400 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
              {r}
            </button>
          ))}
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Or write a custom reason" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" rows={2} />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toRemove}
        title="Remove"
        message={`Remove ${toRemove?.code}? The summary will update automatically.`}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
        loading={busy}
      />

      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg">{toast}</div>}

      <Receipt bill={printBill} salon={salon} />
    </div>
  );
}

function IconBtn({ children, className = "", ...props }) {
  return (
    <button className={"rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30 " + className} {...props}>
      {children}
    </button>
  );
}

function OrderDetails({ row }) {
  const r = row.raw;
  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">Customer</p>
        <p className="font-medium text-gray-900">{row.customerName || "—"}</p>
        {row.customerPhone && <p className="text-gray-500">{row.customerPhone}</p>}
      </div>

      {row.rowType === "booking" && (
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Booking</p>
          <p className="text-gray-700">{r.itemName} — {r.date} at {r.timeSlot}</p>
          {r.rejectReason && <p className="mt-1 text-red-500">Reject reason: {r.rejectReason}</p>}
        </div>
      )}

      {row.rowType === "dressorder" && (
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Rental</p>
          <p className="text-gray-700">{r.itemName} — {r.variantName} × {r.qty}</p>
          <p className="mt-1 text-gray-500">Bring {r.bringDate} → Deliver {r.deliverDate}</p>
          <p className="text-gray-500">Delay charge/day: {formatRs(r.delayChargePerDay || 0, 0)}</p>
          {r.rejectReason && <p className="mt-1 text-red-500">Reject reason: {r.rejectReason}</p>}
        </div>
      )}

      {row.rowType === "order" && (
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Items · pickup {r.pickupDate}</p>
          <ul className="mt-1 space-y-1">
            {r.items.map((i, k) => (
              <li key={k} className="flex justify-between text-gray-700"><span>{i.name} × {i.qty}</span><span>{formatRs(i.sellingPrice * i.qty, 0)}</span></li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 font-medium"><span>Total</span><span>{formatRs(r.total)}</span></div>
          {r.rejectReason && <p className="mt-1 text-red-500">Reject reason: {r.rejectReason}</p>}
        </div>
      )}

      {row.rowType === "bill" && (
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Items</p>
          <ul className="mt-1 space-y-1">
            {r.items.map((i, k) => (
              <li key={k} className="flex justify-between text-gray-700"><span>{i.name} × {i.qty}</span><span>{formatRs(i.sellingPrice * i.qty, 0)}</span></li>
            ))}
          </ul>
          <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatRs(r.subTotal)}</span></div>
            {r.discount?.amount > 0 && <div className="flex justify-between text-gray-500"><span>Discount</span><span>- {formatRs(r.discount.amount)}</span></div>}
            <div className="flex justify-between font-semibold"><span>Total</span><span>{formatRs(r.grandTotal)}</span></div>
            {r.isCredit ? (
              <>
                <div className="flex justify-between text-gray-500"><span>Paid</span><span>{formatRs(r.paidAmount || 0)}</span></div>
                <div className="flex justify-between font-medium text-red-500"><span>Balance due</span><span>{formatRs((r.grandTotal || 0) - (r.paidAmount || 0))}</span></div>
              </>
            ) : (
              <div className="flex justify-between text-gray-500"><span>Cash / Change</span><span>{formatRs(r.cashPaid)} / {formatRs(r.change)}</span></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Normalize a phone to Sri-Lanka international format for wa.me (no +).
function waNumber(raw = "") {
  let n = (raw || "").replace(/\D/g, "");
  if (!n) return "";
  if (n.startsWith("0")) n = "94" + n.slice(1);
  else if (!n.startsWith("94") && n.length <= 9) n = "94" + n;
  return n;
}
