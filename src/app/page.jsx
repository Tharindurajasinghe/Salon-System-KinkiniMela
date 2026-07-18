"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Scissors, Gift, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { useSalon } from "@/context/SalonProvider";

/**
 * Home page. The hero is the thesis: an elegant rose-to-plum gradient with a
 * Playfair headline and a gold hairline — the salon's identity, not a template.
 * Motion is restrained (a load fade-up + gentle scroll reveals) and respects
 * reduced-motion preferences.
 */
export default function HomePage() {
  const { t, lang } = useLanguage();
  const salon = useSalon();
  const reduce = useReducedMotion();

  const rise = reduce
    ? {}
    : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.6 } };

  const howText = salon?.howToGetService?.[lang] || salon?.howToGetService?.en || "";

  return (
    <div>
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-100/60">
        {/* ambient orbs */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-gold-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-brand-600 ring-1 ring-brand-200">
              <Sparkles className="h-3.5 w-3.5 text-gold-500" /> {salon?.tagline || t("home.heroSubtitle")}
            </span>
            <div className="mx-auto mt-6 h-px w-14 bg-gold-500" />
            <h1 className="mt-6 font-display text-5xl leading-tight text-gray-900 sm:text-6xl">
              {t("home.heroTitle")}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-gray-500">{t("home.heroSubtitle")}</p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/services" className="group inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-600">
                {t("home.heroCtaServices")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/packages" className="rounded-full border border-brand-300 bg-white/60 px-6 py-3 text-sm font-medium text-brand-700 hover:bg-white">
                {t("home.heroCtaPackages")}
              </Link>
              <Link href="/products" className="rounded-full px-6 py-3 text-sm font-medium text-gray-600 hover:text-brand-600">
                {t("home.heroCtaProducts")}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- How to get our service ---------------- */}
      {howText && (
        <motion.section {...rise} className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="font-display text-3xl text-gray-900">{t("home.howTitle")}</h2>
          <div className="mx-auto mt-4 h-px w-10 bg-brand-200" />
          <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-gray-600">{howText}</p>
        </motion.section>
      )}

      {/* ---------------- Feature cards ---------------- */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-5 sm:grid-cols-3">
          <FeatureCard href="/services" Icon={Scissors} title={t("home.featServices")} rise={rise} />
          <FeatureCard href="/packages" Icon={Gift} title={t("home.featPackages")} rise={rise} accent />
          <FeatureCard href="/products" Icon={ShoppingBag} title={t("home.featProducts")} rise={rise} />
        </div>
      </section>

      {/* ---------------- CTA band ---------------- */}
      <motion.section {...rise} className="mx-auto max-w-7xl px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-brand-900 px-8 py-14 text-center text-brand-50">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-gold-500/20 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-4xl">{t("home.ctaTitle")}</h2>
            <p className="mt-3 text-brand-200">{t("home.ctaText")}</p>
            <Link href="/services" className="mt-7 inline-flex items-center gap-2 rounded-full bg-gold-500 px-7 py-3 text-sm font-semibold text-brand-900 hover:bg-gold-400">
              {t("home.heroCtaServices")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function FeatureCard({ href, Icon, title, accent, rise }) {
  return (
    <motion.div {...rise}>
      <Link
        href={href}
        className={
          "group flex h-44 flex-col justify-between rounded-3xl border p-6 transition-shadow hover:shadow-lg " +
          (accent ? "border-transparent bg-gradient-to-br from-brand-500 to-brand-700 text-white" : "border-gray-100 bg-white")
        }
      >
        <span className={"grid h-12 w-12 place-items-center rounded-2xl " + (accent ? "bg-white/15" : "bg-brand-50 text-brand-600")}>
          <Icon className="h-6 w-6" />
        </span>
        <span className="flex items-center justify-between font-display text-2xl">
          {title}
          <ArrowRight className="h-5 w-5 opacity-60 transition-transform group-hover:translate-x-1" />
        </span>
      </Link>
    </motion.div>
  );
}
