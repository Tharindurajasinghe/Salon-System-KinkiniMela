"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Eye, Pencil, Trash2, UserRound, Receipt as ReceiptIcon, Wallet } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Receipt from "@/components/billing/Receipt";
import { api } from "@/lib/utils/apiClient";
import { formatRs } from "@/lib/utils/currency";
import { formatSL } from "@/lib/utils/timezone";

const EMPTY = { name: "", addressLine1: "", addressLine2: "", phone: "", idCard: "" };

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState(null);
  const [salon, setSalon] = useState(null);
  const [form, setForm] = useState(null); // {mode,data}
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [pay, setPay] = useState({ amount: "", note: "" });
  const [paying, setPaying] = useState(false);
  const [toRemove, setToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [printBill, setPrintBill] = useState(null);
  const [toast, setToast] = useState("");

  async function load() {
    setRows(null);
    setRows(await api.get(`/api/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`));
  }
  useEffect(() => { const id = setTimeout(() => load().catch(() => setRows([])), 200); return () => clearTimeout(id); }, [q]); // eslint-disable-line
  useEffect(() => { api.get("/api/settings").then((d) => setSalon(d.settings)).catch(() => {}); }, []);

  function flash(m) { setToast(m); setTimeout(() => setToast(""), 2200); }

  // ----- create / edit -----
  function openCreate() { setFormError(""); setForm({ mode: "create", data: { ...EMPTY } }); }
  function openEdit(c) { setFormError(""); setForm({ mode: "edit", data: { id: c._id, name: c.name, addressLine1: c.addressLine1 || "", addressLine2: c.addressLine2 || "", phone: c.phone, idCard: c.idCard || "" } }); }
  async function save() {
    const d = form.data;
    if (!d.name.trim()) return setFormError("Name is required.");
    if (!d.phone.trim()) return setFormError("Phone number is required.");
    setSaving(true); setFormError("");
    try {
      if (form.mode === "create") await api.post("/api/admin/customers", d);
      else await api.put("/api/admin/customers", d);
      setForm(null); await load();
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  }

  // ----- detail -----
  async function openDetail(id) {
    setDetailId(id); setDetail(null); setPay({ amount: "", note: "" });
    try { setDetail(await api.get(`/api/admin/customers?id=${id}`)); } catch (e) { flash(e.message); }
  }
  async function recordPayment() {
    if (!pay.amount || Number(pay.amount) <= 0) return;
    setPaying(true);
    try {
      await api.post("/api/admin/customers/payment", { customerId: detailId, amount: Number(pay.amount), note: pay.note });
      setPay({ amount: "", note: "" });
      setDetail(await api.get(`/api/admin/customers?id=${detailId}`));
      await load();
      flash("Payment recorded.");
    } catch (e) { flash(e.message); }
    finally { setPaying(false); }
  }
  function printInvoice(bill) {
    setPrintBill({ ...bill, isCredit: true, customerName: detail.customer.name, customerPhone: detail.customer.phone });
    setTimeout(() => window.print(), 120);
  }

  // ----- delete -----
  async function confirmRemove() {
    setRemoving(true);
    try { await api.del(`/api/admin/customers?id=${toRemove._id}`); setToRemove(null); await load(); flash("Customer removed."); }
    catch (e) { flash(e.message); }
    finally { setRemoving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, phone or ID card number"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
        </div>
        <Button onClick={openCreate} className="shrink-0"><Plus className="h-4 w-4" /> Add customer</Button>
      </div>

      {rows === null ? (
        <div className="grid place-items-center py-16 text-brand-400"><Spinner className="h-7 w-7" /></div>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-gray-400">No customers yet. Add your first with the button above.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">ID card</th>
                <th className="px-4 py-3 font-medium text-right">Balance due</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <button onClick={() => openDetail(c._id)} className="flex items-center gap-2 text-left">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-brand-500"><UserRound className="h-4 w-4" /></span>
                      <span className="font-medium text-gray-900 hover:text-brand-600">{c.name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-500">{c.idCard || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {c.balanceDue > 0 ? <span className="font-medium text-red-500">{formatRs(c.balanceDue)}</span> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openDetail(c._id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-500" title="Details"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-500" title="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setToRemove(c)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Remove"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / edit modal */}
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.mode === "edit" ? "Edit customer" : "Add customer"}
        footer={<><Button variant="ghost" onClick={() => setForm(null)} disabled={saving}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></>}>
        {form && (
          <div className="space-y-4">
            {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}
            <Input label="Name" value={form.data.name} onChange={(e) => setForm({ ...form, data: { ...form.data, name: e.target.value } })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Phone (unique)" value={form.data.phone} onChange={(e) => setForm({ ...form, data: { ...form.data, phone: e.target.value } })} />
              <Input label="ID card number" value={form.data.idCard} onChange={(e) => setForm({ ...form, data: { ...form.data, idCard: e.target.value } })} />
            </div>
            <Input label="Address line 1" value={form.data.addressLine1} onChange={(e) => setForm({ ...form, data: { ...form.data, addressLine1: e.target.value } })} />
            <Input label="Address line 2" value={form.data.addressLine2} onChange={(e) => setForm({ ...form, data: { ...form.data, addressLine2: e.target.value } })} />
          </div>
        )}
      </Modal>

      {/* Detail modal */}
      <Modal open={!!detailId} onClose={() => { setDetailId(null); setDetail(null); }} title={detail?.customer?.name || "Customer"} size="lg">
        {!detail ? (
          <div className="grid place-items-center py-12 text-brand-400"><Spinner className="h-7 w-7" /></div>
        ) : (
          <div className="space-y-5">
            {/* Info + balance */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="text-sm text-gray-600">
                <p>{detail.customer.phone}</p>
                {detail.customer.idCard && <p>ID: {detail.customer.idCard}</p>}
                {(detail.customer.addressLine1 || detail.customer.addressLine2) && (
                  <p className="mt-1 text-gray-500">{[detail.customer.addressLine1, detail.customer.addressLine2].filter(Boolean).join(", ")}</p>
                )}
              </div>
              <div className="rounded-xl bg-brand-50 px-4 py-3 text-right">
                <p className="text-xs text-gray-500">Balance due</p>
                <p className={"font-display text-2xl " + (detail.balanceDue > 0 ? "text-red-500" : "text-green-600")}>{formatRs(detail.balanceDue)}</p>
              </div>
            </div>

            {/* Record payment */}
            {detail.balanceDue > 0 && (
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700"><Wallet className="h-4 w-4 text-brand-500" /> Record payment</p>
                <div className="flex flex-wrap gap-2">
                  <input type="number" min="0" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} placeholder="Amount"
                    className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
                  <input value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} placeholder="Note (optional)"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
                  <Button onClick={recordPayment} disabled={paying}>{paying ? "..." : "Record"}</Button>
                </div>
              </div>
            )}

            {/* Credit bills */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Credit bills</p>
              {detail.creditBills.length === 0 ? (
                <p className="text-sm text-gray-400">No credit bills.</p>
              ) : (
                <div className="space-y-2">
                  {detail.creditBills.map((b) => (
                    <div key={b._id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs text-gray-500">{b.billId} · {formatSL(b.createdAt, "yyyy-MM-dd")}</p>
                        <p className="text-sm text-gray-700">Total {formatRs(b.grandTotal)} · Paid {formatRs(b.paidAmount)}</p>
                      </div>
                      <span className={"rounded-full px-2.5 py-0.5 text-xs font-medium " + (b.balance > 0 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700")}>
                        {b.balance > 0 ? `Due ${formatRs(b.balance)}` : "Settled"}
                      </span>
                      <button onClick={() => printInvoice(b)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-500" title="Print invoice"><ReceiptIcon className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment history */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Payment history</p>
              {detail.history.length === 0 ? (
                <p className="text-sm text-gray-400">No payments yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                  {detail.history.map((p, i) => (
                    <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-900">{formatRs(p.amount)}</span>
                        <span className="ml-2 text-xs text-gray-400">{p.billId} · {p.note}</span>
                      </div>
                      <span className="text-xs text-gray-400">{formatSL(p.at, "yyyy-MM-dd hh:mm a")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toRemove}
        title="Remove customer"
        message={`Remove "${toRemove?.name}"? This is blocked if they still owe a balance.`}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
        loading={removing}
      />

      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg">{toast}</div>}

      <Receipt bill={printBill} salon={salon} />
    </div>
  );
}
