"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { UploadCloud, Check, MessageSquare, ImageIcon, CircleAlert } from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Tabs from "@/components/ui/Tabs";
import Spinner from "@/components/ui/Spinner";
import { api } from "@/lib/utils/apiClient";

/**
 * Settings page — two tabs:
 *   1. Salon info  → editable, saved to the DB, used globally (navbar/footer/bills).
 *   2. Integrations → read-only status of SMS/Cloudinary (secrets live in .env).
 */
export default function SettingsPage() {
  const [tab, setTab] = useState("salon");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState(null);
  const [integrations, setIntegrations] = useState({});

  // Load current settings.
  useEffect(() => {
    api
      .get("/api/settings")
      .then(({ settings, integrations }) => {
        setForm({
          salonName: settings.salonName || "",
          tagline: settings.tagline || "",
          phone: settings.phone || "",
          whatsapp: settings.whatsapp || "",
          email: settings.email || "",
          adminSmsPhone: settings.adminSmsPhone || "",
          addressLine1: settings.addressLine1 || "",
          addressLine2: settings.addressLine2 || "",
          locationUrl: settings.locationUrl || "",
          logo: settings.logo || null,
          howToGetService: settings.howToGetService || { en: "", si: "" },
          contactMessage: settings.contactMessage || { en: "", si: "" },
        });
        setIntegrations(integrations || {});
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  function setNested(field, lang, value) {
    setForm((f) => ({ ...f, [field]: { ...f[field], [lang]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await api.put("/api/settings", form);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <div className="grid place-items-center py-24 text-brand-500">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Tabs
        tabs={[
          { key: "salon", label: "Salon info" },
          { key: "integrations", label: "Integrations" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {tab === "salon" ? (
        <SalonInfoTab
          form={form}
          set={set}
          setNested={setNested}
          onSave={handleSave}
          saving={saving}
          savedAt={savedAt}
        />
      ) : (
        <IntegrationsTab integrations={integrations} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Salon info tab                                                     */
/* ------------------------------------------------------------------ */
function SalonInfoTab({ form, set, setNested, onSave, saving, savedAt }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await api.post("/api/upload", { image: dataUrl, folder: "salon/logo" });
      set("logo", res);
    } catch {
      /* surfaced via disabled state; keep it simple */
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Logo */}
      <Card className="p-5">
        <SectionTitle icon={ImageIcon} title="Logo" hint="Shown in the nav bar, footer and on printed bills." />
        <div className="mt-4 flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
            {form.logo?.url ? (
              <Image src={form.logo.url} alt="Logo" width={80} height={80} className="h-20 w-20 object-cover" />
            ) : (
              <ImageIcon className="h-7 w-7 text-gray-300" />
            )}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleLogo} />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <UploadCloud className="h-4 w-4" />
              {uploading ? "Uploading..." : form.logo?.url ? "Replace logo" : "Upload logo"}
            </Button>
            <p className="mt-1.5 text-xs text-gray-400">PNG or JPG, square works best.</p>
          </div>
        </div>
      </Card>

      {/* Identity */}
      <Card className="p-5">
        <SectionTitle title="Identity" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input label="Salon name" value={form.salonName} onChange={(e) => set("salonName", e.target.value)} />
          <Input label="Tagline" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
        </div>
      </Card>

      {/* Contact */}
      <Card className="p-5">
        <SectionTitle title="Contact" hint="Displayed on the Contact Us page and used for bookings." />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0XX XXX XXXX" />
          <Input label="WhatsApp" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          <Input
            label="Admin SMS number"
            value={form.adminSmsPhone}
            onChange={(e) => set("adminSmsPhone", e.target.value)}
            placeholder="Receives new order / booking alerts"
          />
          <Input label="Address line 1" value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} />
          <Input label="Address line 2" value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} />
          <div className="sm:col-span-2">
            <Input
              label="Google location URL"
              value={form.locationUrl}
              onChange={(e) => set("locationUrl", e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </div>
        </div>
      </Card>

      {/* Bilingual copy */}
      <Card className="p-5">
        <SectionTitle icon={MessageSquare} title="Home page — “How to get our service”" hint="Shown on the customer home page." />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input as="textarea" label="English" value={form.howToGetService.en} onChange={(e) => setNested("howToGetService", "en", e.target.value)} />
          <Input as="textarea" label="සිංහල (Sinhala)" value={form.howToGetService.si} onChange={(e) => setNested("howToGetService", "si", e.target.value)} />
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle icon={MessageSquare} title="Contact page message" hint="A short note shown on the Contact Us page." />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input as="textarea" label="English" value={form.contactMessage.en} onChange={(e) => setNested("contactMessage", "en", e.target.value)} />
          <Input as="textarea" label="සිංහල (Sinhala)" value={form.contactMessage.si} onChange={(e) => setNested("contactMessage", "si", e.target.value)} />
        </div>
      </Card>

      {/* Save bar */}
      <div className="sticky bottom-4 flex items-center justify-end gap-3">
        {savedAt && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        <Button onClick={onSave} disabled={saving} size="lg">
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Integrations tab (read-only status)                                */
/* ------------------------------------------------------------------ */
function IntegrationsTab({ integrations }) {
  const rows = [
    {
      name: "SMS gateway",
      ok: integrations.smsConfigured,
      vars: ["SMS_API_KEY", "SMS_SENDER_ID", "SMS_API_URL"],
    },
    {
      name: "Cloudinary",
      ok: integrations.cloudinaryConfigured,
      vars: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
    },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          For security these keys are configured in the project <code>.env</code> file, not stored
          in the database. Update them there and redeploy to change them.
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {rows.map((row) => (
          <div key={row.name} className="rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{row.name}</p>
              <span
                className={
                  row.ok
                    ? "rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700"
                    : "rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500"
                }
              >
                {row.ok ? "Connected" : "Not configured"}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {row.vars.map((v) => (
                <code key={v} className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-500">
                  {v}
                </code>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                      */
/* ------------------------------------------------------------------ */
function SectionTitle({ icon: Icon, title, hint }) {
  return (
    <div>
      <p className="flex items-center gap-2 font-medium text-gray-900">
        {Icon && <Icon className="h-4 w-4 text-brand-500" />}
        {title}
      </p>
      {hint && <p className="mt-0.5 text-sm text-gray-500">{hint}</p>}
    </div>
  );
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
