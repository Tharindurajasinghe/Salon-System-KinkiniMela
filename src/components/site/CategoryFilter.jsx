"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useLanguage } from "@/context/LanguageProvider";
import { api } from "@/lib/utils/apiClient";

/** Category chip row for the product/service pages. */
export default function CategoryFilter({ type, value, onChange }) {
  const { t } = useLanguage();
  const [cats, setCats] = useState([]);

  useEffect(() => {
    api.get(`/api/public/categories?type=${type}`).then(setCats).catch(() => {});
  }, [type]);

  if (cats.length === 0) return null;

  const chip = (active) =>
    clsx(
      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
      active ? "border-brand-500 bg-brand-500 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-brand-300"
    );

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <button className={chip(!value)} onClick={() => onChange("")}>{t("common.all")}</button>
      {cats.map((c) => (
        <button key={c._id} className={chip(value === c._id)} onClick={() => onChange(c._id)}>{c.name}</button>
      ))}
    </div>
  );
}
