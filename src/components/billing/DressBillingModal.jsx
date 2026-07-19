"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { formatRs } from "@/lib/utils/currency";

function today() { return new Date().toISOString().slice(0, 10); }

/**
 * Adds a dress/jewelry variant to the POS cart. Asks for bring date (default
 * today), deliver date and the variant; for dresses, also lets the cashier
 * pick the normal or 1st/2nd/3rd fit-on price.
 */
export default function DressBillingModal({ open, item, onClose, onAdd }) {
  const [variantName, setVariantName] = useState("");
  const [bringDate, setBringDate] = useState(today());
  const [deliverDate, setDeliverDate] = useState(today());
  const [qty, setQty] = useState(1);
  const [priceKey, setPriceKey] = useState("sellingPrice");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && item) {
      setVariantName(item.variants?.[0]?.name || "");
      setBringDate(today()); setDeliverDate(today()); setQty(1); setPriceKey("sellingPrice"); setError("");
    }
  }, [open, item]);

  if (!item) return null;
  const variant = item.variants.find((v) => v.name === variantName);

  const PRICE_OPTIONS = item.isDress
    ? [
        { key: "sellingPrice", label: "Normal" },
        { key: "fit1", label: "1st fit" },
        { key: "fit2", label: "2nd fit" },
        { key: "fit3", label: "3rd fit" },
      ]
    : [{ key: "sellingPrice", label: "Normal" }];

  const unitPrice = variant ? Number(variant[priceKey] || 0) : 0;

  function add() {
    setError("");
    if (!variant) return setError("Select a variant.");
    if (deliverDate < bringDate) return setError("Deliver date cannot be before the bring date.");
    onAdd({
      dressItem: item,
      variantName: variant.name,
      bringDate,
      deliverDate,
      unitPrice: unitPrice || variant.sellingPrice,
      cost: variant.cost || 0,
      delayChargePerDay: item.delayChargePerDay || 0,
      qty: Number(qty),
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Add — ${item.name}`}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={add}>Add to cart</Button></>}
    >
      <div className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <Select label="Variant" value={variantName} onChange={(e) => setVariantName(e.target.value)}>
          {item.variants.map((v) => <option key={v._id} value={v.name}>{v.name} — {formatRs(v.sellingPrice, 0)} ({v.stock} in stock)</option>)}
        </Select>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Bring date" type="date" value={bringDate} onChange={(e) => { setBringDate(e.target.value); if (deliverDate < e.target.value) setDeliverDate(e.target.value); }} />
          <Input label="Deliver date" type="date" min={bringDate} value={deliverDate} onChange={(e) => setDeliverDate(e.target.value)} />
        </div>

        <Input label="No. of items" type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />

        {item.isDress && (
          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700">Price option</p>
            <div className="grid grid-cols-4 gap-2">
              {PRICE_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setPriceKey(o.key)}
                  className={"rounded-lg border px-2 py-2 text-center text-xs " + (priceKey === o.key ? "border-brand-400 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:bg-gray-50")}
                >
                  <span className="block font-medium">{o.label}</span>
                  <span className="block text-[11px] text-gray-400">{formatRs(variant?.[o.key] || 0, 0)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between rounded-xl bg-brand-50 px-4 py-2.5 text-sm">
          <span className="text-gray-600">Unit price ({qty} ×)</span>
          <span className="font-semibold text-gray-900">{formatRs(unitPrice * qty, 0)}</span>
        </div>
      </div>
    </Modal>
  );
}
