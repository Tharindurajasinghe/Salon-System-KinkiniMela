"use client";

import { useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Switch from "@/components/ui/Switch";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ImageUploader from "@/components/catalogue/ImageUploader";
import DiscountFields from "@/components/catalogue/DiscountFields";
import TimeSlotsEditor from "@/components/catalogue/TimeSlotsEditor";
import {
  Toolbar, THead, Td, Thumb, RowActions, FormFooter, Loading, Empty,
} from "@/components/catalogue/ProductsTab";
import { api } from "@/lib/utils/apiClient";
import { formatRs } from "@/lib/utils/currency";

const EMPTY = {
  name: "", category: "", cost: "", sellingPrice: "", consultationNeeded: false, timeSpendMin: 30, maxBookings: 1,
  description: "", image: null, timeSlots: [], discount: { percentage: 0, note: "" }, active: true,
};

export default function ServicesTab() {
  const [rows, setRows] = useState(null);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toRemove, setToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  async function load() {
    const data = await api.get(`/api/services${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    setRows(data);
  }
  useEffect(() => { load().catch(() => {}); }, [q]); // eslint-disable-line
  useEffect(() => { api.get("/api/categories?type=service").then(setCategories).catch(() => {}); }, []);

  function openCreate() { setFormError(""); setModal({ mode: "create", data: { ...EMPTY, timeSlots: [] } }); }
  function openEdit(s) {
    setFormError("");
    setModal({
      mode: "edit",
      data: {
        id: s._id, name: s.name, category: s.category?._id || "", cost: s.cost,
        sellingPrice: s.sellingPrice, consultationNeeded: s.consultationNeeded, timeSpendMin: s.timeSpendMin, maxBookings: s.maxBookings || 1, description: s.description || "",
        image: s.image || null, timeSlots: s.timeSlots || [],
        discount: s.discount || { percentage: 0, note: "" }, active: s.active,
      },
    });
  }

  async function save() {
    const d = modal.data;
    if (!d.name.trim()) return setFormError("Name is required.");
    if (d.sellingPrice === "") return setFormError("Selling price is required.");
    if (Number(d.sellingPrice) < Number(d.cost || 0)) return setFormError("Selling price cannot be below cost.");
    setSaving(true); setFormError("");
    try {
      const payload = { ...d, category: d.category || null };
      if (modal.mode === "create") await api.post("/api/services", payload);
      else await api.put("/api/services", payload);
      setModal(null); await load();
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  }

  async function toggleActive(s) { await api.put("/api/services", { id: s._id, active: !s.active }); load(); }
  async function confirmRemove() {
    setRemoving(true);
    try { await api.del(`/api/services?id=${toRemove._id}`); setToRemove(null); await load(); }
    finally { setRemoving(false); }
  }
  const upd = (patch) => setModal((m) => ({ ...m, data: { ...m.data, ...patch } }));

  return (
    <div>
      <Toolbar q={q} setQ={setQ} onAdd={openCreate} addLabel="Add service" placeholder="Search services" />

      {rows === null ? <Loading /> : rows.length === 0 ? <Empty label="No services yet." /> : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
          <table className="w-full min-w-[880px] text-sm">
            <THead cols={["", "Code", "Name", "Category", "Cost", "Selling", "Time", "Slots", "Discount", "Active", ""]} />
            <tbody className="divide-y divide-gray-100">
              {rows.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50/60">
                  <Td><Thumb src={s.image?.url} /></Td>
                  <Td className="font-mono text-xs text-gray-500">{s.code}</Td>
                  <Td className="font-medium text-gray-900">{s.name}</Td>
                  <Td className="text-gray-500">{s.category?.name || "—"}</Td>
                  <Td className="text-gray-500">{formatRs(s.cost, 0)}</Td>
                  <Td>{formatRs(s.sellingPrice, 0)}</Td>
                  <Td>{s.timeSpendMin}m</Td>
                  <Td>{s.timeSlots?.length || 0}</Td>
                  <Td>{s.discount?.percentage ? `${s.discount.percentage}%` : "—"}</Td>
                  <Td><Switch checked={s.active} onChange={() => toggleActive(s)} /></Td>
                  <Td><RowActions onEdit={() => openEdit(s)} onRemove={() => setToRemove(s)} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit service" : "Add service"}
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
              <Input label="Time spent (minutes)" type="number" min="0" value={modal.data.timeSpendMin} onChange={(e) => upd({ timeSpendMin: Number(e.target.value) })} />
              <Input label="Max bookings per slot" type="number" min="1" value={modal.data.maxBookings} onChange={(e) => upd({ maxBookings: Math.max(1, Number(e.target.value) || 1) })} />
              <Input label="Cost (Rs.)" type="number" min="0" value={modal.data.cost} onChange={(e) => upd({ cost: e.target.value })} />
              <Input label="Selling price (Rs.)" type="number" min="0" value={modal.data.sellingPrice} onChange={(e) => upd({ sellingPrice: e.target.value })} />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
              <Switch checked={modal.data.consultationNeeded} onChange={(v) => upd({ consultationNeeded: v })} />
              <span className="text-sm text-gray-700">Consultation needed <span className="text-gray-400">(price may change; shown in red on the website)</span></span>
            </label>
            <Input as="textarea" label="Description" value={modal.data.description} onChange={(e) => upd({ description: e.target.value })} />
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">Image</p>
              <ImageUploader value={modal.data.image} onChange={(img) => upd({ image: img })} folder="salon/services" />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">Available time slots</p>
              <TimeSlotsEditor value={modal.data.timeSlots} onChange={(slots) => upd({ timeSlots: slots })} />
            </div>
            <DiscountFields value={modal.data.discount} onChange={(d) => upd({ discount: d })} />
            <Switch checked={modal.data.active} onChange={(v) => upd({ active: v })} label="Active" />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toRemove}
        title="Remove service"
        message={`Remove "${toRemove?.name}"? This cannot be undone.`}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
        loading={removing}
      />
    </div>
  );
}
