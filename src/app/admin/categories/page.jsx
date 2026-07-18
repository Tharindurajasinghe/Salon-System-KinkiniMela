"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { api } from "@/lib/utils/apiClient";

/**
 * Categories page — manage product and service categories side by side.
 * A category has only a name; each belongs to a type (product | service).
 */
export default function CategoriesPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <CategoryColumn type="product" title="Product categories" />
      <CategoryColumn type="service" title="Service categories" />
    </div>
  );
}

function CategoryColumn({ type, title }) {
  const [items, setItems] = useState(null);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [toRemove, setToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  async function load() {
    const data = await api.get(`/api/categories?type=${type}`);
    setItems(data);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []); // eslint-disable-line

  async function add() {
    if (!name.trim()) return;
    setAdding(true);
    setError("");
    try {
      await api.post("/api/categories", { name, type });
      setName("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  }

  async function saveEdit(id) {
    if (!editValue.trim()) return;
    try {
      await api.put("/api/categories", { id, name: editValue });
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function confirmRemove() {
    setRemoving(true);
    try {
      await api.del(`/api/categories?id=${toRemove._id}`);
      setToRemove(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="font-display text-lg text-gray-900">{title}</h2>

      <div className="mt-4 flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New category name"
        />
        <Button onClick={add} disabled={adding} className="shrink-0">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4">
        {items === null ? (
          <div className="grid place-items-center py-8 text-brand-400"><Spinner /></div>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No categories yet. Add your first above.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((cat) => (
              <li key={cat._id} className="flex items-center gap-2 py-2.5">
                {editingId === cat._id ? (
                  <>
                    <input
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(cat._id)}
                      autoFocus
                    />
                    <button onClick={() => saveEdit(cat._id)} className="rounded-lg p-1.5 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditingId(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-gray-800">{cat.name}</span>
                    <button
                      onClick={() => { setEditingId(cat._id); setEditValue(cat.name); }}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-500"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setToRemove(cat)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!toRemove}
        title="Remove category"
        message={`Remove "${toRemove?.name}"? Items using it will keep their data but lose this label.`}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
        loading={removing}
      />
    </Card>
  );
}
