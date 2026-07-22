"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Switch from "@/components/ui/Switch";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ImageUploader from "@/components/catalogue/ImageUploader";
import {
  Toolbar, THead, Td, Thumb, RowActions, FormFooter, Loading, Empty,
} from "@/components/catalogue/ProductsTab";
import { api } from "@/lib/utils/apiClient";
import { formatRs } from "@/lib/utils/currency";

const EMPTY = {
  name: "", category: "", images: [], description: "", delayChargePerDay: "",
  isDress: false, variants: [], active: true,
};
const NEW_VARIANT = { name: "", cost: "", sellingPrice: "", stock: 0, fit1: 0, fit2: 0, fit3: 0 };

export default function DressJewelryTab() {
  const [rows, setRows] = useState(null);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toRemove, setToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  async function load() {
    setRows(await api.get(`/api/dressjewelry${q ? `?q=${encodeURIComponent(q)}` : ""}`));
  }
  useEffect(() => { load().catch(() => setRows([])); }, [q]); // eslint-disable-line
  useEffect(() => { api.get("/api/categories?type=dressjewelry").then(setCategories).catch(() => {}); }, []);

  function openCreate() { setFormError(""); setModal({ mode: "create", data: { ...EMPTY, variants: [{ ...NEW_VARIANT }] } }); }
  function openEdit(it) {
    setFormError("");
    setModal({ mode: "edit", data: {
      id: it._id, name: it.name, category: it.category?._id || "", images: it.images || [],
      description: it.description || "", delayChargePerDay: it.delayChargePerDay || 0,
      isDress: it.isDress, variants: (it.variants || []).map((v) => ({ ...v })), active: it.active,
    } });
  }
  const upd = (patch) => setModal((m) => ({ ...m, data: { ...m.data, ...patch } }));

  function setVariant(i, patch) {
    setModal((m) => {
      const variants = m.data.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v));
      return { ...m, data: { ...m.data, variants } };
    });
  }
  const addVariant = () => setModal((m) => ({ ...m, data: { ...m.data, variants: [...m.data.variants, { ...NEW_VARIANT }] } }));
  const removeVariant = (i) => setModal((m) => ({ ...m, data: { ...m.data, variants: m.data.variants.filter((_, idx) => idx !== i) } }));

  async function save() {
    const d = modal.data;
    if (!d.name.trim()) return setFormError("Name is required.");
    const vs = d.variants.filter((v) => v.name.trim());
    if (vs.length === 0) return setFormError("Add at least one variant.");
    for (const v of vs) {
      if (v.sellingPrice === "" || v.sellingPrice == null) return setFormError(`Variant "${v.name}" needs a selling price.`);
      if (Number(v.sellingPrice) < Number(v.cost || 0)) return setFormError(`Variant "${v.name}" selling price is below cost.`);
    }
    setSaving(true); setFormError("");
    try {
      const payload = { ...d, category: d.category || null, variants: vs };
      if (modal.mode === "create") await api.post("/api/dressjewelry", payload);
      else await api.put("/api/dressjewelry", payload);
      setModal(null); await load();
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  }

  async function toggleActive(it) { await api.put("/api/dressjewelry", { id: it._id, active: !it.active }); load(); }
  async function confirmRemove() {
    setRemoving(true);
    try { await api.del(`/api/dressjewelry?id=${toRemove._id}`); setToRemove(null); await load(); }
    finally { setRemoving(false); }
  }

  return (
    <div>
      <Toolbar q={q} setQ={setQ} onAdd={openCreate} addLabel="Add item" placeholder="Search dress & jewelry" />

      {rows === null ? <Loading /> : rows.length === 0 ? <Empty label="No dress or jewelry yet." /> : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <THead cols={["", "Code", "Name", "Category", "Type", "Variants", "Delay/day", "Active", ""]} />
            <tbody className="divide-y divide-gray-100">
              {rows.map((it) => (
                <tr key={it._id} className="hover:bg-gray-50/60">
                  <Td><Thumb src={it.images?.[0]?.url} /></Td>
                  <Td className="font-mono text-xs text-gray-500">{it.code}</Td>
                  <Td className="font-medium text-gray-900">{it.name}</Td>
                  <Td className="text-gray-500">{it.category?.name || "—"}</Td>
                  <Td>{it.isDress ? "Dress" : "Jewelry"}</Td>
                  <Td>{it.variants?.length || 0}</Td>
                  <Td>{formatRs(it.delayChargePerDay, 0)}</Td>
                  <Td><Switch checked={it.active} onChange={() => toggleActive(it)} /></Td>
                  <Td><RowActions onEdit={() => openEdit(it)} onRemove={() => setToRemove(it)} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit item" : "Add dress / jewelry"}
        size="lg"
        footer={<FormFooter onCancel={() => setModal(null)} onSave={save} saving={saving} />}
      >
        {modal && (
          <div className="space-y-4">
            {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}
            <Input label="Name" value={modal.data.name} onChange={(e) => upd({ name: e.target.value })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Category" value={modal.data.category} onChange={(e) => upd({ category: e.target.value })}>
                <option value="">— None —</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Select>
              <Input label="Delay charge per day (Rs.)" type="number" min="0" value={modal.data.delayChargePerDay} onChange={(e) => upd({ delayChargePerDay: e.target.value })} />
            </div>
            <Input as="textarea" label="Description" value={modal.data.description} onChange={(e) => upd({ description: e.target.value })} />
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">Images (up to 5)</p>
              <ImageUploader value={modal.data.images} onChange={(imgs) => upd({ images: imgs })} multiple max={5} folder="salon/dressjewelry" />
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
              <Switch checked={modal.data.isDress} onChange={(v) => upd({ isDress: v })} />
              <span className="text-sm text-gray-700">This is a Dress <span className="text-gray-400">(adds 1st / 2nd / 3rd fit-on prices per variant)</span></span>
            </label>

            {/* Variants */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Variants</p>
                <button type="button" onClick={addVariant} className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-100"><Plus className="h-4 w-4" /> Add variant</button>
              </div>
              <div className="space-y-3">
                {modal.data.variants.map((v, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center gap-2">
                      <input value={v.name} onChange={(e) => setVariant(i, { name: e.target.value })} placeholder="Variant name (e.g. Red)"
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
                      <button type="button" onClick={() => removeVariant(i)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <LabeledNum label="Cost" value={v.cost} onChange={(val) => setVariant(i, { cost: val })} />
                      <LabeledNum label="Selling" value={v.sellingPrice} onChange={(val) => setVariant(i, { sellingPrice: val })} />
                      <LabeledNum label="Stock" value={v.stock} onChange={(val) => setVariant(i, { stock: val })} />
                    </div>
                    {modal.data.isDress && (
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <LabeledNum label="1st fit" value={v.fit1} onChange={(val) => setVariant(i, { fit1: val })} />
                        <LabeledNum label="2nd fit" value={v.fit2} onChange={(val) => setVariant(i, { fit2: val })} />
                        <LabeledNum label="3rd fit" value={v.fit3} onChange={(val) => setVariant(i, { fit3: val })} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Switch checked={modal.data.active} onChange={(v) => upd({ active: v })} label="Active" />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toRemove}
        title="Remove item"
        message={`Remove "${toRemove?.name}"? This cannot be undone.`}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
        loading={removing}
      />
    </div>
  );
}

function LabeledNum({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-gray-500">{label}</span>
      <input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-brand-400 focus:outline-none" />
    </label>
  );
}
