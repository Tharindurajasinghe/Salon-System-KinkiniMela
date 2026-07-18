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
  name: "", category: "", price: "", profit: 0, timeSpendMin: 30,
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
        id: s._id, name: s.name, category: s.category?._id || "", price: s.price,
        profit: s.profit, timeSpendMin: s.timeSpendMin, description: s.description || "",
        image: s.image || null, timeSlots: s.timeSlots || [],
        discount: s.discount || { percentage: 0, note: "" }, active: s.active,
      },
    });
  }

  async function save() {
    const d = modal.data;
    if (!d.name.trim()) return setFormError("Name is required.");
    if (d.price === "") return setFormError("Price is required.");
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
            <THead cols={["", "Code", "Name", "Category", "Price", "Profit", "Time", "Slots", "Discount", "Active", ""]} />
            <tbody className="divide-y divide-gray-100">
              {rows.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50/60">
                  <Td><Thumb src={s.image?.url} /></Td>
                  <Td className="font-mono text-xs text-gray-500">{s.code}</Td>
                  <Td className="font-medium text-gray-900">{s.name}</Td>
                  <Td className="text-gray-500">{s.category?.name || "—"}</Td>
                  <Td>{formatRs(s.price, 0)}</Td>
                  <Td>{formatRs(s.profit, 0)}</Td>
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
              <Input label="Price (Rs.)" type="number" min="0" value={modal.data.price} onChange={(e) => upd({ price: e.target.value })} />
              <Input label="Profit (Rs.)" type="number" min="0" value={modal.data.profit} onChange={(e) => upd({ profit: Number(e.target.value) })} />
            </div>
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
