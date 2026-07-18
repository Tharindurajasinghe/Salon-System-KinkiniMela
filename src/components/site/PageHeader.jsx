"use client";

/** Elegant inner-page header band with a gold hairline accent. */
export default function PageHeader({ title, subtitle }) {
  return (
    <div className="bg-gradient-to-b from-brand-50 to-white">
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-14 text-center">
        <div className="mx-auto mb-4 h-px w-12 bg-gold-500" />
        <h1 className="font-display text-4xl text-gray-900 sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}
