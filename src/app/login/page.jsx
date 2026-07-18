"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import { api } from "@/lib/utils/apiClient";

/**
 * Staff login. Elegant split screen: an atmospheric brand panel on the left
 * (desktop) and a focused form on the right. Customers never see this page.
 */
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get("next") || "/admin";

  const [salon, setSalon] = useState({ salonName: "Salon", tagline: "" });
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load public brand info for the wordmark.
  useEffect(() => {
    api.get("/api/public/salon").then(setSalon).catch(() => {});
  }, []);

  async function handleSubmit() {
    setError("");
    if (!form.username || !form.password) {
      setError("Enter your username and password.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/login", form);
      router.replace(nextUrl);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel (desktop only) */}
      <div className="relative hidden w-1/2 overflow-hidden bg-brand-900 lg:block">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-brand-50">
          <div className="flex items-center gap-3">
            {salon.logo?.url && (
              <Image
                src={salon.logo.url}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover ring-2 ring-gold-500/60"
              />
            )}
            <span className="font-display text-2xl">{salon.salonName}</span>
          </div>
          <div>
            <div className="mb-4 h-px w-16 bg-gold-500" />
            <h2 className="max-w-sm font-display text-4xl leading-tight">
              Manage your salon with calm and clarity.
            </h2>
            <p className="mt-4 max-w-sm text-brand-200">
              {salon.tagline || "Billing, bookings and everything in between — in one place."}
            </p>
          </div>
          <p className="text-xs text-brand-300">Powered by TAR Solutions</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center bg-gradient-to-b from-brand-50 to-white px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="font-display text-2xl text-brand-700">{salon.salonName}</span>
          </div>

          <h1 className="font-display text-3xl text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to the admin panel.</p>

          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Username</span>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  autoComplete="username"
                  placeholder="admin"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Password</span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? "text" : "password"}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
