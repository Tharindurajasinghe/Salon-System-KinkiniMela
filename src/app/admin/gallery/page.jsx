"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ImageUploader from "@/components/catalogue/ImageUploader";
import { api } from "@/lib/utils/apiClient";

const EMPTY = { name: "", image: null };

export default function GalleryAdminPage() {
  const [rows, setRows] = useState(null);
  const [modal, setModal] = useState(null); // {mode, data}
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toRemove, setToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  async function load() { setRows(await api.get("/api/admin/gallery")); }
  useEffect(() => { load().catch(() => setRows([])); }, []);

  function openCreate() { setError(""); setModal({ mode: "create", data: { ...EMPTY } }); }
  function openEdit(p) { setError(""); setModal({ mode: "edit", data: { id: p._id, name: p.name, image: p.image } }); }

  async function save() {
    const d = modal.data;
    if (!d.name.trim()) return setError("Name is required.");
    if (!d.image?.url) return setError("Please upload an image.");
    setSaving(true); setError("");
    try {
      if (modal.mode === "create") await api.post("/api/admin/gallery", d);
      else await api.put("/api/admin/gallery", d);
      setModal(null); await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function confirmRemove() {
    setRemoving(true);
    try { await api.del(`/api/admin/gallery?id=${toRemove._id}`); setToRemove(null); await load(); }
    finally { setRemoving(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{rows?.length || 0} photos</p>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add photo</Button>
      </div>

      {rows === null ? (
        <div className="grid place-items-center py-16 text-brand-400"><Spinner className="h-7 w-7" /></div>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-gray-400">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((p) => (
            <div key={p._id} className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="relative aspect-square bg-gray-50">
                {p.image?.url ? <Image src={p.image.url} alt={p.name} fill className="object-cover" sizes="240px" /> : <span className="absolute inset-0 grid place-items-center text-gray-200"><ImageIcon className="h-8 w-8" /></span>}
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => openEdit(p)} className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-gray-600 shadow hover:text-brand-500"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setToRemove(p)} className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-gray-600 shadow hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="line-clamp-1 px-3 py-2 text-sm text-gray-700">{p.name}</p>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit photo" : "Add photo"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </>
        }
      >
        {modal && (
          <div className="space-y-4">
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <Input label="Name" value={modal.data.name} onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })} />
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">Image</p>
              <ImageUploader value={modal.data.image} onChange={(img) => setModal({ ...modal, data: { ...modal.data, image: img } })} folder="salon/gallery" />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toRemove}
        title="Remove photo"
        message={`Remove "${toRemove?.name}"?`}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
        loading={removing}
      />
    </div>
  );
}
