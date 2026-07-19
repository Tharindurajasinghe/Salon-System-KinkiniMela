"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Search, Star, X, Plus, Minus, Trash2, Printer, Check, ShoppingCart, Percent, UserPlus,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Receipt from "@/components/billing/Receipt";
import AddToCustomerModal from "@/components/billing/AddToCustomerModal";
import DressBillingModal from "@/components/billing/DressBillingModal";
import { api } from "@/lib/utils/apiClient";
import { formatRs } from "@/lib/utils/currency";

const TABS = [
  { key: "quick", label: "Quick sale" },
  { key: "product", label: "Products" },
  { key: "service", label: "Services" },
  { key: "package", label: "Packages" },
  { key: "dressjewelry", label: "Dress & Jewelry" },
];
const ENDPOINT = { product: "/api/products", service: "/api/services", package: "/api/packages", dressjewelry: "/api/dressjewelry" };

// Normalise the different catalogue shapes into { refId, name, sellingPrice, image }.
function normalise(kind, row) {
  if (kind === "product") return { refId: row._id, name: row.name, sellingPrice: row.sellingPrice, cost: row.buyingPrice || 0, image: row.image };
  if (kind === "service") return { refId: row._id, name: row.name, sellingPrice: row.sellingPrice, cost: row.cost || 0, image: row.image };
  return { refId: row._id, name: row.name, sellingPrice: row.sellingPrice, cost: row.cost || 0, image: row.images?.[0] || null };
}

export default function BillingClient() {
  const [tab, setTab] = useState("quick");
  const [search, setSearch] = useState("");
  const [salon, setSalon] = useState(null);

  const [quick, setQuick] = useState(null);
  const [items, setItems] = useState(null); // active catalogue tab items (normalised)
  const [loadingItems, setLoadingItems] = useState(false);

  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discountType, setDiscountType] = useState("amount"); // 'amount' | 'percentage'
  const [discountValue, setDiscountValue] = useState("");
  const [cashPaid, setCashPaid] = useState("");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [lastBill, setLastBill] = useState(null);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [dressModalItem, setDressModalItem] = useState(null);

  // --- load salon (for receipt) + quick items ---
  useEffect(() => { api.get("/api/settings").then((d) => setSalon(d.settings)).catch(() => {}); }, []);
  async function loadQuick() {
    const data = await api.get("/api/quicksale");
    setQuick(data);
  }
  useEffect(() => { loadQuick().catch(() => {}); }, []);

  // --- load the active catalogue tab (products/services/packages) ---
  useEffect(() => {
    if (tab === "quick") return;
    let active = true;
    setLoadingItems(true);
    const q = search ? `&q=${encodeURIComponent(search)}` : "";
    api
      .get(`${ENDPOINT[tab]}?activeOnly=1${q}`)
      .then((rows) => { if (active) setItems(tab === "dressjewelry" ? rows : rows.map((r) => normalise(tab, r))); })
      .catch(() => active && setItems([]))
      .finally(() => active && setLoadingItems(false));
    return () => { active = false; };
  }, [tab, search]);

  // Quick-sale membership lookup (key = kind:refId).
  const quickMap = useMemo(() => {
    const m = new Map();
    (quick || []).forEach((q) => m.set(`${q.kind}:${q.refId}`, q._id));
    return m;
  }, [quick]);

  // --- cart operations ---
  function addToCart(kind, item) {
    const key = `${kind}:${item.refId}`;
    setCart((c) => {
      const found = c.find((l) => l.key === key);
      if (found) return c.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { key, kind, refId: item.refId, name: item.name, unitPrice: item.sellingPrice, cost: item.cost || 0, qty: 1 }];
    });
  }
  function addDressToCart({ dressItem, variantName, bringDate, deliverDate, unitPrice, cost, delayChargePerDay, qty }) {
    const key = `dressjewelry:${dressItem._id}:${variantName}:${bringDate}:${deliverDate}`;
    setCart((c) => {
      const found = c.find((l) => l.key === key);
      if (found) return c.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l));
      return [...c, { key, kind: "dressjewelry", refId: dressItem._id, name: `${dressItem.name} - ${variantName}`, unitPrice, cost, qty, variantName, bringDate, deliverDate, delayChargePerDay }];
    });
    setDressModalItem(null);
  }
  const setQty = (key, qty) => setCart((c) => c.map((l) => (l.key === key ? { ...l, qty: Math.max(1, qty) } : l)));
  const setPrice = (key, price) => setCart((c) => c.map((l) => (l.key === key ? { ...l, unitPrice: price } : l)));
  const removeLine = (key) => setCart((c) => c.filter((l) => l.key !== key));

  async function toggleQuick(kind, refId) {
    const key = `${kind}:${refId}`;
    try {
      if (quickMap.has(key)) await api.del(`/api/quicksale?id=${quickMap.get(key)}`);
      else await api.post("/api/quicksale", { kind, refId });
      await loadQuick();
    } catch (e) {
      flash(e.message);
    }
  }

  // --- totals (display only; server recomputes authoritatively) ---
  const subTotal = cart.reduce((s, l) => s + Number(l.unitPrice || 0) * l.qty, 0);
  const discountAmount = useMemo(() => {
    const v = Number(discountValue || 0);
    if (discountType === "percentage") return Math.min((subTotal * v) / 100, subTotal);
    return Math.min(v, subTotal);
  }, [discountType, discountValue, subTotal]);
  const grandTotal = Math.max(0, subTotal - discountAmount);
  const change = Math.max(0, Number(cashPaid || 0) - grandTotal);

  function flash(msg) { setToast(msg); setTimeout(() => setToast(""), 2500); }

  // A line whose edited price is below cost is invalid.
  const belowCostLine = cart.find((l) => Number(l.unitPrice || 0) < Number(l.cost || 0));
  // Dress/jewelry lines force the whole bill onto a customer account.
  const hasDress = cart.some((l) => l.kind === "dressjewelry");

  function resetCart() {
    setCart([]); setCustomerName(""); setCustomerPhone("");
    setDiscountValue(""); setDiscountType("amount"); setCashPaid("");
  }

  async function save(print) {
    if (cart.length === 0) return flash("Cart is empty.");
    if (belowCostLine) return flash(`"${belowCostLine.name}" price is below its cost.`);
    setSaving(true);
    try {
      const bill = await api.post("/api/bills", {
        items: cart.map((l) => ({ kind: l.kind, refId: l.refId, qty: l.qty, price: Number(l.unitPrice || 0) })),
        customerName, customerPhone,
        discount: { type: discountType, value: Number(discountValue || 0) },
        cashPaid: Number(cashPaid || 0),
      });
      flash(`Bill ${bill.billId} saved.`);
      resetCart();
      if (print) {
        setLastBill(bill);
        setTimeout(() => window.print(), 120);
      }
    } catch (e) {
      flash(e.message);
    } finally {
      setSaving(false);
    }
  }

  const gridItems = tab === "quick"
    ? (quick || []).map((q) => ({ kind: q.kind, item: { refId: q.refId, name: q.name, sellingPrice: q.sellingPrice, cost: q.cost || 0, image: q.image }, entryId: q._id }))
    : tab === "dressjewelry"
      ? (items || []).map((it) => ({ kind: "dressjewelry", item: { refId: it._id, name: it.name, image: it.image, sellingPrice: it.variants?.length ? Math.min(...it.variants.map((v) => v.sellingPrice)) : 0, _dress: it } }))
      : (items || []).map((it) => ({ kind: tab, item: it }));

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      {/* ---------------- Catalogue picker ---------------- */}
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, services, packages"
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div className="mb-4 inline-flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSearch(""); }}
              className={
                tab === t.key
                  ? "rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-brand-600 shadow-sm"
                  : "rounded-lg px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {(tab === "quick" ? quick === null : loadingItems) ? (
          <div className="grid place-items-center py-16 text-brand-400"><Spinner className="h-7 w-7" /></div>
        ) : gridItems.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-gray-400">
            {tab === "quick" ? "No quick-sale items yet. Add some from the other tabs using the star." : "Nothing found."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {gridItems.map(({ kind, item, entryId }) => {
              const inQuick = quickMap.has(`${kind}:${item.refId}`);
              return (
                <div key={`${kind}:${item.refId}`} className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white text-left shadow-sm transition-shadow hover:shadow-md">
                  <button onClick={() => kind === "dressjewelry" ? setDressModalItem(item._dress) : addToCart(kind, item)} className="block w-full text-left">
                    <div className="relative aspect-[4/3] bg-gray-50">
                      {item.image?.url ? (
                        <Image src={item.image.url} alt="" fill className="object-cover" sizes="200px" />
                      ) : (
                        <span className="absolute inset-0 grid place-items-center text-gray-200"><ShoppingCart className="h-7 w-7" /></span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="line-clamp-1 text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-brand-600">{formatRs(item.sellingPrice, 0)}</p>
                    </div>
                  </button>

                  {/* Quick-sale toggle (dress items can't be quick-sale) */}
                  {tab === "dressjewelry" ? null : tab === "quick" ? (
                    <button
                      onClick={() => toggleQuick(kind, item.refId)}
                      className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-gray-500 shadow hover:text-red-500"
                      title="Remove from quick sale"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleQuick(kind, item.refId)}
                      className={
                        "absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 shadow " +
                        (inQuick ? "text-gold-500" : "text-gray-400 hover:text-gold-500")
                      }
                      title={inQuick ? "In quick sale" : "Add to quick sale"}
                    >
                      <Star className="h-4 w-4" fill={inQuick ? "currentColor" : "none"} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------- Cart ---------------- */}
      <div className="lg:sticky lg:top-20 lg:h-fit">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="grid grid-cols-2 gap-2">
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            </div>
          </div>

          {/* Lines */}
          <div className="max-h-[38vh] overflow-y-auto px-4 py-2">
            {cart.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Tap items to add them here.</p>
            ) : (
              cart.map((l) => {
                const below = Number(l.unitPrice || 0) < Number(l.cost || 0);
                return (
                <div key={l.key} className="flex items-center gap-2 border-b border-gray-50 py-2 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-gray-900">{l.name}</p>
                    {l.kind === "dressjewelry" && (
                      <p className="text-[10px] text-gray-400">{l.bringDate} → {l.deliverDate}</p>
                    )}
                    <div className="mt-0.5 flex items-center gap-1">
                      <span className="text-xs text-gray-400">Rs.</span>
                      <input
                        type="number"
                        min={l.cost || 0}
                        value={l.unitPrice}
                        onChange={(e) => setPrice(l.key, e.target.value)}
                        title={`Cost: ${formatRs(l.cost || 0, 0)}`}
                        className={"w-20 rounded border px-1.5 py-0.5 text-xs focus:outline-none " + (below ? "border-red-400 bg-red-50 text-red-600" : "border-gray-200 text-gray-600")}
                      />
                      {below && <span className="text-[10px] text-red-500">below cost</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setQty(l.key, l.qty - 1)} className="grid h-6 w-6 place-items-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50"><Minus className="h-3 w-3" /></button>
                    <input
                      value={l.qty}
                      onChange={(e) => setQty(l.key, Number(e.target.value) || 1)}
                      className="w-9 rounded border border-gray-200 py-1 text-center text-sm focus:outline-none"
                    />
                    <button onClick={() => setQty(l.key, l.qty + 1)} className="grid h-6 w-6 place-items-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50"><Plus className="h-3 w-3" /></button>
                  </div>
                  <span className="w-20 text-right text-sm font-medium text-gray-900">{formatRs(Number(l.unitPrice || 0) * l.qty, 0)}</span>
                  <button onClick={() => removeLine(l.key)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
                );
              })
            )}
          </div>

          {/* Totals & payment */}
          <div className="space-y-2 border-t border-gray-100 px-4 py-3 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatRs(subTotal)}</span></div>

            <div className="flex items-center gap-2">
              <span className="text-gray-600">Discount</span>
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => setDiscountType((t) => (t === "amount" ? "percentage" : "amount"))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                  title={discountType === "amount" ? "Switch to %" : "Switch to Rs."}
                >
                  {discountType === "amount" ? <span className="text-xs font-semibold">Rs</span> : <Percent className="h-4 w-4" />}
                </button>
                <input
                  type="number" min="0" value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)} placeholder="0"
                  className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-right focus:border-brand-400 focus:outline-none"
                />
              </div>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-gray-500"><span>Discount applied</span><span>- {formatRs(discountAmount)}</span></div>
            )}

            <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-semibold text-gray-900">
              <span>Total</span><span>{formatRs(grandTotal)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Cash paid</span>
              <input
                type="number" min="0" value={cashPaid}
                onChange={(e) => setCashPaid(e.target.value)} placeholder="0"
                className="w-28 rounded-lg border border-gray-200 px-2 py-1.5 text-right focus:border-brand-400 focus:outline-none"
              />
            </div>
            <div className="flex justify-between font-medium text-green-600"><span>Change</span><span>{formatRs(change)}</span></div>
          </div>

          {/* Actions */}
          <div className="space-y-2 border-t border-gray-100 p-4">
            {hasDress && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">Dress/jewelry items must be billed to a customer. Use "Add to customer".</p>
            )}
            <Button variant="gold" className="w-full" onClick={() => { if (cart.length === 0) return flash("Cart is empty."); setAddCustomerOpen(true); }} disabled={saving}>
              <UserPlus className="h-4 w-4" /> Add to customer
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => save(false)} disabled={saving || hasDress}>
                <Check className="h-4 w-4" /> Save
              </Button>
              <Button className="flex-1" onClick={() => save(true)} disabled={saving || hasDress}>
                <Printer className="h-4 w-4" /> {saving ? "Saving..." : "Print bill"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Hidden printable receipt */}
      <Receipt bill={lastBill} salon={salon} />

      {/* Pick variant / dates / fit-price for a dress or jewelry item */}
      <DressBillingModal
        open={!!dressModalItem}
        item={dressModalItem}
        onClose={() => setDressModalItem(null)}
        onAdd={addDressToCart}
      />

      {/* Add current cart to a customer's account (credit) */}
      <AddToCustomerModal
        open={addCustomerOpen}
        onClose={() => setAddCustomerOpen(false)}
        cart={cart}
        discount={{ type: discountType, value: discountValue }}
        grandTotal={grandTotal}
        onCreated={(bill, customer) => {
          setAddCustomerOpen(false);
          resetCart();
          flash(`Added to ${customer.name}.`);
          setLastBill({ ...bill, customerName: customer.name });
          setTimeout(() => window.print(), 120);
        }}
      />
    </div>
  );
}
