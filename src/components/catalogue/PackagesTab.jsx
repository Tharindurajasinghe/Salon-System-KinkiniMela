"use client";

import { useEffect, useState } from "react";
import Input from "@/components/ui/Input";
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
  name: "", price: "", profit: 0, timeSpendMin: 60, description: "",
  images: [], timeSlots: [], discount: { percentage: 0, note: "" }, active: true,
};

export default function PackagesTab() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toRemove, setToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  async function load() {
    const data = await api.get(`/api/packages${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    setRows(data);
  }
  useEffect(() => { load().catch(() => {}); }, [q]); // eslint-disable-line

  function openCreate() { setFormError(""); setModal({ mode: "create", data: { ...EMPTY, images: [], timeSlots: [] } }); }
  function openEdit(p) {
    setFormError("");
    setModal({
      mode: "edit",
      data: {
        id: p._id, name: p.name, price: p.price, profit: p.profit, timeSpendMin: p.timeSpendMin,
        description: p.description || "", images: p.images || [], timeSlots: p.timeSlots || [],
        discount: p.discount || { percentage: 0, note: "" }, active: p.active,
      },
    });
  }

  async function save() {
    const d = modal.data;
    if (!d.name.trim()) return setFormError("Name is required.");
    if (d.price === "") return setFormError("Price is required.");
    setSaving(true); setFormError("");
    try {
      if (modal.mode === "create") await api.post("/api/packages", d);
      else await api.put("/api/packages", d);
      setModal(null); await load();
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  }

  async function toggleActive(p) { await api.put("/api/packages", { id: p._id, active: !p.active }); load(); }
  async function confirmRemove() {
    setRemoving(true);
    try { await api.del(`/api/packages?id=${toRemove._id}`); setToRemove(null); await load(); }
    finally { setRemoving(false); }
  }
  const upd = (patch) => setModal((m) => ({ ...m, data: { ...m.data, ...patch } }));

  return (
    <div>
      <Toolbar q={q} setQ={setQ} onAdd={openCreate} addLabel="Add package" placeholder="Search packages" />

      {rows === null ? <Loading /> : rows.length === 0 ? <Empty label="No packages yet." /> : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <THead cols={["", "Code", "Name", "Price", "Profit", "Time", "Slots", "Discount", "Active", ""]} />
            <tbody className="divide-y divide-gray-100">
              {rows.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50/60">
                  <Td><Thumb src={p.images?.[0]?.url} /></Td>
                  <Td className="font-mono text-xs text-gray-500">{p.code}</Td>
                  <Td className="font-medium text-gray-900">{p.name}</Td>
                  <Td>{formatRs(p.price, 0)}</Td>
                  <Td>{formatRs(p.profit, 0)}</Td>
                  <Td>{p.timeSpendMin}m</Td>
                  <Td>{p.timeSlots?.length || 0}</Td>
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
        title={modal?.mode === "edit" ? "Edit package" : "Add package"}
        footer={<FormFooter onCancel={() => setModal(null)} onSave={save} saving={saving} />}
      >
        {modal && (
          <div className="space-y-4">
            {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}
            <Input label="Name" value={modal.data.name} onChange={(e) => upd({ name: e.target.value })} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Price (Rs.)" type="number" min="0" value={modal.data.price} onChange={(e) => upd({ price: e.target.value })} />
              <Input label="Profit (Rs.)" type="number" min="0" value={modal.data.profit} onChange={(e) => upd({ profit: Number(e.target.value) })} />
              <Input label="Time (minutes)" type="number" min="0" value={modal.data.timeSpendMin} onChange={(e) => upd({ timeSpendMin: Number(e.target.value) })} />
            </div>
            <Input as="textarea" label="Description" value={modal.data.description} onChange={(e) => upd({ description: e.target.value })} />
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">Images (up to 3)</p>
              <ImageUploader value={modal.data.images} onChange={(imgs) => upd({ images: imgs })} multiple max={3} folder="salon/packages" />
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
        title="Remove package"
        message={`Remove "${toRemove?.name}"? This cannot be undone.`}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
        loading={removing}
      />
    </div>
  );
}
