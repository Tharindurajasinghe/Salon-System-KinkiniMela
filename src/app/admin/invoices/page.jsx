"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Search, Plus, Eye, Pencil, Trash2, X, Wallet } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ImageUploader from "@/components/catalogue/ImageUploader";
import { api } from "@/lib/utils/apiClient";
import { formatRs } from "@/lib/utils/currency";
import { todaySLKey, formatSL } from "@/lib/utils/timezone";

const METHOD_LABEL = { cash: "Cash", cheque: "Cheque", bank_transfer: "Bank transfer" };
const EMPTY = {
  companyName: "", date: todaySLKey(), paymentMethod: "cash",
  chequeDate: "", chequeNumber: "", images: [], note: "", totalAmount: "", paid: "",
};

export default function InvoicesPage() {
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState(null);
  const [modal, setModal] = useState(null);      // add / edit
  const [viewing, setViewing] = useState(null);  // read-only view
  const [lightbox, setLightbox] = useState(null); // full-screen image url
  const [pay, setPay] = useState({ amount: "", note: "" });
  const [paying, setPaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toRemove, setToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [toast, setToast] = useState("");

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (date) params.set("date", date);
    if (status) params.set("status", status);
    setRows(await api.get(`/api/invoices?${params}`));
  }
  useEffect(() => { const id = setTimeout(() => load().catch(() => setRows([])), 200); return () => clearTimeout(id); }, [q, date, status]); // eslint-disable-line

  function flash(m) { setToast(m); setTimeout(() => setToast(""), 2200); }

  function openCreate() { setError(""); setModal({ mode: "create", data: { ...EMPTY, date: todaySLKey() } }); }
  function openEdit(inv) {
    setError(""); setPay({ amount: "", note: "" });
    setModal({ mode: "edit", data: {
      id: inv._id, invoiceNo: inv.invoiceNo, companyName: inv.companyName, date: inv.date, paymentMethod: inv.paymentMethod,
      chequeDate: inv.chequeDate || "", chequeNumber: inv.chequeNumber || "", images: inv.images || [], note: inv.note || "",
      totalAmount: inv.totalAmount, paidAmount: inv.paidAmount, payments: inv.payments || [], balance: inv.balance,
    } });
  }
  const upd = (patch) => setModal((m) => ({ ...m, data: { ...m.data, ...patch } }));

  async function save() {
    const d = modal.data;
    if (!d.companyName.trim()) return setError("Company name is required.");
    if (!d.date) return setError("Date is required.");
    if (modal.mode === "create" && Number(d.paid || 0) > Number(d.totalAmount || 0)) return setError("Installment cannot exceed the total.");
    setSaving(true); setError("");
    try {
      const base = {
        companyName: d.companyName, date: d.date, paymentMethod: d.paymentMethod,
        chequeDate: d.chequeDate, chequeNumber: d.chequeNumber, images: d.images, note: d.note,
        totalAmount: Number(d.totalAmount || 0),
      };
      if (modal.mode === "create") await api.post("/api/invoices", { ...base, firstInstallment: Number(d.paid || 0) });
      else await api.put("/api/invoices", { id: d.id, ...base });
      setModal(null); await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function recordPayment() {
    if (!pay.amount || Number(pay.amount) <= 0) return;
    setPaying(true);
    try {
      const updated = await api.post("/api/invoices/payment", { invoiceId: modal.data.id, amount: Number(pay.amount), note: pay.note });
      setModal((m) => ({ ...m, data: { ...m.data, paidAmount: updated.paidAmount, payments: updated.payments, balance: updated.balance } }));
      setPay({ amount: "", note: "" });
      await load();
      flash("Payment recorded.");
    } catch (e) { setError(e.message); }
    finally { setPaying(false); }
  }

  async function confirmRemove() {
    setRemoving(true);
    try { await api.del(`/api/invoices?id=${toRemove._id}`); setToRemove(null); await load(); flash("Invoice removed."); }
    finally { setRemoving(false); }
  }

  const balancePreview = modal ? Number(modal.data.totalAmount || 0) - Number(modal.mode === "create" ? modal.data.paid || 0 : modal.data.paidAmount || 0) : 0;

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by invoice number or company name"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none" />
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none">
          <option value="">All statuses</option>
          <option value="balance_due">Balance due</option>
          <option value="paid">Paid</option>
        </select>
        {(date || status || q) && (
          <button onClick={() => { setQ(""); setDate(""); setStatus(""); }} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
        )}
        <Button onClick={openCreate} className="shrink-0"><Plus className="h-4 w-4" /> Add invoice</Button>
      </div>

      {rows === null ? (
        <div className="grid place-items-center py-16 text-brand-400"><Spinner className="h-7 w-7" /></div>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-gray-400">No invoices found.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3 font-medium">No.</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Paid</th>
                <th className="px-4 py-3 font-medium text-right">Balance</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((inv) => (
                <tr key={inv._id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{inv.invoiceNo}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{inv.companyName}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.date}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {METHOD_LABEL[inv.paymentMethod]}
                    {inv.paymentMethod === "cheque" && inv.chequeNumber && <span className="block text-xs text-gray-400">#{inv.chequeNumber}{inv.chequeDate ? ` · ${inv.chequeDate}` : ""}</span>}
                  </td>
                  <td className="px-4 py-3 text-right">{formatRs(inv.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{formatRs(inv.paidAmount)}</td>
                  <td className="px-4 py-3 text-right">{inv.balance > 0 ? <span className="font-medium text-red-500">{formatRs(inv.balance)}</span> : <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className={"rounded-full px-2.5 py-0.5 text-xs font-medium " + (inv.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                      {inv.status === "paid" ? "Paid" : "Balance due"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewing(inv)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-500" title="View"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => openEdit(inv)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-500" title="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setToRemove(inv)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Remove"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / edit modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? `Edit invoice ${modal.data.invoiceNo}` : "Add invoice"}
        size="lg"
        footer={<><Button variant="ghost" onClick={() => setModal(null)} disabled={saving}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></>}
      >
        {modal && (
          <div className="space-y-4">
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Company name" value={modal.data.companyName} onChange={(e) => upd({ companyName: e.target.value })} />
              <Input label="Date" type="date" value={modal.data.date} onChange={(e) => upd({ date: e.target.value })} />
            </div>

            <Select label="Payment method" value={modal.data.paymentMethod} onChange={(e) => upd({ paymentMethod: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="bank_transfer">Bank transfer</option>
            </Select>

            {modal.data.paymentMethod === "cheque" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Cheque date (optional)" type="date" value={modal.data.chequeDate} onChange={(e) => upd({ chequeDate: e.target.value })} />
                <Input label="Cheque number (optional)" value={modal.data.chequeNumber} onChange={(e) => upd({ chequeNumber: e.target.value })} />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Total amount (Rs.)" type="number" min="0" value={modal.data.totalAmount} onChange={(e) => upd({ totalAmount: e.target.value })} />
              {modal.mode === "create" && (
                <Input label="1st installment (Rs.)" type="number" min="0" value={modal.data.paid} onChange={(e) => upd({ paid: e.target.value })} />
              )}
            </div>

            <Input as="textarea" label="Note" value={modal.data.note} onChange={(e) => upd({ note: e.target.value })} />

            <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-2.5 text-sm">
              <span className="text-gray-600">Balance due</span>
              <span className={"font-semibold " + (balancePreview > 0 ? "text-red-500" : "text-green-600")}>{formatRs(Math.max(0, balancePreview))}</span>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">Images (up to 5)</p>
              <ImageUploader value={modal.data.images} onChange={(imgs) => upd({ images: imgs })} multiple max={5} folder="salon/invoices" />
            </div>

            {/* Record payment + history (edit only) */}
            {modal.mode === "edit" && (
              <div className="space-y-3 rounded-xl border border-gray-100 p-3">
                <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700"><Wallet className="h-4 w-4 text-brand-500" /> Record balance due payment</p>
                <div className="flex flex-wrap gap-2">
                  <input type="number" min="0" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} placeholder="Amount"
                    className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
                  <input value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} placeholder="Note (optional)"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
                  <Button onClick={recordPayment} disabled={paying || modal.data.balance <= 0}>{paying ? "..." : "Record"}</Button>
                </div>
                <PaymentHistory payments={modal.data.payments} />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* View modal (read-only) */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing ? `Invoice ${viewing.invoiceNo}` : ""} size="lg">
        {viewing && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company" value={viewing.companyName} />
              <Field label="Date" value={viewing.date} />
              <Field label="Payment method" value={METHOD_LABEL[viewing.paymentMethod]} />
              {viewing.paymentMethod === "cheque" && <Field label="Cheque" value={`${viewing.chequeNumber || "—"}${viewing.chequeDate ? ` · ${viewing.chequeDate}` : ""}`} />}
              <Field label="Total" value={formatRs(viewing.totalAmount)} />
              <Field label="Paid" value={formatRs(viewing.paidAmount)} />
              <Field label="Balance due" value={formatRs(viewing.balance)} highlight={viewing.balance > 0} />
              <Field label="Status" value={viewing.status === "paid" ? "Paid" : "Balance due"} />
            </div>

            {viewing.note && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Note</p>
                <p className="whitespace-pre-line text-gray-700">{viewing.note}</p>
              </div>
            )}

            {viewing.images?.length > 0 && (
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">Images (tap to enlarge)</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {viewing.images.map((img, i) => (
                    <button key={i} onClick={() => setLightbox(img.url)} className="relative aspect-square overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                      <Image src={img.url} alt="" fill className="object-cover" sizes="120px" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-1 text-sm font-medium text-gray-700">Payment history</p>
              <PaymentHistory payments={viewing.payments} />
            </div>
          </div>
        )}
      </Modal>

      {/* Full-screen image lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X className="h-5 w-5" /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <ConfirmDialog
        open={!!toRemove}
        title="Remove invoice"
        message={`Remove invoice ${toRemove?.invoiceNo} (${toRemove?.companyName})?`}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
        loading={removing}
      />

      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg">{toast}</div>}
    </div>
  );
}

function Field({ label, value, highlight }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className={"font-medium " + (highlight ? "text-red-500" : "text-gray-900")}>{value}</p>
    </div>
  );
}

function PaymentHistory({ payments }) {
  if (!payments || payments.length === 0) return <p className="text-sm text-gray-400">No payments yet.</p>;
  const sorted = [...payments].sort((a, b) => new Date(b.at) - new Date(a.at));
  return (
    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
      {sorted.map((p, i) => (
        <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
          <div>
            <span className="font-medium text-gray-900">{formatRs(p.amount)}</span>
            {p.note && <span className="ml-2 text-xs text-gray-400">{p.note}</span>}
          </div>
          <span className="text-xs text-gray-400">{formatSL(p.at, "yyyy-MM-dd hh:mm a")}</span>
        </li>
      ))}
    </ul>
  );
}
