"use client";

import { useState } from "react";
import Tabs from "@/components/ui/Tabs";
import ProductsTab from "@/components/catalogue/ProductsTab";
import ServicesTab from "@/components/catalogue/ServicesTab";
import PackagesTab from "@/components/catalogue/PackagesTab";
import DressJewelryTab from "@/components/catalogue/DressJewelryTab";

/**
 * "Our Services" — the catalogue manager with three tabs:
 * Products, Services and Packages. Each tab is a self-contained CRUD table.
 */
export default function CataloguePage() {
  const [tab, setTab] = useState("products");

  return (
    <div className="space-y-5">
      <Tabs
        tabs={[
          { key: "products", label: "Products" },
          { key: "services", label: "Services" },
          { key: "packages", label: "Packages" },
          { key: "dressjewelry", label: "Dress & Jewelry" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "products" && <ProductsTab />}
      {tab === "services" && <ServicesTab />}
      {tab === "packages" && <PackagesTab />}
      {tab === "dressjewelry" && <DressJewelryTab />}
    </div>
  );
}
