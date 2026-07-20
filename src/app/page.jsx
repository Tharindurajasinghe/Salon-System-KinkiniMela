"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Scissors, Gift, ShoppingBag, Gem, Images, CalendarCheck,
  Sparkles, ArrowRight, Star, Clock, ShieldCheck, Heart,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";

/* ---------- motion helpers ---------- */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = { show: { transition: { staggerChildren: 0.09 } } };

/* ---------- static structure (icons + links) ---------- */
const OFFER_META = [
  { href: "/services", icon: Scissors },
  { href: "/packages", icon: Gift },
  { href: "/products", icon: ShoppingBag },
  { href: "/dress-jewelry", icon: Gem },
  { href: "/gallery", icon: Images },
  { href: "/bookings", icon: CalendarCheck },
];
const WHY_META = [Star, Clock, ShieldCheck, Heart];

/* ---------- bilingual copy ---------- */
const COPY = {
  en: {
    heroEyebrow: "Beauty · Style · Elegance",
    heroTitle1: "Look your best,",
    heroTitle2: "feel your best.",
    heroSub: "Premium salon services, curated packages, and dress & jewelry rentals — all bookable online, all in one beautiful place.",
    book: "Book an appointment",
    dress: "Dress & Jewelry",
    offerEyebrow: "What we offer",
    offerTitle: "Everything you need, beautifully together",
    explore: "Explore",
    offerings: [
      { title: "Services", desc: "Cuts, colour, styling & treatments by our expert team." },
      { title: "Packages", desc: "Curated bundles for a complete, head-to-toe makeover." },
      { title: "Products", desc: "Salon-quality products to take your glow home." },
      { title: "Dress & Jewelry", desc: "Rent stunning outfits & jewelry for your special day." },
      { title: "Gallery", desc: "A look through our latest work and happy clients." },
      { title: "Your Bookings", desc: "Track and manage your appointments in one place." },
    ],
    featNew: "New",
    featTitle: "Dress & Jewelry, made for the occasion",
    featDesc: "Rent elegant dresses and dazzling jewelry for weddings, parties, and every celebration. Browse available pieces, pick your dates, and reserve online — effortlessly.",
    featBtn: "Browse Dress & Jewelry",
    whyEyebrow: "Why choose us",
    whyTitle: "A little luxury, every visit",
    why: [
      { title: "Expert stylists", desc: "A skilled team that keeps up with the latest trends." },
      { title: "Easy online booking", desc: "Reserve your slot in seconds, any time of day." },
      { title: "Quality you can trust", desc: "Premium products and hygienic, welcoming spaces." },
      { title: "Made for your moments", desc: "From everyday care to weddings and celebrations." },
    ],
    ctaTitle: "Ready to treat yourself?",
    ctaSub: "Book your next appointment or reserve a special-occasion look in just a few taps.",
    bookNow: "Book now",
    contact: "Contact us",
  },
  si: {
    heroEyebrow: "සුන්දරත්වය · විලාසිතාව · අලංකාරය",
    heroTitle1: "ඔබේ හොඳම පෙනුම,",
    heroTitle2: "ඔබේ හොඳම හැඟීම.",
    heroSub: "උසස් සැලෝන් සේවා, විශේෂ පැකේජ, සහ ඇඳුම් හා ආභරණ කුලියට — සියල්ල අන්තර්ජාලය ඔස්සේ වෙන්කරගත හැකි එකම ලස්සන ස්ථානයක.",
    book: "වේලාවක් වෙන්කරන්න",
    dress: "ඇඳුම් සහ ආභරණ",
    offerEyebrow: "අපගේ සේවාවන්",
    offerTitle: "ඔබට අවශ්‍ය සියල්ල, එකම තැනක ලස්සනට",
    explore: "බලන්න",
    offerings: [
      { title: "සේවා", desc: "කැපීම්, වර්ණ, ස්ටයිලින් සහ ප්‍රතිකාර — අපගේ ප්‍රවීණ කණ්ඩායම විසින්." },
      { title: "පැකේජ", desc: "සම්පූර්ණ පෙනුම වෙනසක් සඳහා විශේෂ පැකේජ." },
      { title: "නිෂ්පාදන", desc: "ඔබේ දීප්තිය නිවසට ගෙන යාමට සැලෝන් තත්ත්වයේ නිෂ්පාදන." },
      { title: "ඇඳුම් සහ ආභරණ", desc: "ඔබේ විශේෂ දිනය සඳහා ලස්සන ඇඳුම් හා ආභරණ කුලියට." },
      { title: "ගැලරිය", desc: "අපගේ නවතම වැඩ සහ සතුටු පාරිභෝගිකයින්." },
      { title: "ඔබගේ වෙන්කිරීම්", desc: "ඔබගේ වෙන්කිරීම් එකම තැනකින් කළමනාකරණය කරන්න." },
    ],
    featNew: "අලුත්",
    featTitle: "ඇඳුම් සහ ආභරණ, විශේෂ අවස්ථා සඳහා",
    featDesc: "විවාහ, සාද සහ සෑම සැමරුමක් සඳහාම අලංකාර ඇඳුම් සහ ආභරණ කුලියට ගන්න. පවතින භාණ්ඩ බලා, දින තෝරා, අන්තර්ජාලයෙන් පහසුවෙන් වෙන්කරගන්න.",
    featBtn: "ඇඳුම් සහ ආභරණ බලන්න",
    whyEyebrow: "ඇයි අපිව තෝරන්නේ",
    whyTitle: "සෑම පැමිණීමකදීම කුඩා සුඛෝපභෝගීත්වයක්",
    why: [
      { title: "ප්‍රවීණ ස්ටයිලිස්ට්වරු", desc: "නවතම විලාසිතා දන්නා දක්ෂ කණ්ඩායමක්." },
      { title: "පහසු අන්තර්ජාල වෙන්කිරීම", desc: "ඕනෑම වේලාවක තත්පර කිහිපයකින් වේලාවක් වෙන්කරන්න." },
      { title: "විශ්වාස කළ හැකි ගුණාත්මකභාවය", desc: "උසස් නිෂ්පාදන සහ සනීපාරක්ෂිත, සුහද පරිසරයක්." },
      { title: "ඔබේ විශේෂ අවස්ථා සඳහා", desc: "දෛනික රැකවරණයේ සිට විවාහ හා සැමරුම් දක්වා." },
    ],
    ctaTitle: "ඔබටම සංග්‍රහයක් කරගන්න සූදානම්ද?",
    ctaSub: "ඔබේ ඊළඟ වේලාව වෙන්කරන්න හෝ විශේෂ අවස්ථාවක් සඳහා පෙනුමක් ස්පර්ශ කිහිපයකින් වෙන්කරගන්න.",
    bookNow: "දැන් වෙන්කරන්න",
    contact: "අප අමතන්න",
  },
};

export default function HomePage() {
  // Read the active language from the provider (defensive about the prop name).
  const ctx = useLanguage() || {};
  const lang = (ctx.lang || ctx.language || ctx.locale) === "si" ? "si" : "en";
  const c = COPY[lang];

  return (
    <div className="overflow-hidden">
      {/* ============ HERO ============ */}
      <section className="relative isolate overflow-hidden bg-brand-900">
        {/* Background image — fades in once (enter), then gently zooms in & out forever */}
        <motion.div
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <motion.div
            className="absolute inset-0"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 14, ease: "easeInOut", repeat: Infinity }}
          >
            <Image src="/hero.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          </motion.div>
          {/* plum overlay keeps the brand look and the text readable */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/85 via-brand-800/75 to-brand-900/90" />
        </motion.div>

        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "26px 26px" }} />

        <div className="relative mx-auto max-w-6xl px-6 py-24 text-center sm:py-32">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.p variants={fadeUp} className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-gold-400">
              <Sparkles className="h-3.5 w-3.5 text-gold-400" /> {c.heroEyebrow}
            </motion.p>

            <motion.h1 variants={fadeUp} className="font-display text-4xl leading-tight text-white sm:text-6xl">
              {c.heroTitle1}<br />
              <span className="bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400 bg-clip-text text-transparent">{c.heroTitle2}</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-xl text-base text-white/70 sm:text-lg">
              {c.heroSub}
            </motion.p>

            <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/services"
                className="group inline-flex items-center gap-2 rounded-full bg-gold-500 px-7 py-3 text-sm font-semibold text-brand-900 shadow-lg shadow-gold-500/25 transition-all hover:bg-gold-400 hover:shadow-gold-400/30">
                {c.book}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/dress-jewelry"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                <Gem className="h-4 w-4 text-gold-400" /> {c.dress}
              </Link>
            </motion.div>
          </motion.div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ============ OFFERINGS (3-colour animated cards) ============ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading eyebrow={c.offerEyebrow} title={c.offerTitle} />

        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {OFFER_META.map((o, i) => {
            const Icon = o.icon;
            const copy = c.offerings[i];
            return (
              <motion.div key={o.href} variants={fadeUp} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
                {/* Every card shares one 3-colour combo: plum -> gold gradient
                    header, a white icon tile, and a white body. */}
                <Link href={o.href} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl">
                  <div className="relative h-20 bg-gradient-to-r from-brand-600 via-brand-500 to-gold-500">
                    <div className="pointer-events-none absolute inset-0 opacity-20"
                      style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />
                    <span className="absolute -bottom-6 left-6 grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand-600 shadow-md ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6 pt-9">
                    <h3 className="font-display text-xl text-brand-900">{copy.title}</h3>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-gray-500">{copy.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold-600">
                      {c.explore}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ============ DRESS & JEWELRY FEATURE ============ */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 to-brand-900 px-8 py-14 sm:px-14"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-gold-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 left-1/4 h-56 w-56 rounded-full bg-brand-400/25 blur-3xl" />

          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
                <Gem className="h-4 w-4" /> {c.featNew}
              </p>
              <h2 className="font-display text-3xl text-white sm:text-4xl">{c.featTitle}</h2>
              <p className="mt-4 max-w-md text-white/70">{c.featDesc}</p>
              <Link href="/dress-jewelry"
                className="group mt-7 inline-flex items-center gap-2 rounded-full bg-gold-500 px-7 py-3 text-sm font-semibold text-brand-900 transition-all hover:bg-gold-400">
                {c.featBtn}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="relative hidden lg:block">
              <div className="grid grid-cols-3 gap-3">
                {[Gem, Sparkles, Gift, Heart, Star, Scissors].map((Ic, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                    className={"grid aspect-square place-items-center rounded-2xl border border-white/10 " + (i % 2 ? "bg-white/5 text-gold-400" : "bg-white/10 text-white")}>
                    <Ic className="h-7 w-7" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============ WHY CHOOSE US ============ */}
      <section className="bg-gray-50/70 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading eyebrow={c.whyEyebrow} title={c.whyTitle} />

          <motion.div
            variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
            className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {WHY_META.map((Ic, i) => (
              <motion.div key={i} variants={fadeUp} whileHover={{ y: -4 }}
                className="rounded-3xl border border-gray-100 bg-white p-6 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                  <Ic className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-medium text-gray-900">{c.why[i].title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{c.why[i].desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
          className="relative overflow-hidden rounded-[2rem] border border-gold-500/20 bg-white px-8 py-14 text-center shadow-sm"
        >
          <div className="pointer-events-none absolute inset-x-0 -top-1 mx-auto h-1 w-40 rounded-full bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
          <Sparkles className="mx-auto h-8 w-8 text-gold-500" />
          <h2 className="mt-4 font-display text-3xl text-gray-900 sm:text-4xl">{c.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-md text-gray-500">{c.ctaSub}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/services"
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
              {c.bookNow} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-7 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
              {c.contact}
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="mx-auto max-w-2xl text-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">{eyebrow}</p>
      <h2 className="font-display text-3xl text-gray-900 sm:text-4xl">{title}</h2>
      <div className="mx-auto mt-4 h-0.5 w-16 rounded-full bg-gradient-to-r from-brand-500 to-gold-500" />
    </motion.div>
  );
}