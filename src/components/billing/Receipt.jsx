"use client";

import { formatRs } from "@/lib/utils/currency";
import { formatSL } from "@/lib/utils/timezone";

/**
 * 80mm thermal receipt. Always mounted but visually hidden; when the cashier
 * prints, the global print CSS reveals only this block (#receipt-print).
 * Header details come from salon Settings so they stay in one place.
 */
export default function Receipt({ bill, salon }) {
  if (!bill) return null;

  return (
    <div id="receipt-print" className="hidden print:block">
      <div className="mx-auto w-[72mm] font-mono text-[11px] leading-tight text-black">
        {/* Header */}
        <div className="text-center">
          <p className="text-[15px] font-bold">{salon?.salonName || "Salon"}</p>
          {salon?.tagline && <p>{salon.tagline}</p>}
          {salon?.addressLine1 && <p>{salon.addressLine1}</p>}
          {salon?.addressLine2 && <p>{salon.addressLine2}</p>}
          {salon?.phone && <p>Tel: {salon.phone}</p>}
        </div>

        <Divider />

        {/* Meta */}
        <div className="flex justify-between"><span>Bill</span><span>{bill.billId}</span></div>
        <div className="flex justify-between">
          <span>Date</span>
          <span>{formatSL(bill.createdAt || new Date(), "yyyy-MM-dd hh:mm a")}</span>
        </div>
        {bill.customerName ? (
          <div className="flex justify-between"><span>Customer</span><span>{bill.customerName}</span></div>
        ) : null}
        {bill.customerPhone ? (
          <div className="flex justify-between"><span>Phone</span><span>{bill.customerPhone}</span></div>
        ) : null}

        <Divider />

        {/* Items */}
        {bill.items.map((it, i) => (
          <div key={i} className="mb-1">
            <div>{it.name}</div>
            <div className="flex justify-between">
              <span>{it.qty} x {formatRs(it.sellingPrice, 2)}</span>
              <span>{formatRs(it.sellingPrice * it.qty, 2)}</span>
            </div>
          </div>
        ))}

        <Divider />

        {/* Totals */}
        <Row label="Subtotal" value={formatRs(bill.subTotal)} />
        {bill.discount?.amount > 0 && (
          <Row
            label={`Discount${bill.discount.type === "percentage" ? ` (${bill.discount.value}%)` : ""}`}
            value={`- ${formatRs(bill.discount.amount)}`}
          />
        )}
        <div className="mt-1 flex justify-between text-[13px] font-bold">
          <span>TOTAL</span><span>{formatRs(bill.grandTotal)}</span>
        </div>
        {bill.isCredit ? (
          <>
            <Row label="Paid" value={formatRs(bill.paidAmount || 0)} />
            <Row label="Balance" value={formatRs((bill.grandTotal || 0) - (bill.paidAmount || 0))} />
          </>
        ) : (
          <>
            <Row label="Cash" value={formatRs(bill.cashPaid)} />
            <Row label="Change" value={formatRs(bill.change)} />
          </>
        )}

        <Divider />
        <p className="text-center">Thank you! Please come again.</p>
        <p className="mt-1 text-center text-[9px]">Powered by TAR Solutions</p>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="my-1 border-t border-dashed border-black" />;
}
function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
