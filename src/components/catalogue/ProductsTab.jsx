"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Switch from "@/components/ui/Switch";
import Spinner from "@/components/ui/Spinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ImageUploader from "@/components/catalogue/ImageUploader";
import DiscountFields from "@/components/catalogue/DiscountFields";
import { api } from "@/lib/utils/apiClient";
import { formatRs } from "@/lib/utils/currency";

const EMPTY = {
  name: "", category: "", buyingPrice: "", sellingPrice: "", stock: 0,
  description: "", image: null, discount: { percentage: 0, note: "" }, active: true,
};

export default function ProductsTab() {
  const [rows, setRows] = useState(null);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null); // {mode, data}
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toRemove, setToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  async function load() {
    const data = await api.get(`/api/products${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    setRows(data);
  }
  useEffect(() => { load().catch(() => {}); }, [q]); // eslint-disable-line
  useEffect(() => { api.get("/api/categories?type=product").then(setCategories).catch(() => {}); }, []);

  function openCreate() { setFormError(""); setModal({ mode: "create", data: { ...EMPTY } }); }
  function openEdit(p) {
    setFormError("");
    setModal({
      mode: "edit",
      data: {
        id: p._id, name: p.name, category: p.category?._id || "",
        buyingPrice: p.buyingPrice, sellingPrice: p.sellingPrice, stock: p.stock,
        description: p.description || "", image: p.image || null,
        discount: p.discount || { percentage: 0, note: "" }, active: p.active,
      },
    });
  }

  async function save() {
    const d = modal.data;
    if (!d.name.trim()) return setFormError("Name is required.");
    if (d.buyingPrice === "" || d.sellingPrice === "") return setFormError("Both prices are required.");
    setSaving(true); setFormError("");
    try {
      const payload = { ...d, category: d.category || null };
      if (modal.mode === "create") await api.post("/api/products", payload);
      else await api.put("/api/products", payload);
      setModal(null);
      await load();
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  }

  async function toggleActive(p) {
    await api.put("/api/products", { id: p._id, active: !p.active });
    load();
  }

  async function confirmRemove() {
    setRemoving(true);
    try { await api.del(`/api/products?id=${toRemove._id}`); setToRemove(null); await load(); }
    finally { setRemoving(false); }
  }

  return (
    <div>
      <Toolbar q={q} setQ={setQ} onAdd={openCreate} addLabel="Add product" placeholder="Search products" />

      {rows === null ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty label="No products yet." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
          <table className="w-full min-w-[860px] text-sm">
            <THead cols={["", "Code", "Name", "Category", "Buying", "Selling", "Stock", "Discount", "Active", ""]} />
            <tbody className="divide-y divide-gray-100">
              {rows.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50/60">
                  <Td><Thumb src={p.image?.url} /></Td>
                  <Td className="font-mono text-xs text-gray-500">{p.code}</Td>
                  <Td className="font-medium text-gray-900">{p.name}</Td>
                  <Td className="text-gray-500">{p.category?.name || "—"}</Td>
                  <Td>{formatRs(p.buyingPrice, 0)}</Td>
                  <Td>{formatRs(p.sellingPrice, 0)}</Td>
                  <Td>{p.stock}</Td>
                  <Td>{p.discount?.percentage ? `${p.discount.percentage}%` : "—"}</Td>
                  <Td><Switch checked={p.active} onChange={() => toggleActive(p)} /></Td>
                  <Td><RowActions onEdit={() => openEdit(p)} onRemove={() => setToRemove(p)} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit product" : "Add product"}
        footer={<FormFooter onCancel={() => setModal(null)} onSave={save} saving={saving} />}
      >
        {modal && (
          <div className="space-y-4">
            {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}
            <Input label="Name" value={modal.data.name} onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Category" value={modal.data.category} onChange={(e) => setModal({ ...modal, data: { ...modal.data, category: e.target.value } })}>
                <option value="">— None —</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Select>
              <Input label="Stock" type="number" min="0" value={modal.data.stock} onChange={(e) => setModal({ ...modal, data: { ...modal.data, stock: Number(e.target.value) } })} />
              <Input label="Buying price (Rs.)" type="number" min="0" value={modal.data.buyingPrice} onChange={(e) => setModal({ ...modal, data: { ...modal.data, buyingPrice: e.target.value } })} />
              <Input label="Selling price (Rs.)" type="number" min="0" value={modal.data.sellingPrice} onChange={(e) => setModal({ ...modal, data: { ...modal.data, sellingPrice: e.target.value } })} />
            </div>
            <Input as="textarea" label="Description (optional)" value={modal.data.description} onChange={(e) => setModal({ ...modal, data: { ...modal.data, description: e.target.value } })} />
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">Image</p>
              <ImageUploader value={modal.data.image} onChange={(img) => setModal({ ...modal, data: { ...modal.data, image: img } })} folder="salon/products" />
            </div>
            <DiscountFields value={modal.data.discount} onChange={(d) => setModal({ ...modal, data: { ...modal.data, discount: d } })} />
            <Switch checked={modal.data.active} onChange={(v) => setModal({ ...modal, data: { ...modal.data, active: v } })} label="Active" />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toRemove}
        title="Remove product"
        message={`Remove "${toRemove?.name}"? This cannot be undone.`}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
        loading={removing}
      />
    </div>
  );
}

/* ---- small shared table/tab helpers (also imported by the other tabs) ---- */
export function Toolbar({ q, setQ, onAdd, addLabel, placeholder }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <Button onClick={onAdd} className="shrink-0"><Plus className="h-4 w-4" /> {addLabel}</Button>
    </div>
  );
}
export function THead({ cols }) {
  return (
    <thead>
      <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs uppercase tracking-wide text-gray-400">
        {cols.map((c, i) => <th key={i} className="px-4 py-3 font-medium">{c}</th>)}
      </tr>
    </thead>
  );
}
export function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
export function Thumb({ src }) {
  return src ? (
    <Image src={src} alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
  ) : (
    <span className="grid h-10 w-10 place-items-center rounded-lg bg-gray-100 text-gray-300">—</span>
  );
}
export function RowActions({ onEdit, onRemove }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onEdit} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-500"><Pencil className="h-4 w-4" /></button>
      <button onClick={onRemove} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}
export function FormFooter({ onCancel, onSave, saving }) {
  return (
    <>
      <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
      <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
    </>
  );
}
export function Loading() {
  return <div className="grid place-items-center py-16 text-brand-400"><Spinner className="h-7 w-7" /></div>;
}
export function Empty({ label }) {
  return <p className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-gray-400">{label}</p>;
}
