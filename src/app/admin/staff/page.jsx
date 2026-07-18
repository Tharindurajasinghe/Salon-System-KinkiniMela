"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Shield, User as UserIcon } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Switch from "@/components/ui/Switch";
import Spinner from "@/components/ui/Spinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { api } from "@/lib/utils/apiClient";
import { NAV_ITEMS, DEFAULT_CASHIER_PAGES, ADMIN_ONLY_PAGES } from "@/lib/adminNav";

// Pages an admin can grant to a cashier (defaults are always on; admin-only never).
const GRANTABLE = NAV_ITEMS.filter(
  (i) => !ADMIN_ONLY_PAGES.includes(i.key) && !DEFAULT_CASHIER_PAGES.includes(i.key)
);

const EMPTY = { username: "", password: "", confirm: "", role: "cashier", pageAccess: [], active: true };

export default function StaffPage() {
  const [rows, setRows] = useState(null);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toRemove, setToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  async function load() { setRows(await api.get("/api/admin/staff")); }
  useEffect(() => { load().catch(() => setRows([])); }, []);

  function openCreate() { setError(""); setModal({ mode: "create", data: { ...EMPTY, pageAccess: [] } }); }
  function openEdit(u) {
    setError("");
    setModal({ mode: "edit", data: { id: u._id, username: u.username, password: "", confirm: "", role: u.role, pageAccess: u.pageAccess || [], active: u.active } });
  }

  const upd = (patch) => setModal((m) => ({ ...m, data: { ...m.data, ...patch } }));
  function toggleAccess(key) {
    setModal((m) => {
      const set = new Set(m.data.pageAccess);
      set.has(key) ? set.delete(key) : set.add(key);
      return { ...m, data: { ...m.data, pageAccess: [...set] } };
    });
  }

  async function save() {
    const d = modal.data;
    if (!d.username.trim()) return setError("Username is required.");
    if (modal.mode === "create" && !d.password) return setError("Password is required.");
    if (d.password && d.password !== d.confirm) return setError("Passwords do not match.");
    setSaving(true); setError("");
    try {
      const payload = { username: d.username, role: d.role, pageAccess: d.pageAccess, active: d.active };
      if (d.password) payload.password = d.password;
      if (modal.mode === "create") await api.post("/api/admin/staff", payload);
      else await api.put("/api/admin/staff", { id: d.id, ...payload });
      setModal(null); await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function toggleActive(u) {
    try { await api.put("/api/admin/staff", { id: u._id, active: !u.active }); await load(); }
    catch (e) { alert(e.message); }
  }

  async function confirmRemove() {
    setRemoving(true);
    try { await api.del(`/api/admin/staff?id=${toRemove._id}`); setToRemove(null); await load(); }
    catch (e) { alert(e.message); }
    finally { setRemoving(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{rows?.length || 0} staff members</p>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add staff</Button>
      </div>

      {rows === null ? (
        <div className="grid place-items-center py-16 text-brand-400"><Spinner className="h-7 w-7" /></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Extra access</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={"inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium " + (u.role === "admin" ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-600")}>
                      {u.role === "admin" ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />} {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {u.role === "admin" ? "All pages" : (u.pageAccess?.length ? u.pageAccess.join(", ") : "Billing, Orders")}
                  </td>
                  <td className="px-4 py-3"><Switch checked={u.active} onChange={() => toggleActive(u)} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(u)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-500"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setToRemove(u)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit staff" : "Add staff"}
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
            <Input label="Username" value={modal.data.username} onChange={(e) => upd({ username: e.target.value })} autoComplete="off" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={modal.mode === "edit" ? "New password (optional)" : "Password"} type="password" value={modal.data.password} onChange={(e) => upd({ password: e.target.value })} autoComplete="new-password" />
              <Input label="Confirm password" type="password" value={modal.data.confirm} onChange={(e) => upd({ confirm: e.target.value })} autoComplete="new-password" />
            </div>
            <Select label="Role" value={modal.data.role} onChange={(e) => upd({ role: e.target.value })}>
              <option value="cashier">Cashier</option>
              <option value="admin">Admin</option>
            </Select>

            {modal.data.role === "cashier" && (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Page access</p>
                <p className="mb-2 text-xs text-gray-400">Cashiers always have Dashboard, Billing and Orders. Grant more below.</p>
                <div className="grid grid-cols-2 gap-2">
                  {GRANTABLE.map((p) => {
                    const on = modal.data.pageAccess.includes(p.key);
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => toggleAccess(p.key)}
                        className={"rounded-lg border px-3 py-2 text-left text-sm transition-colors " + (on ? "border-brand-400 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:bg-gray-50")}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Switch checked={modal.data.active} onChange={(v) => upd({ active: v })} label="Active" />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toRemove}
        title="Remove staff"
        message={`Remove "${toRemove?.username}"? They will no longer be able to log in.`}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
        loading={removing}
      />
    </div>
  );
}
