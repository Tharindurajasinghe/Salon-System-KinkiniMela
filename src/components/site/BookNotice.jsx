"use client";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Phone, MessageCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { useSalon } from "@/context/SalonProvider";

/**
 * Temporary "book now" action. Online slot booking arrives with the booking
 * engine; until then this points the customer to call / WhatsApp the salon.
 */
export default function BookNotice({ open, onClose, itemName }) {
  const { t } = useLanguage();
  const salon = useSalon();

  return (
    <Modal open={open} onClose={onClose} title={itemName} size="sm" footer={<Button variant="ghost" onClick={onClose}>{t("common.close")}</Button>}>
      <p className="text-sm text-gray-600">{t("contact.bookByPhone")}</p>
      <div className="mt-4 space-y-2">
        {salon?.phone && (
          <a href={`tel:${salon.phone}`} className="flex items-center gap-2 rounded-xl border border-gray-100 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-brand-50">
            <Phone className="h-4 w-4 text-brand-500" /> {salon.phone}
          </a>
        )}
        {salon?.whatsapp && (
          <a href={`https://wa.me/${salon.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-gray-100 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-brand-50">
            <MessageCircle className="h-4 w-4 text-green-500" /> WhatsApp
          </a>
        )}
      </div>
    </Modal>
  );
}
