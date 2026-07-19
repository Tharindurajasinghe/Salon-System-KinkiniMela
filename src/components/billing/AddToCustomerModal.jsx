"use client";

import { useEffect, useState } from "react";
import { Search, UserRound, Check } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { api } from "@/lib/utils/apiClient";
import { formatRs } from "@/lib/utils/currency";

/**
 * "Add to customer" — puts the current cart on a registered customer's account
 * as a credit bill, optionally with a first installment. Searches customers by
 * name or phone.
 */
export default function AddToCustomerModal({ open, onClose, cart, discount, grandTotal, onCreated }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [installment, setInstallment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset each time it opens.
  useEffect(() => {
    if (open) { setQ(""); setResults([]); setSelected(null); setInstallment(""); setError(""); }
  }, [open]);

  // Debounced customer search.
  useEffect(() => {
    if (!open || selected) return;
    if (q.trim().length < 1) { setResults([]); return; }
    const id = setTimeout(() => {
      setSearching(true);
      api.get(`/api/billing/customers?q=${encodeURIComponent(q.trim())}`)
        .then(setResults).catch(() => setResults([])).finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(id);
  }, [q, open, selected]);

  async function confirm() {
    setError("");
    if (!selected) return setError("Please select a customer.");
    const first = Number(installment || 0);
    if (first > grandTotal) return setError("Installment cannot exceed the bill total.");
    setSaving(true);
    try {
      const bill = await api.post("/api/bills", {
        items: cart.map((l) => ({ kind: l.kind, refId: l.refId, qty: l.qty, price: Number(l.unitPrice || 0), variantName: l.variantName, bringDate: l.bringDate, deliverDate: l.deliverDate })),
        discount: { type: discount.type, value: Number(discount.value || 0) },
        customerId: selected._id,
        firstInstallment: first,
      });
      onCreated(bill, selected);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const balance = Math.max(0, grandTotal - Number(installment || 0));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add bill to customer"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={confirm} disabled={saving || !selected}>{saving ? "..." : "Add to account"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
          <span className="text-gray-500">Bill total</span>
          <span className="font-semibold text-gray-900">{formatRs(grandTotal)}</span>
        </div>

        {selected ? (
          <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 p-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-brand-500"><UserRound className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">{selected.name}</p>
              <p className="text-xs text-gray-500">{selected.phone}{selected.idCard ? ` · ${selected.idCard}` : ""}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-sm text-brand-600 hover:underline">Change</button>
          </div>
        ) : (
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search customer by name or phone"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="mt-2 max-h-52 overflow-y-auto">
              {searching ? (
                <div className="grid place-items-center py-6 text-brand-400"><Spinner /></div>
              ) : q && results.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">No customers found. Register them on the Customers page first.</p>
              ) : (
                results.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => setSelected(c)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-brand-500"><UserRound className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.phone}{c.idCard ? ` · ${c.idCard}` : ""}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {selected && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">First installment (optional)</label>
            <input
              type="number" min="0" max={grandTotal} value={installment}
              onChange={(e) => setInstallment(e.target.value)} placeholder="0"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <div className="flex justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <span>Balance to account</span>
              <span className="font-semibold">{formatRs(balance)}</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
